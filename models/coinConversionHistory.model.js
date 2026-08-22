let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    CoinsConverted: {
        type: Number,
        required: true,
        min: 1
    },
    RupeesAdded: {
        type: Number,
        required: true,
        min: 0
    },
    ConversionRate: {
        type: Number,
        required: true,
        min: 1
    }
}, {
    timestamps: true
})

// Index for efficient querying by user and date
schema.index({ UserId: 1, createdAt: -1 })

module.exports = mongoose.model('coinConversionHistory', schema)

