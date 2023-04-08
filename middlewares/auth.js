const User = require('../models/user');
const jwt = require('jsonwebtoken');

exports.adminCheck = async (req, res, next) => {
    const user = req.user;


    if (user.role.code !== 1000) {
        return res.status(400).json({
            error: 'Access denied',
        });
    }
    next();

};


exports.authCheck = (req, res, next) => {
    const authUserId = req.auth._id;
    User.findById({_id: authUserId})
        .populate('role') // Populate the 'role' field
        .exec((err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    error: 'User not found'
                });
            }
            req.user = user;
            next();
        });
};


exports.requireSignin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({error: 'Unauthorized access. Please provide a valid authentication token.'});
    }

    jwt.verify(token, process.env.JWT_SECRET, {algorithms: ['HS256']}, (err, decoded) => {
        if (err) {
            return res.status(401).json({error: 'Invalid token'});
        }
        req.auth = decoded;
        next();
    });
};

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.sendStatus(401);
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.profile = user;
        next();
    });
};
