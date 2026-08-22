let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    DailySpinLimit: {
        type: Number,
        default: 10,
        require: true
    }
})

// Check if model already exists to avoid overwriting
let DailySpinSettings
try {
    DailySpinSettings = mongoose.model('dailySpinSettings')
} catch (e) {
    DailySpinSettings = mongoose.model('dailySpinSettings', schema)
}

module.exports = DailySpinSettings

