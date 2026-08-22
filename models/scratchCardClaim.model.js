let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
    Day: {
        type: String,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        require: true
    },
    RewardAmount: {
        type: Number,
        require: true
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        require: true
    },
    WeekStartDate: {
        type: Date,
        require: true
    }
}, {
    timestamps: true
})

// Index to prevent duplicate claims for same day in same week
schema.index({ UserId: 1, Day: 1, WeekStartDate: 1 }, { unique: true })

module.exports = mongoose.model('scratchCardClaim', schema)
