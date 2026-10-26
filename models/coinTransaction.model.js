let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    Type: {
        type: String,
        enum: ['Credit', 'Debit'],
        required: true
    },
    Source: {
        type: String,
        enum: ['TaskCompletion', 'Referral', 'Offerwall', 'ScratchCard', 'SpinWheel', 'DailyBonus', 'Captcha', 'CoinConversion', 'SignupBonus', 'AdminAdjustment', 'Other'],
        required: true,
        index: true
    },
    Coins: {
        type: Number,
        required: true,
        min: 0
    },
    BalanceAfter: {
        type: Number,
        default: 0
    },
    Description: {
        type: String,
        default: ''
    },
    ReferenceId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})

schema.index({ UserId: 1, createdAt: -1 })
schema.index({ UserId: 1, Source: 1 })

module.exports = mongoose.model('coinTransaction', schema)
