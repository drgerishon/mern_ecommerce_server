const Sub = require('../models/sub')
const slugify = require("slugify");
const {errorHandler} = require("../helpers/dbErrorHandler")
const Product = require("../models/product");
const Category = require("../models/category")


exports.create = async (req, res) => {
    try {
        const {name, parent} = req.body

        const slug = slugify(name).toLowerCase()
        const sub = await new Sub({name, parent, slug}).save()
        await Category.findByIdAndUpdate(parent, {$push: {subcategories: sub._id}}).exec()
        res.json(sub)
    } catch (err) {
        return res.status(400).json({
            error: errorHandler(err)
        });
    }

};

exports.list = async (req, res) => res.json(await Sub.find({}).sort({createdAt: -1}));

exports.read = async (req, res) => {
    const slug = req.params.slug.toLowerCase();


    let sub = await Sub.findOne({slug}).exec();


    const parent = await Category.findById(sub.parent)


    const products = await Product.find({subs: sub})
        .populate('category')
        .exec()
    res.json({sub, parent, products})
};

exports.update = async (req, res) => {

    const {name, parent} = req.body

    try {
        if (!parent) {
            const sub = await Sub.findOne({slug: req.params.slug}).exec()
            console.log('llllllll', sub)


        } else if (parent._id === undefined) {
            console.log('Changed parent', parent)
            const sub = await Sub.findOne({slug: req.params.slug}).exec()
            const subId = sub._id
            console.log('subId 1', subId)


            const oldParentId = sub.parent
            console.log(sub)
            console.log('oldId', oldParentId)

            const oldParentData = await Category.findById(oldParentId).exec()


            if (oldParentData && oldParentData.subcategories.includes(subId) === true) {
                await Category.updateOne({_id: oldParentId}, {$pull: {subcategories: subId}}, {new: true}).exec()
            }


            const updated = await Sub.findOneAndUpdate({slug: req.params.slug}, {
                name: name,
                parent: parent,
                slug: slugify(name)
            }, {upsert: true})
            await Category.findByIdAndUpdate(parent, {$push: {subcategories: subId}}).exec()

            res.json(updated)


        } else {
            console.log('Parent not changed')
            console.log(parent)
            const updated = await Sub.findOneAndUpdate(
                {slug: req.params.slug},
                {
                    name: name,
                    slug: slugify(name)
                },
                {new: true})

            res.json(updated)
        }


    } catch (e) {
        console.log(e)
        res.status(400).send('Update sub category  failed')

    }

}

exports.remove = async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();
        const deleted = await Sub.findOneAndDelete({slug})
        res.json(deleted);

    } catch (e) {
        res.status(400).send('Delete failed')
    }

};