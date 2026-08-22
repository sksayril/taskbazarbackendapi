let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    DailyCaptchaLimit: {
        type: Number,
        default: 10,
        require: true
    },
    RewardPerCaptcha: {
        type: Number,
        default: 1,
        require: true
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        default: 'Coins'
    }
})

module.exports = mongoose.model('captchaSettings', schema)
