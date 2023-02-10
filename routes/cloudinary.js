const express = require('express')
const {upload, remove} = require('../controllers/cloudinary')
const router = express.Router()

// //validators
// const {runValidation} = require('../validators')
// const {categoryCreateValidator} = require('../validators/category')
const {requireSignin, authCheck} = require('../middlewares/auth')


router.post('/upload-images', requireSignin, authCheck, upload)
router.post('/remove-image', requireSignin, authCheck, remove);


module.exports = router
