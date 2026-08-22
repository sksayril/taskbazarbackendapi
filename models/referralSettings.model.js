let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    RewardForNewUser: {
        type: Number,
        default: 0,
        required: true
    },
    RewardForReferrer: {
        type: Number,
        default: 0,
        required: true
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        default: 'Coins'
    },
    // New fields for percentage-based referral rewards
    UsePercentage: {
        type: Boolean,
        default: false
    },
    ReferrerPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Percentage is calculated based on new user's earnings
    PercentageBasedOn: {
        type: String,
        enum: ['SignupBonus', 'TotalEarnings', 'WalletBalance'],
        default: 'SignupBonus'
    }
})

// Check if model already exists to avoid overwriting
let ReferralSettings
try {
    ReferralSettings = mongoose.model('referralSettings')
} catch (e) {
    ReferralSettings = mongoose.model('referralSettings', schema)
}

module.exports = ReferralSettings
