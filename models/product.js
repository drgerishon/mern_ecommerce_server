const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true,
            text: true,
            maxlength: 32
        },
        slug: {
            type: String,
            unique: true,
            index: true,
            lowercase: true
        },
        description: {
            type: String,
            required: true,
            text: true,
            maxlength: 2000
        },

        brand: {
            type: String,
        },
        type: {
            type: String,
        },
        price: {
            type: Number,
            required: true,
            maxlength: 32
        },
        category: {
            type: ObjectId,
            ref: "Category",
        },
        subs: [
            {
                type: ObjectId,
                ref: "Sub",
            },
        ],
        quantity: {
            type: Number
        },
        sold: {
            type: Number,
            default: 0
        },
        images: {
            type: Array
        },
        shipping: {
            type: String,
            enum: ['Yes', 'No']
        },

        postedBy: {
            type: ObjectId,
            ref: 'User'
        },
        rating: [
            {
                star: Number,
                postedBy: {type: ObjectId, ref: "User"}

            },
        ],

    },
    {timestamps: true}
)


module.exports = mongoose.model('Product', productSchema)
