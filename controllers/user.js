const Product = require('../models/product')
const Cart = require('../models/cart')
const User = require("../models/user");
const Coupon = require("../models/coupon");
const Temp = require("../models/temp");
const Counter = require("../models/counter");
const ShortUniqueId = require('short-unique-id');
const sharedModule = require("../helpers/shared-safa-module");
const {formatPhoneNumber} = require("../helpers/phoneFormater");
const {timestamp} = require("../helpers/timestamp");
const axios = require("axios");
const Order = require("../models/order");
const Dollar = require("../models/dollar");
const paypal = require("@paypal/checkout-server-sdk")


exports.userCart = async (req, res) => {
    const {cart} = req.body
    let products = []
    const user = await User.findById(req.auth._id).exec()
    const cartExistsByThisUser = await Cart.findOne({orderedBy: user._id}).exec()

    if (cartExistsByThisUser) {
        await cartExistsByThisUser.remove()
    }

    for (let i = 0; i < cart.length; i++) {
        let productsObject = {}
        productsObject.product = cart[i]._id
        productsObject.count = cart[i].count
        let p = await Product.findById(cart[i]._id).select('price').exec()
        products.push(productsObject)
        productsObject.price = p.price


    }


    // using for i loop
    // let cartTotal = 0
    // for (let i = 0; i < products.length; i++) {
    //     cartTotal = cartTotal + (products[i].price * products[i].count)
    // }
    // console.log(JSON.stringify(cartTotal, null, 4))

    //using reduce method

    const cartTotal = products.reduce((sum, i) => sum + (i.price * i.count), 0)
    const orderedBy = user._id
    const savedCart = await new Cart({products, cartTotal, orderedBy}).save()
    res.json({ok: true})


    // console.log(JSON.stringify(savedCart, null, 4))

}

exports.getUserCart = async (req, res) => {
    const user = await User.findById(req.auth._id).exec()
    const cart = await Cart.findOne({orderedBy: user._id})
        .populate('products.product', '_id title price totalAfterDiscount')
        .exec()
    if (!cart) {
        return res.status(400).json({msg: 'No cart found'});
    }
    const {products, cartTotal, totalAfterDiscount} = cart
    res.json({products, cartTotal, totalAfterDiscount})


}
exports.emptyCart = async (req, res) => {
    const user = await User.findById(req.auth._id).exec()
    const cart = await Cart.findOneAndRemove({orderedBy: user._id}).exec()
    res.json(cart)


}
exports.saveAddress = async (req, res) => {
    try {
        const newAddress = {
            streetAddress: req.body.streetAddress,
            city: req.body.city,
            state: req.body.state,
            zipCode: req.body.zipCode,
            country: req.body.country,
            name: req.body.name,
            lat: req.body.lat,
            lng: req.body.lng,
            googlePlaceId: req.body.googlePlaceId
        };


        const userId = req.auth._id;
        const user = await User.findOne({_id: userId});
        if (!user) {
            return res.status(400).json({msg: 'User not found'});
        }
        let addressIndex = -1;
        user.address.forEach((address, index) => {
            if (address.googlePlaceId === newAddress.googlePlaceId) {
                addressIndex = index;
            }
        });

        if (addressIndex === -1) {
            await User.updateOne({_id: userId}, {$push: {address: newAddress}}, {new: true});
        } else {
            user.address[addressIndex].streetAddress = newAddress.streetAddress;
            user.address[addressIndex].city = newAddress.city;
            user.address[addressIndex].lat = newAddress.lat;
            user.address[addressIndex].lng = newAddress.lng;
            user.address[addressIndex].state = newAddress.state;
            user.address[addressIndex].zipCode = newAddress.zipCode;
            user.address[addressIndex].country = newAddress.country;
            user.address[addressIndex].googlePlaceId = newAddress.googlePlaceId;
            await user.save();
        }
        const updatedUser = await User.findOne({_id: userId}).sort({updatedAt: -1}).exec();
        res.status(200).json({ok: true, address: updatedUser.address});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }

}

exports.applyCouponToUserCart = async (req, res) => {
    const {coupon, couponUsed} = req.body
    if (couponUsed === false) {
        const validCoupon = await Coupon.findOne({code: coupon}).exec()
        const user = await User.findById(req.auth._id).exec()
        // Check if the coupon exists in the database

        if (!validCoupon) return res.json({err: "Coupon not found"});

        // Check if the coupon has expired

        if (validCoupon.expirationDate < Date.now())
            return res.json({err: "Coupon has expired"});

        if (validCoupon.isValid === false)
            return res.json({err: "Coupon is not valid"});

        // const previousCoupon = await Coupon.findOne({usedBy: user._id});
        // if (previousCoupon) return res.json({err: "You can only use one coupon per purchase"});
        const cart = await Cart.findOne({orderedBy: user._id}).populate('products.product', '_id title price').exec()

        const {cartTotal} = cart

        //recalculate total after discount

        const discountedAmount = (cartTotal * (validCoupon.discount / 100)).toFixed(2)
        let totalAfterDiscount = (cartTotal - discountedAmount)

        await Cart.findOneAndUpdate({orderedBy: user._id}, {
            totalAfterDiscount,
            coupon: validCoupon._id
        }, {new: true}).exec()


        res.json({totalAfterDiscount, ok: true})
    }


}


exports.createOrder = async (req, res) => {
    const {
        shippingAddress,
        shippingCost,
        paymentIntent,
        couponApplied,
        selectedPaymentMethod
    } = req.body;

    const user = await User.findById(req.auth._id).exec();
    const cart = await Cart.findOne({orderedBy: user._id}).populate({path: "products.product", select: "title"}).exec();
    const {products, coupon, cartTotal, totalAfterDiscount} = cart;
    let dollar = await Dollar.findOne({});
    let finalAmount
    if (couponApplied && totalAfterDiscount) {
        finalAmount = totalAfterDiscount
    } else {
        finalAmount = cartTotal
    }
    let convertedFinalAmount
    if (selectedPaymentMethod === 'Paypal' || selectedPaymentMethod === 'Card') {
        convertedFinalAmount = (dollar.rate * finalAmount)
    }


    if (selectedPaymentMethod === 'Paypal') {
        const Environment =
            process.env.NODE_ENV === "production"
                ? paypal.core.LiveEnvironment
                : paypal.core.SandboxEnvironment

        const paypalClient = new paypal.core.PayPalHttpClient(
            new Environment(
                process.env.PAYPAL_CLIENT_ID,
                process.env.PAYPAL_CLIENT_SECRET
            )
        )

        const request = new paypal.orders.OrdersCreateRequest()
        request.prefer("return=representation")
        request.requestBody({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: finalAmount,
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: finalAmount,
                            },
                        },
                    },
                    items: products.map(item => {
                        console.log(item.price)
                        return {
                            name: item.product.title,
                            unit_amount: {
                                currency_code: "USD",
                                value: item.price,
                            },
                            quantity: item.count,
                        }
                    }),
                },
            ]
        })

        try {
            const order = await paypalClient.execute(request)
            res.json({id: order.result.id})

        } catch (e) {

            res.status(500).json({error: e.message})
        }


    }
    if (selectedPaymentMethod === 'Card') {
        const newOrder = await new Order({
            products,
            paymentIntent,
            orderedBy: user._id,
            paymentMethod: paymentIntent.payment_method_types[0],
            shippingAddress,
            cartTotal,
            shippingCost,
            totalAfterDiscount
        }).save();

        // Decrement quantity, increment sold
        const bulkOption = products.map((item) => {
            return {
                updateOne: {
                    filter: {_id: item.product._id},
                    update: {$inc: {quantity: -item.count, sold: item.count}},
                },
            };
        });
        await Product.bulkWrite(bulkOption, {new: true});

        if (coupon) {
            const validCoupon = await Coupon.findById(coupon).exec();
            validCoupon.usedForPurchase = true;
            validCoupon.usageCount += 1;
            validCoupon.usedBy.push(user._id);
            await validCoupon.save();
        }
        res.json({orderId: newOrder.orderId, ok: true});
    }


}
;


exports.createMpesaOrder = async (req, res) => {


    const shortCode = 174379;
    const passkey = process.env.SAFARICOM_PASS_KEY;
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const phone = `254${req.body.phoneNumber}`
    const password = new Buffer.from(shortCode + passkey + timestamp).toString("base64");
    const data = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: 1,
        PartyA: phone,
        PartyB: 174379,
        PhoneNumber: phone,
        CallBackURL: "https://vihigahospital.go.ke/api/callback",
        AccountReference: "Test",
        TransactionDesc: "Test"
    };
    try {
        const result = await axios.post(url, data,
            {
                headers:
                    {
                        authorization: `Bearer ${req.daraja.access_token}`
                    }
            })
        res.json(result.data)
        console.log(result.data)

    } catch (error) {
        // handle error
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(error.response.data);
            console.error(error.response.status);
            console.error(error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.error(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error', error.message);
        }
        console.error(error.config);
    }

}

exports.getMpesaDetails = async (req, res) => {
    const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
    const shortCode = process.env.SAFARICOM_SHORT_CODE;
    const passkey = process.env.SAFARICOM_PASS_KEY;
    const password = new Buffer.from(shortCode + passkey + timestamp).toString("base64");
    const data = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: req.body.CheckoutRequestID,
    };


    try {
        const result = await axios.post(url, data, {headers: {authorization: `Bearer ${req.daraja.access_token}`,}})
        console.log('SUCCESS', result)
        res.json(result.data)
        // handle success
    } catch (error) {
        // handle error
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(error.response.data);
            console.error(error.response.status);
            console.error(error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.error(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error', error.message);
        }
        console.error(error.config);
    }
}
