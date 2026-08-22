let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    // Offerwall provider information
    Provider: {
        type: String,
        required: false,
        trim: true
    },
    
    // User identification (can be mobile number, user ID, or custom parameter)
    UserIdentifier: {
        type: String,
        required: false,
        trim: true
    },
    
    // Offer/Transaction details
    TransactionId: {
        type: String,
        required: false,
        trim: true
    },
    OfferId: {
        type: String,
        required: false,
        trim: true
    },
    OfferName: {
        type: String,
        required: false,
        trim: true
    },
    
    // Reward information
    RewardAmount: {
        type: Number,
        required: false,
        default: 0
    },
    RewardType: {
        type: String,
        enum: ['Coins', 'WalletBalance'],
        default: 'Coins'
    },
    
    // Status
    Status: {
        type: String,
        enum: ['Pending', 'Processed', 'Failed', 'Duplicate'],
        default: 'Pending'
    },
    
    // Raw callback data (store entire request for reference)
    RawData: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    
    // Processing information
    ProcessedAt: {
        type: Date,
        default: null
    },
    ProcessedBy: {
        type: String,
        default: null
    },
    ErrorMessage: {
        type: String,
        default: null
    },
    
    // User reference (if user found)
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: false
    }
}, {
    timestamps: true
})

// Index for faster queries
schema.index({ TransactionId: 1, Provider: 1 })
schema.index({ UserIdentifier: 1 })
schema.index({ Status: 1 })
schema.index({ createdAt: -1 })

module.exports = mongoose.model('offerwallCallback', schema)
