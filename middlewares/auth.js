const User = require('../models/user')
;
const jToken = require('jsonwebtoken')
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
                error: 'Access denied.You are not allowed to be here'
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


exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.sendStatus(401);
    }
    jToken.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.profile = user;
        next();
    });
}
