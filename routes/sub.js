const express = require('express')
const {create, list, update, read, remove} = require('../controllers/sub')
const router = express.Router()

const {adminCheck, requireSignin} = require('../middlewares/auth')
router.post('/sub', requireSignin, adminCheck, create)
router.get('/subs', list);
router.get('/sub/:slug', read);
router.put('/sub/:slug', requireSignin, adminCheck, update);
router.delete('/sub/:slug', requireSignin, adminCheck, remove);

module.exports = router
