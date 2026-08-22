let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    SponsorName: {
        type: String,
        required: true,
        trim: true
    },
    MobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    Email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    AppPromotion: {
        type: String,
        required: true,
        trim: true
    },
    Status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    AdminNotes: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})

// Index for efficient querying
schema.index({ UserId: 1 })
schema.index({ Status: 1 })
schema.index({ createdAt: -1 })

module.exports = mongoose.model('sponsorPromotionSubmission', schema)
