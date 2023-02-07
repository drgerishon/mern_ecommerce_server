const Product = require('../models/product')
const Cart = require('../models/cart')
const User = require("../models/user");
const Coupon = require("../models/coupon");
const Order = require("../models/order");
const ShortUniqueId = require('short-unique-id');


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
        productsObject.color = cart[i].color
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

    console.log(cart)
    const {products, cartTotal, totalAfterDiscount} = cart
    res.json({products, cartTotal, totalAfterDiscount})


}
exports.emptyCart = async (req, res) => {
    const user = await User.findById(req.auth._id).exec()
    const cart = await Cart.findOneAndRemove({orderedBy: user._id}).exec()
    res.json(cart)


}
exports.saveAddress = async (req, res) => {
    await User.findOneAndUpdate({_id: req.auth._id}, {address: req.body.address}).exec()
    res.json({ok: true})

}

exports.applyCouponToUserCart = async (req, res) => {
    const {coupon} = req.body


    const validCoupon = await Coupon.findOne({name: coupon}).exec()
    console.log(validCoupon)

    if (validCoupon === null) {
        return res.json({err: 'Invalid Coupon'})
    }

    const user = await User.findById(req.auth._id).exec()

    const cart = await Cart.findOne({orderedBy: user._id}).populate('products.product', '_id title price').exec()

    const {cartTotal} = cart
    //recalculate total after discount

    const discountedAmount = (cartTotal * (validCoupon.discount / 100)).toFixed(2)
    let totalAfterDiscount = (cartTotal - discountedAmount)

    await Cart.findOneAndUpdate({orderedBy: user._id}, {totalAfterDiscount}, {new: true}).exec()
    res.json(totalAfterDiscount)


}
exports.creatOrder = async (req, res) => {
    const uid = new ShortUniqueId({length: 8});

    const {paymentIntent} = req.body.stripeResponse
    const user = await User.findById(req.auth._id).exec()
    const cart = await Cart.findOne({orderedBy: user._id}).exec()
    const {products} = cart

    let newOrder = await Order({
        products,
        paymentIntent,
        orderedBy: user._id,
        orderNumber: uid()
    }).save()

    //decrement quantity , increment sold

    const bulkOption = products.map(item => {
        return {
            updateOne: {
                filter: {_id: item.product._id},
                update: {$inc: {quantity: -item.count, sold: -item.count}}
            }
        }

    })

    let product = await Product.bulkWrite(bulkOption, {new: true})
    console.log(product)

    res.json({orderNumber: newOrder.orderNumber, ok: true})


}


exports.orders = async (req, res) => {


    const user = await User.findById(req.auth._id).exec()
    const userOrders = await Order.find({orderedBy: user._id}).populate('products.product').exec()
    res.json(userOrders)


}

exports.addToWishList = async (req, res) => {
    const {productId} = req.body
    await User.findByIdAndUpdate(req.auth._id, {$addToSet: {wishlist: productId}}).exec()
    res.json({ok: true})


}
exports.wishList = async (req, res) => {

    const list = await User.findById(req.auth._id).select('wishlist').populate('wishlist').exec()
    res.json(list)

}

exports.removeFromWishlist = async (req, res) => {
    const {productId} = req.params
    await User.findByIdAndUpdate(req.auth._id, {$pull: {wishlist: productId}}).exec()
    res.json({ok: true})
}

exports.creatCashOrder = async (req, res) => {


    const {cashOnDelivery, couponApplied} = req.body
    if (!cashOnDelivery || cashOnDelivery === false) {
        res.status(400).send('Create cash order failed')
    }
    const uid = new ShortUniqueId({length: 8});
    const uid1 = new ShortUniqueId({length: 32});

    const user = await User.findById(req.auth._id).exec()
    const cart = await Cart.findOne({orderedBy: user._id}).exec()
    const {products, cartTotal, totalAfterDiscount} = cart


    let finalAmount
    if (couponApplied && totalAfterDiscount) {
        finalAmount = totalAfterDiscount * 100
    } else {
        finalAmount = cartTotal * 100
    }


    let paymentIntent = {
        id: uid1(),
        amount: finalAmount,
        currency: 'KES',
        status: 'Cash On Delivery',
        created: Date.now(),
        payment_method_types: ['cash']


    }


    let newOrder = await Order({
        products,
        paymentIntent,
        orderedBy: user._id,
        orderNumber: uid(),
        orderStatus: 'Cash On Delivery'
    }).save()

    //decrement quantity , increment sold

    const bulkOption = products.map(item => {
        return {
            updateOne: {
                filter: {_id: item.product._id},
                update: {$inc: {quantity: -item.count, sold: -item.count}}
            }
        }

    })

    let product = await Product.bulkWrite(bulkOption, {new: true})
    console.log(product)

    res.json({orderNumber: newOrder.orderNumber, ok: true})


}