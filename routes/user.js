const express = require('express')
const {
    userCart,
    saveAddress,
    getUserCart,
    orders,
    emptyCart,
    createOrder,
    initiateMpesaOrder,
    getMpesaDetails,
    initiatePayPal,
    capturePayPalPayment,
    createStripeOrder,
    createMpesaOrder,
    applyCouponToUserCart,
    lipaNaMpesaTrace,
    addToWishList,
    wishList,
    removeFromWishlist,
    creatCashOrder,
} = require('../controllers/user')
const router = express.Router()


const {adminCheck, requireSignin, authCheck} = require('../middlewares/auth')
const {getOAuthToken} = require("../middlewares/safaricom");


router.post('/user/cart', requireSignin, authCheck, userCart)
router.get('/user/cart', requireSignin, authCheck, getUserCart)
router.delete('/user/cart', requireSignin, authCheck, emptyCart)
router.post('/user/address', requireSignin, authCheck, saveAddress)
// router.get('/user/orders', requireSignin, authCheck, orders)

router.post('/user/cart/coupon', requireSignin, authCheck, applyCouponToUserCart)
router.post('/user/init-paypal-order', requireSignin, authCheck, initiatePayPal)
router.post('/user/capture-paypal-payment', requireSignin, authCheck, capturePayPalPayment)

router.post('/user/stripe-order', requireSignin, authCheck, createStripeOrder)




// router.post('/user/cash-order', requireSignin, authCheck, creatCashOrder)
router.post('/user/initiate-mpesa-order', requireSignin, authCheck, getOAuthToken, initiateMpesaOrder)
router.post('/user/mpesa-trace', requireSignin, authCheck, getOAuthToken, getMpesaDetails)


// router.post('/user/paypal-order', requireSignin, authCheck, createPaypalOrder)
// router.post('/user/wishlist', requireSignin, authCheck, addToWishList)
// router.get('/user/wishlist', requireSignin, authCheck, wishList)
// router.put('/user/wishlist/:productId', requireSignin, authCheck, removeFromWishlist)


module.exports = router
