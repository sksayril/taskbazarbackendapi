let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    SlabName: {
        type: String,
        required: true,
        trim: true
    },
    MinEarnings: {
        type: Number,
        required: true,
        default: 0
    },
    MaxEarnings: {
        type: Number,
        default: null // null means no upper limit
    },
    CommissionPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        default: 'Coins'
    },
    IsActive: {
        type: Boolean,
        default: true
    },
    Order: {
        type: Number,
        default: 0 // Lower order = checked first
    },
    CommissionBasedOn: {
        type: String,
        enum: ['ReferredUserWalletBalance', 'WithdrawalRequestAmount', 'WithdrawalRequestTime'],
        default: 'ReferredUserWalletBalance'
    }
}, {
    timestamps: true
})

// Index for efficient querying
schema.index({ MinEarnings: 1, MaxEarnings: 1 })
schema.index({ Order: 1 })

module.exports = mongoose.model('commissionSlabSettings', schema)
