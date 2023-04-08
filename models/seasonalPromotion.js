const mongoose = require("mongoose");
const seasonalPromotionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    bannerImage: {
        type: String,
    },
}, {timestamps: true});
module.exports = mongoose.model('SeasonalPromotion', seasonalPromotionSchema);
