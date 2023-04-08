const Category = require('../models/category')
const Sub = require('../models/sub')
const Product = require('../models/product')
const slugify = require("slugify");

const {errorHandler} = require("../helpers/dbErrorHandler")

exports.create = async (req, res) => {
    try {
        const {name} = req.body
        const slug = slugify(name).toLowerCase()
        res.json(await new Category({name, slug}).save())

    } catch (err) {
        return res.status(400).json({
            error: errorHandler(err)
        });
    }

};

exports.list = async (req, res) => res.json(await Category.find({}).sort({createdAt: -1}));

exports.read = async (req, res) => {
    const slug = req.params.slug.toLowerCase();

    let category = await Category.findOne({slug}).exec();
    const catId = category._id

    const products = await Product.find({category: catId})
        .populate('category')
        .populate('postedBy', '_id name')
        .exec()

    console.log(products)

    res.json({category, products})

};

exports.update = async (req, res) => {

    const {name} = req.body
    try {
        const updated = await Category.findOneAndUpdate(
            {slug: req.params.slug},
            {
                name: name,
                slug: slugify(name)
            },
            {new: true})

        res.json(updated)

    } catch (e) {
        res.status(400).send(' Category Update failed')

    }

}

exports.remove = async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();
        console.log(slug)
        const cat = await Category.findOne({slug}).exec()


        if (cat.subcategories.length > 0) {
            await Sub.deleteMany({_id: {$in: cat.subcategories}}).exec()
        }
        const deleted = await Category.findOneAndDelete({slug})
        res.json(deleted);


    } catch (e) {
        res.status(400).send('Delete failed')
    }

};

exports.getSubs = (req, res) => {
    console.log(req.params._id)
    Sub.find({parent: req.params._id}).exec((error, result) => {
        if (error) {
            console.log(error)
        } else {
            res.json(result)
        }
    })

};
