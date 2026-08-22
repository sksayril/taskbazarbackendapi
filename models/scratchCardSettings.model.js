let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    Sunday: {
        type: Number,
        default: 0
    },
    Monday: {
        type: Number,
        default: 0
    },
    Tuesday: {
        type: Number,
        default: 0
    },
    Wednesday: {
        type: Number,
        default: 0
    },
    Thursday: {
        type: Number,
        default: 0
    },
    Friday: {
        type: Number,
        default: 0
    },
    Saturday: {
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

module.exports = mongoose.model('scratchCardSettings', schema)
