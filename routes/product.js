const express = require('express')
const {
    create, list, update, productsCount, listAll, remove, read, searchFilters, priceFilters, productStar, listRelated,
    listFeaturedProducts
} = require('../controllers/product')
const router = express.Router()

const {adminCheck, requireSignin, authCheck} = require('../middlewares/auth')
const {authorize} = require("../middlewares/authorize");
router.post('/product', requireSignin, authCheck, authorize('create', 'Product'), create)
router.get('/products/total', productsCount)
// router.get('/products/populate', populate)
router.get('/products/:count', listAll)
router.delete('/product/:slug', requireSignin, adminCheck, authorize('delete', 'Product'), remove)
router.get('/product/:slug', read)
router.put('/product/:slug', requireSignin, authCheck, authorize('update', 'Product'), update);
router.post('/products', list)
router.get('/featured/products', listFeaturedProducts)
router.put('/product/star/:productId', requireSignin, authCheck, authorize('update', 'Product'), productStar);
router.get('/product/related/:_id', listRelated)
router.post('/search/filters', searchFilters)
router.get('/min-max', priceFilters)


module.exports = router
