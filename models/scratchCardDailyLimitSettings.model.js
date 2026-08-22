let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    DailyLimit: {
        type: Number,
        default: 1,
        min: 1
    },
    RewardAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    RewardCoins: {
        type: Number,
        default: 0,
        min: 0
    },
    IsActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('scratchCardDailyLimitSettings', schema)
