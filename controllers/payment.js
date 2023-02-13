const Product = require('../models/product')
const Cart = require('../models/cart')
const User = require("../models/user");
const Coupon = require("../models/coupon");
const axios = require('axios').default;
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const paypal = require('paypal-rest-sdk');
const Dollar = require("../models/dollar");
const socketIO = require("../modules/socket");



exports.createPaymentIntent = async (req, res) => {
    const {couponApplied, selectedPaymentMethod} = req.body;
    const user = await User.findById(req.auth._id).exec();
    const cart = await Cart.findOne({orderedBy: user._id}).exec();
    const dollar = await Dollar.findOne({});

    const {cartTotal, totalAfterDiscount} = cart;
    let finalAmount;
    if (couponApplied && totalAfterDiscount) {
        finalAmount = totalAfterDiscount;
    } else {
        finalAmount = cartTotal;
    }

    const convertAmountToCents = (amount) => {
        return Math.round(amount * 100);
    };

    const convertedPayable = convertAmountToCents(dollar.rate * finalAmount);
    const convertedTotalCart = convertAmountToCents(dollar.rate * cartTotal);
    const convertedTotalAfterDiscount = convertAmountToCents(dollar.rate * totalAfterDiscount);

    const paymentIntent =
        selectedPaymentMethod === 'Card' &&
        (await stripe.paymentIntents.create({
            amount: convertedPayable,
            currency: 'USD',
            payment_method: 'pm_card_visa',
        }));

    const stripeClientSecret =
        selectedPaymentMethod === 'Card' && paymentIntent.client_secret;
    const paypalClientSecret =
        selectedPaymentMethod === 'Paypal' && process.env.PAYPAL_CLIENT_ID;

    res.send({
        stripeClientSecret,
        paypalClientSecret,
        cartTotal,
        convertedTotalAfterDiscount,
        convertedPayable,
        convertedTotalCart,
        totalAfterDiscount,
        payable: finalAmount,
    });
};


exports.lipaNaMpesaOnlineCallback = async = (req, res) => {
const io = socketIO.getIO();
    const transactionDetails = req.body
    const {
        ResultCode,
        ResultDesc,
        CheckoutRequestID,
        MerchantRequestID,
        CallbackMetadata
    } = transactionDetails.stkCallback


    if (!CallbackMetadata) {
        io.emit('failedMpesa', ResultDesc);
    }

    if (CallbackMetadata) {
        io.emit('succeedMpesa', ResultDesc);
        // const phone = CallbackMetadata.Item[4].Value
        // const amount = CallbackMetadata.Item[0].Value
        // const transactionCode = CallbackMetadata.Item[1].Value


    }

    return res.json('ok')


}


