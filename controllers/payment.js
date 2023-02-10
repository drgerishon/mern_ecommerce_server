const Product = require('../models/product')
const Cart = require('../models/cart')
const User = require("../models/user");
const Coupon = require("../models/coupon");
const axios = require('axios').default;
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const paypal = require('paypal-rest-sdk');

exports.createPaymentIntent = async (req, res) => {
    const {couponApplied, selectedPaymentMethod} = req.body

    const user = await User.findById(req.auth._id).exec()
    const cart = await Cart.findOne({orderedBy: user._id}).exec()
    const {cartTotal, totalAfterDiscount} = cart
    let finalAmount = 0
    if (couponApplied && totalAfterDiscount) {
        finalAmount = totalAfterDiscount
    } else {
        finalAmount = cartTotal
    }

    if (selectedPaymentMethod === 'Card') {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: finalAmount,
            currency: 'kes',
            payment_method: 'pm_card_visa',
        })
        res.send({
            clientSecret: paymentIntent.client_secret,
            cartTotal,
            totalAfterDiscount,
            payable: finalAmount
        })
    }
    if (selectedPaymentMethod === 'Paypal') {
        res.send({
            cartTotal,
            clientSecret: process.env.PAYPAL_CLIENT_ID,
            totalAfterDiscount,
            payable: finalAmount
        })
    }


}


exports.lipaNaMpesaOnlineCallback = async = (req, res) => {

    console.log(req.body)
    res.json("ok")

    // Extract transaction details from the Daraja callback
    // const transactionDetails = req.body;
    // const {
    //     ResultCode,
    //     ResultDesc,
    //     CheckoutRequestID,
    //     MerchantRequestID,
    //     CallbackMetadata
    // } = transactionDetails.Body;
    //
    // if (!CallbackMetadata) {
    //     return res.json('ok')
    // }
    //
    // console.log(CallbackMetadata)


}


