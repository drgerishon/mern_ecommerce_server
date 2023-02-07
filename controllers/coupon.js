const Coupon = require("../models/coupon");


exports.create = async (req, res) => {
    console.log(req.body)


    try {
        const {name, expiry, discount} = req.body
        res.json(await new Coupon({name, expiry, discount}).save())
    } catch (e) {
        res.status(400).send('Cannot Create coupon')
    }

};

exports.list = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({createdAt: -1}).exec()
        res.json(coupons)

    } catch (e) {
        res.status(400).send('Cannot Create coupon')
    }

}


exports.remove = async (req, res) => {
    try {
        res.json(await Coupon.findByIdAndDelete(req.params.couponId).exec())
    } catch (e) {
        res.status(400).send('Delete failed')
    }

};