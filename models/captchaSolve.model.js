let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
    SolveDate: {
        type: Date,
        default: Date.now,
        require: true
    },
    RewardAmount: {
        type: Number,
        default: 0
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        default: 'Coins'
    }
}, {
    timestamps: true
})

// Index for efficient querying by user and date
schema.index({ UserId: 1, SolveDate: 1 })

module.exports = mongoose.model('captchaSolve', schema)
