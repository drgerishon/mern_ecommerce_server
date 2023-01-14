const User = require('../models/user')
const {expressjwt: jwt} = require("express-jwt");


exports.adminCheck = (req, res, next) => {
    const adminUserId = req.auth._id;


    User.findById({_id: adminUserId}).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({
                error: 'Uh-oh,seems like you are lost. Access denied'
            });
        }
        req.profile = user;
        next();
    });

}


exports.authCheck = (req, res, next) => {
    const authUserId = req.auth._id;


    User.findById({_id: authUserId}).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        req.profile = user;
        next();
    });
};

exports.requireSignin = jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"], // added later
    userProperty: "auth",
});