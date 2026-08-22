let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
    WeekStartDate: {
        type: Date,
        require: true
    },
    Monday: {
        type: Boolean,
        default: false
    },
    Tuesday: {
        type: Boolean,
        default: false
    },
    Wednesday: {
        type: Boolean,
        default: false
    },
    Thursday: {
        type: Boolean,
        default: false
    },
    Friday: {
        type: Boolean,
        default: false
    },
    Saturday: {
        type: Boolean,
        default: false
    },
    Sunday: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

// Index for efficient querying by user and week
schema.index({ UserId: 1, WeekStartDate: 1 })

// Check if model already exists to avoid overwriting
let DailyBonusClaim
try {
    DailyBonusClaim = mongoose.model('dailyBonusClaim')
} catch (e) {
    DailyBonusClaim = mongoose.model('dailyBonusClaim', schema)
}

module.exports = DailyBonusClaim
