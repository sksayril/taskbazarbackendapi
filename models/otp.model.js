let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    MobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    Otp: {
        type: String,
        required: true,
        trim: true
    },
    IsVerified: {
        type: Boolean,
        default: false
    },
    ExpiresAt: {
        type: Date,
        required: true,
        index: { expires: '10m' }
    }
}, {
    timestamps: true
})

schema.index({ MobileNumber: 1, createdAt: -1 })

module.exports = mongoose.model('otp', schema)
