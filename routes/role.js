const {adminCheck, requireSignin} = require('../middlewares/auth')
const {createRole} = require("../controllers/role");
const express = require('express')
const router = express.Router()

router.post('/role', requireSignin, adminCheck, createRole);


module.exports = router
