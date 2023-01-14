const express = require('express')
const {create, list, update, read, remove, getSubs} = require('../controllers/category')
const router = express.Router()

const {adminCheck, requireSignin} = require('../middlewares/auth')


router.post('/category', requireSignin, adminCheck, create)
router.get('/categories', list);
router.get('/category/:slug', read);
router.put('/category/:slug', requireSignin, adminCheck, update);
router.delete('/category/:slug', requireSignin, adminCheck, remove);
router.get('/category/subs/:_id', getSubs);

module.exports = router
