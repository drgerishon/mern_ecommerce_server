const express = require('express')
const {createPaymentIntent} = require('../controllers/stripe')
const router = express.Router()


const {requireSignin, authCheck} = require('../middlewares/auth')


router.post('/create-payment-intent', requireSignin, authCheck, createPaymentIntent)


module.exports = router
