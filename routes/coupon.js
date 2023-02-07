const express = require('express')
const {create, remove, list} = require('../controllers/coupon')
const router = express.Router()
const {adminCheck, requireSignin} = require('../middlewares/auth')


router.post('/coupon', requireSignin, adminCheck, create)
router.get('/coupons', requireSignin, adminCheck, list);
router.delete('/coupon/:couponId', requireSignin, adminCheck, remove);



module.exports = router
