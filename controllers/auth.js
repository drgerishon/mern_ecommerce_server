const User = require('../models/user')
const shortId = require('shortid')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const {errorHandler} = require("../helpers/dbErrorHandler");
const {OAuth2Client} = require('google-auth-library')
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.currentUser = async (req, res) => {
    const email = req.body
    User.findOne({email}).exec((err, user) => {
        if (err) {
            throw new Error(err)
        }
        res.json(user)
    })
}

exports.preSignup = (req, res) => {
    User.findOne({email: req.body.email.toLowerCase()}, (err, user) => {
        if (user) {
            return res.status(400).json({
                error: 'Email is taken'
            });
        }

        const token = jwt.sign(req.body, process.env.JWT_ACCOUNT_ACTIVATION, {expiresIn: '10m'})
        const emailData = {
            from: process.env.MAIL_USERNAME,
            to: req.body.email,
            subject: `Account activation link`,
            html: `
            <p>Please use the following link to activate your account.The link expires after 10 minutes</p>
            <p>${process.env.CLIENT_URL}/auth/complete/${token}</p>
           <br>
          
            <p>This email may contain sensetive information</p>
            <p>https://myfarm.com</p>`
        }
        sgMail.send(emailData).then(sent => {
            console.log(sent)
            return res.json({
                message: `Check ${req.body.email} within 10 minutes`
            });
        });
    })
}
exports.signup = (req, res) => {
    const token = req.body.token

    if (token) {
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    error: "Link expired.Sign up again"
                });
            }
            const {firstName, middleName, surname, phone, gender, terms, email, password} = jwt.decode(token)
            console.log(firstName, middleName, surname, gender, terms, email, password)


            let username = shortId.generate();
            let profile = `${process.env.CLIENT_URL}/profile/${username}`;

            const newUser = new User({
                firstName,
                middleName,
                surname,
                gender,
                terms,
                email,
                password,
                profile,
                username
            });
            newUser.save((err, doc) => {
                if (err) {
                    return res.status(400).json({
                        error: err.message
                    });
                }
                return res.json({
                    message: 'Signup success! Please signin.'
                });
            })

        })
    } else {
        return res.json({
            message: 'Something went wrong try again'
        });
    }
}
exports.signupByAdmin = (req, res) => {
    if (req.body.email) {
        User.findOne({email: req.body.email}).exec((err, user) => {
            if (user) {
                return res.status(400).json({
                    error: 'Email is taken'
                });
            }
        });
    }

    const {name, email, password, designation, role, hospitalRole} = req.body;


    let username = shortId.generate();
    let profile = `${process.env.CLIENT_URL}/profile/${username}`;
    let savedMail
    let savedPass


    if (!email) {
        savedMail = shortId.generate() + '@dummy.com'
        savedPass = shortId.generate();

    } else {
        savedMail = email
        savedPass = password

    }


    let newUser = new User({
        name: name,
        email: savedMail,
        profile,
        username,
        hmt: true,
        password: savedPass,
        designation: designation,
        role: role,
        hospitalRole: hospitalRole
    });

    newUser.save((err, success) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }

        res.json({
            message: 'Hmt member added to list successfully.'
        });
    });
};

exports.signin = (req, res) => {

    const {email, password} = req.body;
    // check if user exist
    User.findOne({email}).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup.'
            });
        }
        // authenticate
        if (!user.authenticate(password)) {
            return res.status(400).json({
                error: 'Email and password do not match.'
            });
        }
        // generate a token and send to client
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'});

        res.cookie('token', token, {expiresIn: '1d'});

        const {_id, username, address, cart, firstName, middleName, surname, email, role} = user;
        return res.json({
            user: {_id, token, address, cart, username, firstName, middleName, surname, email, role}
        });
    });
};
exports.signout = (req, res) => {
    res.clearCookie('token');
    res.json({
        message: 'Signout success'
    });
};


exports.forgotPassword = (req, res) => {


    const {email} = req.body;
    User.findOne({email}, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                error: 'User with that email does not exist'
            });
        }

        const token = jwt.sign({_id: user._id}, process.env.JWT_RESET_PASSWORD, {expiresIn: '10m'});

        // email
        const emailData = {
            from: process.env.MAIL_USERNAME,
            to: email,
            subject: `Password reset link`,
            html: `
            <p>Please use the following link to reset your password:</p>
            <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>myfarm.com</p>
        `
        };
        // populating the db > user > resetPasswordLink
        return user.updateOne({resetPasswordLink: token}, (err, success) => {
            if (err) {
                return res.json({error: errorHandler(err)});
            } else {
                sgMail.send(emailData).then(sent => {
                    return res.json({
                        message: ` Sent to ${email}. Link expires in 10min.`
                    });
                });
            }
        });
    });
};


exports.resetPassword = (req, res) => {
    const {resetPasswordLink, password} = req.body;

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Try again'
                });
            }
            User.findOne({resetPasswordLink}, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'Something went wrong.Try later'
                    });
                }
                const updatedFields = {
                    password: password,
                    resetPasswordLink: ''
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: errorHandler(err)
                        });
                    }

                    res.json({
                        message: `Great! Now you can login with your new password`
                    });
                });
            });
        });
    }

};


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
exports.googleLogin = (req, res) => {

    console.log(client)
    const idToken = req.body.tokenId

    client.verifyIdToken({idToken, audience: process.env.GOOGLE_CLIENT_ID}).then(response => {
        const {email_verified, name, email, jti} = response.payload
        if (email_verified) {
            User.findOne({email}).exec((err, user) => {
                if (user) {
                    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'});

                    res.cookie('token', token, {expiresIn: '1d'});
                    const {_id, username, name, email, role} = user;
                    return res.json({
                        token,
                        user: {_id, username, name, email, role}
                    });
                } else {

                    let username = shortId.generate();
                    let profile = `${process.env.CLIENT_URL}/profile/${username}`;
                    let password = jti


                    const newUser = new User({name, email, password, profile, username});
                    newUser.save((err, data) => {
                        if (err) {
                            return res.status(400).json({
                                error: errorHandler(err)
                            });
                        }
                        const token = jwt.sign({_id: data._id}, process.env.JWT_SECRET, {expiresIn: '1d'});
                        res.cookie('token', token, {expiresIn: '1d'});
                        const {_id, username, name, email, role} = data;
                        return res.json({
                            token,
                            user: {_id, username, name, email, role}
                        });
                    })


                }
            })
        } else {

            return res.status(400).json({
                error: "Google login failed...Try again"
            })
        }

    })

}