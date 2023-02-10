const express = require('express')
const {
    create, list, update, productsCount, listAll, remove, read, searchFilters, priceFilters, productStar, listRelated
} = require('../controllers/product')
const router = express.Router()

const {adminCheck, requireSignin, authCheck} = require('../middlewares/auth')
router.post('/product', requireSignin, adminCheck, create)
router.get('/products/total', productsCount)
// router.get('/products/populate', populate)
router.get('/products/:count', listAll)
router.delete('/product/:slug', requireSignin, adminCheck, remove)
//
router.get('/product/:slug', read)
router.put('/product/:slug', requireSignin, adminCheck, update);

router.post('/products', list)
router.put('/product/star/:productId', requireSignin, authCheck, productStar);
router.get('/product/related/:_id', listRelated)

router.post('/search/filters', searchFilters)
router.get('/min-max', priceFilters)


module.exports = router
