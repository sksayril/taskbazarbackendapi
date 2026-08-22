let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    CoinsPerRupee: {
        type: Number,
        require: true,
        default: 1
    },
    MinimumCoinsToConvert: {
        type: Number,
        require: true,
        default: 100
    }
}, {
    timestamps: true
})

// Ensure only one settings document exists
schema.statics.getSettings = async function() {
    let settings = await this.findOne()
    if (!settings) {
        settings = await this.create({
            CoinsPerRupee: 1,
            MinimumCoinsToConvert: 100
        })
    }
    return settings
}

module.exports = mongoose.model('coinConversionSettings', schema)
