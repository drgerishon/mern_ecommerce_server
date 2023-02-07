const express = require('express')
const {
    userCart,
    saveAddress,
    getUserCart,
    orders,
    emptyCart,
    creatOrder,
    applyCouponToUserCart,
    addToWishList,
    wishList,
    removeFromWishlist,
    creatCashOrder
} = require('../controllers/user')
const router = express.Router()


const {adminCheck, requireSignin, authCheck} = require('../middlewares/auth')


router.post('/user/cart', requireSignin, authCheck, userCart)
router.get('/user/cart', requireSignin, authCheck, getUserCart)
router.delete('/user/cart', requireSignin, authCheck, emptyCart)
router.post('/user/address', requireSignin, authCheck, saveAddress)
router.get('/user/orders', requireSignin, authCheck, orders)
router.post('/user/cart/coupon', requireSignin, authCheck, applyCouponToUserCart)
router.post('/user/order', requireSignin, authCheck, creatOrder)
router.post('/user/cash-order', requireSignin, authCheck, creatCashOrder)
router.post('/user/wishlist', requireSignin, authCheck, addToWishList)
router.get('/user/wishlist', requireSignin, authCheck, wishList)

router.put('/user/wishlist/:productId', requireSignin, authCheck, removeFromWishlist)


module.exports = router
