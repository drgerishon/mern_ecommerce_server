const slugify = require("slugify");
const Product = require("../models/product");
const User = require("../models/user");
const {errorHandler} = require("../helpers/dbErrorHandler");
exports.list = async (req, res) => {
    try {
        const {sort, order, page} = req.body

        const currentPage = page || 1
        const perPage = 4

        let products = await Product.find({})
            .skip((currentPage - 1) * perPage)
            .populate('category')
            .populate('subs')
            .sort([[sort, order]])
            .limit(parseInt(perPage))
            .exec()
        res.json(products)

    } catch (e) {
        res.status(400).send({error: e.message})
    }

};

exports.create = async (req, res) => {
    try {
        req.body.slug = slugify(req.body.title)
        const newProduct = await new Product(req.body).save()
        res.json(newProduct)


    } catch (err) {
        console.log(err)
        // res.status(400).send(' Product Create failed')
        res.status(400).send({error: err.message})
    }
};
exports.listFeaturedProducts = async (req, res) => {
    console.log('hitted')
    try {
        const featuredProducts = await Product.find({ isFeatured: true })
            .sort({ createdAt: -1 })
            .populate('category')
            .populate('subs')
            .exec();

        res.json(featuredProducts);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};

exports.listAll = async (req, res) => {
    let products = await Product.find({}).sort({createdAt: -1})
        .limit(parseInt(req.params.count))
        .populate('category')
        .populate('subs')
        .exec()


    res.json(products)
};

exports.read = async (req, res) => {
    let product = await Product.findOne({slug: req.params.slug})
        .populate('category')
        .populate('subs')
        .exec()
    res.json(product)
};


exports.remove = async (req, res) => {
    try {
        const deletedProduct = await Product.findOneAndRemove(req.params.slug).exec()
        console.log(deletedProduct)
        res.json(deletedProduct)

    } catch (e) {
        res.status(400).send('Product delete failed')
    }

}

exports.update = async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title)
        }
        const updated = await Product.findOneAndUpdate({slug: req.params.slug}, req.body, {new: true}).exec()
        res.json(updated)

    } catch (err) {
        res.status(400).send({error: err.message})
    }

}

exports.productsCount = async (req, res) => {
    try {
        let total = await Product.find().estimatedDocumentCount().exec()
        res.json(total)
    } catch (e) {
        res.status(400).send({error: e.message})
    }

}

exports.productStar = async (req, res) => {
    const product = await Product.findById(req.params.productId).exec()
    const user = await User.findById(req.auth._id).exec()
    const {star} = req.body


    let existingRatingObject = product.rating.find(ele => (ele.postedBy.toString() === user._id.toString()))

    console.log(existingRatingObject)


    if (existingRatingObject === undefined) {
        let ratingAdded = await Product.findByIdAndUpdate(product._id, {
            $push: {rating: {star: star, postedBy: user._id}}
        }, {new: true}).exec()

        console.log('Rating added', ratingAdded)
        res.json(ratingAdded)

    } else {


        let ratingUpdated = await Product.updateOne(
            {rating: {$elemMatch: existingRatingObject},},
            {$set: {"rating.$.star": star}},
            {new: true}
        ).exec()
        res.json(ratingUpdated)

    }


}

exports.listRelated = async (req, res) => {

    console.log(req.params)
    const product = await Product.findById(req.params._id).exec()
    const related = await Product.find({
        _id: {$ne: product._id},
        category: {$in: product.category}
    }).limit(3)
        .populate('category')
        .populate('subs')
        .exec()

    res.json(related)

}


const handleQuery = async (req, res, query) => {
    const products = await Product.find({$text: {$search: query}})
        .populate('category', '_id name')
        .populate('subs', '_id name')
        .populate('postedBy', '_id name')
        .exec()

    res.json(products)


}
const handlePrice = async (req, res, price) => {
    try {
        const products = await Product.find({
            price:
                {$gte: price[0], $lte: price[1]}
        })
            .populate('category', '_id name')
            .populate('subs', '_id name')
            .populate('postedBy', '_id name')
            .exec()
        res.json(products)

    } catch (e) {
        console.log(e)

    }
}
const handleCategory = async (req, res, category) => {
    try {
        const products = await Product.find({category})
            .populate('category', '_id name')
            .populate('subs', '_id name')
            .populate('postedBy', '_id name')
            .exec()
        res.json(products)

    } catch (e) {
        console.log(e)

    }
}
const handleSub = async (req, res, sub) => {
    console.log('SUBSSSS', sub)
    try {
        const products = await Product.find({subs: sub})
            .populate('category', '_id name')
            .populate('subs', '_id name')
            .populate('postedBy', '_id name')
            .exec()
        res.json(products)

    } catch (e) {
        console.log(e)

    }
}
const handleShipping = async (req, res, shipping) => {
    try {
        const products = await Product.find({shipping})
            .populate('category', '_id name')
            .populate('subs', '_id name')
            .populate('postedBy', '_id name')
            .exec()
        res.json(products)

    } catch (e) {
        console.log(e)

    }

}
const handleStars = (req, res, stars) => {

    Product.aggregate([
        {
            $project: {
                document: "$$ROOT",
                floorAverage: {
                    $floor: {
                        $avg: "$rating.star"
                    }
                }
            }
        }, {$match: {floorAverage: stars}}
    ])
        .limit(12)
        .exec((error, aggregates) => {
            console.log('Aggregates', aggregates)
            if (error) console.log('AGGREGATE ERROR', error)
            Product.find({_id: aggregates})
                .populate('category', '_id name')
                .populate('subs', '_id name')
                .populate('postedBy', '_id name')
                .exec((error, products) => {
                    if (error) console.log('PRODUCT AGGREGATE ERROR', error)
                    console.log(products)
                    res.json(products)
                })

        })

}

exports.searchFilters = async (req, res) => {
    const {query, price, category, sub, stars, shipping, color, brand} = req.body

    if (query) {
        console.log(query)
        await handleQuery(req, res, query)
    }
    if (price !== undefined) {
        await handlePrice(req, res, price)
    }
    if (category) {
        await handleCategory(req, res, category)
    }
    if (stars) {
        await handleStars(req, res, stars)
    }
    if (sub) {
        await handleSub(req, res, sub)
    }
    if (shipping) {
        await handleShipping(req, res, shipping)
    }
    // if (color) {
    //     await handleColor(req, res, color)
    // }
    // if (brand) {
    //     await handleBrand(req, res, brand)
    // }


}

exports.priceFilters = async (req, res) => {
    const lowest = await Product.find({})
        .sort({price: 1})
        .select('price')
        .limit(1)
        .exec()

    const highest = await Product.find({})
        .sort({price: -1})
        .select('price')
        .limit(1)
        .exec()

    let minMax = []
    lowest.map(l => {
        highest.map(h => {
            minMax.push({lowestPriced: l.price, highestPriced: h.price})
        })
    })


    res.json(...minMax)

}