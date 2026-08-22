let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
    SpinDate: {
        type: Date,
        default: Date.now,
        require: true
    },
    SpinCount: {
        type: Number,
        default: 1,
        require: true
    }
}, {
    timestamps: true
})

// Index for efficient querying by user and date
schema.index({ UserId: 1, SpinDate: 1 })

module.exports = mongoose.model('dailySpinUsage', schema)

