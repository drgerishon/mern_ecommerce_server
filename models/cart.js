const mongoose = require('mongoose')
const Coupon = require("./coupon");
const {ObjectId} = mongoose.Schema

const cartSchema = new mongoose.Schema(
    {
        products: [
            {
                product: {type: ObjectId, ref: 'Product'},
                count: Number,
                price: Number
            }
        ],
        cartTotal: Number,
        totalAfterDiscount: {
            type: Number
        },
        discountAmount: Number,
        orderedBy: {type: ObjectId, ref: 'User'},
        // customerLocation: {
        //     type: String,
        // },
        dollar: {},
        currencyCode: {
            type: String,
            default: 'KES'
        },
        coupon: {
            type: ObjectId,
            ref: "Coupon"
        }
    },
    {timestamps: true}
)


module.exports = mongoose.model('Cart', cartSchema)
