const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: 'Name is required',
            minlength: [3, 'Too short'],
            maxlength: [32, 'Too long']
        },

        subcategories: [{
            type: ObjectId,
            ref: 'Sub'
        }],

        slug: {
            type: String,
            unique: true,
            index: true,
            lowercase: true
        }
    },
    {timestamps: true}
)


module.exports = mongoose.model('Category', categorySchema)
