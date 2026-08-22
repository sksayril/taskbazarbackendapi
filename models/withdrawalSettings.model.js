let mongoose = require('mongoose')

const DEFAULT_WITHDRAWAL_DENOMINATIONS = [10, 20, 30, 50]

let schema = new mongoose.Schema({
    MinimumWithdrawalAmount: {
        type: Number,
        required: true,
        default: 100,
        min: 1
    },
    DailyWithdrawalRequestLimit: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
        max: 8
    },
    WithdrawalDenominations: {
        type: [Number],
        required: true,
        default: DEFAULT_WITHDRAWAL_DENOMINATIONS
    }
}, {
    timestamps: true
})

// Ensure only one settings document exists
schema.statics.getSettings = async function() {
    let settings = await this.findOne()
    if (!settings) {
        settings = await this.create({
            MinimumWithdrawalAmount: 100,
            DailyWithdrawalRequestLimit: 1,
            WithdrawalDenominations: DEFAULT_WITHDRAWAL_DENOMINATIONS
        })
    }

    let needsSave = false

    // backward compatibility for existing settings docs
    if (!settings.DailyWithdrawalRequestLimit || settings.DailyWithdrawalRequestLimit < 1 || settings.DailyWithdrawalRequestLimit > 8) {
        settings.DailyWithdrawalRequestLimit = 1
        needsSave = true
    }
    if (!settings.WithdrawalDenominations || settings.WithdrawalDenominations.length === 0) {
        settings.WithdrawalDenominations = DEFAULT_WITHDRAWAL_DENOMINATIONS
        needsSave = true
    }

    if (needsSave) await settings.save()
    return settings
}

// Check if model already exists to avoid overwriting
let WithdrawalSettings
try {
    WithdrawalSettings = mongoose.model('withdrawalSettings')
} catch (e) {
    WithdrawalSettings = mongoose.model('withdrawalSettings', schema)
}

module.exports = WithdrawalSettings
