const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema

const subSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: 'Name is required',
            minlength: [3, 'Too short'],
            maxlength: [32, 'Too long']
        },
        parent: {
            type: ObjectId,
            ref:"Category",
            required: true 

        },

        slug: {
            type: String,
            unique: true,
            index: true,
            lowercase: true
        }
    },
    {timestamps: true}
)


module.exports = mongoose.model('Sub', subSchema)
