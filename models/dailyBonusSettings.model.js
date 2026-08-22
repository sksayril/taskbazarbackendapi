let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    Monday: {
        type: Number,
        default: 0,
        require: true
    },
    Tuesday: {
        type: Number,
        default: 0,
        require: true
    },
    Wednesday: {
        type: Number,
        default: 0,
        require: true
    },
    Thursday: {
        type: Number,
        default: 0,
        require: true
    },
    Friday: {
        type: Number,
        default: 0,
        require: true
    },
    Saturday: {
        type: Number,
        default: 0,
        require: true
    },
    Sunday: {
        type: Number,
        default: 0,
        require: true
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        default: 'Coins'
    }
})

// Check if model already exists to avoid overwriting
let DailyBonusSettings
try {
    DailyBonusSettings = mongoose.model('dailyBonusSettings')
} catch (e) {
    DailyBonusSettings = mongoose.model('dailyBonusSettings', schema)
}

module.exports = DailyBonusSettings
