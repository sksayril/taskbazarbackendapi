let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    ClaimDate: {
        type: Date,
        required: true
    },
    RewardAmount: {
        type: Number,
        default: 0,
        required: true
    },
    RewardCoins: {
        type: Number,
        default: 0,
        required: true
    }
}, {
    timestamps: true
})

// Index to prevent duplicate claims for same user on same day
// ClaimDate is normalized to midnight for daily tracking
schema.index({ UserId: 1, ClaimDate: 1 }, { unique: false })

// Compound index for efficient querying
schema.index({ UserId: 1, ClaimDate: 1 })

module.exports = mongoose.model('scratchCardDailyLimitClaim', schema)
