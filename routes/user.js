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
    capturePayPalPaymentAndSavePaypalOrder,
    createStripeOrder,
    createMpesaOrder,
    applyCouponToUserCart,
    lipaNaMpesaTrace,
    verifyTokenController,
    addToWishList,
    wishList,
    removeFromWishlist,
    creatCashOrder,
} = require('../controllers/user')
const router = express.Router()


const {adminCheck, requireSignin, authCheck, verifyToken} = require('../middlewares/auth')
const {getOAuthToken} = require("../middlewares/safaricom");


router.post('/user/cart', requireSignin, authCheck, userCart)
router.get('/user/cart', requireSignin, authCheck, getUserCart)
router.delete('/user/cart', requireSignin, authCheck, emptyCart)
router.post('/user/address', requireSignin, authCheck, saveAddress)
router.post('/user/verifyToken', requireSignin, authCheck, saveAddress)
router.get('/user/verifyToken', verifyToken, verifyTokenController )
// router.get('/user/orders', requireSignin, authCheck, orders)

router.post('/user/cart/coupon', requireSignin, authCheck, applyCouponToUserCart)
router.post('/user/init-paypal-order', requireSignin, authCheck, initiatePayPal)
router.post('/user/capture-paypal-payment-and-save-order', requireSignin, authCheck, capturePayPalPaymentAndSavePaypalOrder)

router.post('/user/stripe-order', requireSignin, authCheck, createStripeOrder)


// router.post('/user/cash-order', requireSignin, authCheck, creatCashOrder)
router.post('/user/initiate-mpesa-order', requireSignin, authCheck, getOAuthToken, initiateMpesaOrder)
router.get('/user/mpesa-trace', getOAuthToken, getMpesaDetails)


// router.post('/user/paypal-order', requireSignin, authCheck, createPaypalOrder)
// router.post('/user/wishlist', requireSignin, authCheck, addToWishList)
// router.get('/user/wishlist', requireSignin, authCheck, wishList)
// router.put('/user/wishlist/:productId', requireSignin, authCheck, removeFromWishlist)


module.exports = router
