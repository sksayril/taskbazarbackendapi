let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    SignupBonusAmount: {
        type: Number,
        default: 0,
        required: true
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        default: 'Coins'
    }
})

// Check if model already exists to avoid overwriting
let SignupBonusSettings
try {
    SignupBonusSettings = mongoose.model('signupBonusSettings')
} catch (e) {
    SignupBonusSettings = mongoose.model('signupBonusSettings', schema)
}

module.exports = SignupBonusSettings
