const express = require('express')
const {
    signup,
    signout,
    signin,
    preSignup,
    signupByAdmin,
    forgotPassword,
    resetPassword,
    currentUser,
    googleLogin
} = require('../controllers/auth')

const {adminCheck, requireSignin} = require('../middlewares/auth')


const router = express.Router()

//validators
const {runValidation} = require('../validators')
const {
    userSignupValidator,
    userSigninValidator,
    forgotPasswordValidator,
    resetPasswordValidator
} = require('../validators/auth')


router.post('/pre-signup', userSignupValidator, runValidation, preSignup)
router.post('/signup', signup)
router.post('/super-signup', signupByAdmin)
router.post('/signin', signin)
router.post('/current-admin', requireSignin, adminCheck, currentUser)
router.get('/signout', signout)
router.put('/forgot-password', forgotPasswordValidator, runValidation, forgotPassword)
router.put('/reset-password', resetPasswordValidator, runValidation, resetPassword)
router.post('/google-login', googleLogin)

module.exports = router
