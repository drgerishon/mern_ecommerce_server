const mongoose = require('mongoose')
const crypto = require('crypto')
const {ObjectId} = mongoose.Schema
const addressSchema = new mongoose.Schema({
    streetAddress: {
        type: String,
    },
    place: {},
    city: {
        type: String,
    },
    state: {
        type: String,

    },
    zipCode: {
        type: String,
    },
    country: {
        type: String,
    },
    lat: {
        type: Number,
        required: true
    },

    lng: {
        type: Number,
        required: true
    },
    name: {
        type: String,
    },
    googlePlaceId: {
        type: String,
        required: true
    }
}, {timestamps: true});


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

        // phoneNumber: {
        //     type: String,
        //     validate: {
        //         validator: function (v) {
        //             return /^(?:\+254|0)[17]\d{8}$/.test(v);
        //         },
        //         message: '{VALUE} is not a valid  phone number!'
        //     },
        //     required: [true, 'User phone number required']
        // },
        firstName: {
            type: String,
            trim: true,
            required: true,
            max: 32,
        },
        middleName: {
            type: String,
            trim: true,
            max: 32,
        }
        , surname: {
            type: String,
            trim: true,
            required: true,
            max: 32,
        },
        drivingLicense: {
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
            enum: ["subscriber", "admin", "carrier", "farmer"]
        },
        dob: {
            type: Date,
        },
        terms: {
            type: String,
            required: true,
            default: false
        },

        gender: {
            type: String,
            enum: ["male", "female", "intersex", "undisclosed"]
        },
        blocked: {
            type: Boolean,
            default: false,
        },
        suspended: {
            type: Boolean,
            default: false,

        },
        cart: {
            type: Array,
            default: []
        },

        address: {},

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
