const mongoose = require('mongoose')
const crypto = require('crypto')
const {ObjectId} = mongoose.Schema
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            trim: true,
            required: true,
            max: 32,
            unique: true,
            index: true,
            lowercase: true,
        },
        phones: [
            {
                countryCode: {
                    type: String,
                    default: '+254',
                },
                phoneNumber: String,
            }],

        name: {
            type: String,
            trim: true,
            required: true,
            max: 32,
        },
        drivingLisense: {
            type: String,
        },
        idNo: {
            type: String,
        },
        location: String,
        email: {
            type: String,
            trim: true,
            unique: true,
            index: true,
            required: true,
            lowercase: true,
        },
        role: {
            type: String,
            default: 'subscriber',
        },
        cart: {
            type: Array,
            default: []
        },

        address: {
            type: String,
        },

        wishlist: [{type: ObjectId, ref: "Product"}],

        hashed_password: {
            type: String,
            required: true,
        },
        salt: String,
        about: {
            type: String,
        },
        resetPasswordLink: {
            data: String,
            default: '',
        },
    },
    {timestamps: true}
)

userSchema
    .virtual('password')
    .set(function (password) {
        // create a temporarity variable called _password
        this._password = password
        // generate salt
        this.salt = this.makeSalt()
        // encryptPassword
        this.hashed_password = this.encryptPassword(password)
    })
    .get(function () {
        return this._password
    })

userSchema.methods = {
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password
    },

    encryptPassword: function (password) {
        if (!password) return ''
        try {
            return crypto
                .createHmac('sha1', this.salt)
                .update(password)
                .digest('hex')
        } catch (err) {
            return ''
        }
    },

    makeSalt: function () {
        return Math.round(new Date().valueOf() * Math.random()) + ''
    },
}

module.exports = mongoose.model('User', userSchema)
