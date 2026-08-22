let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    SupportLink: {
        type: String,
        required: true,
        trim: true
    },
    SupportEmail: {
        type: String,
        default: null,
        trim: true,
        lowercase: true
    },
    SupportPhone: {
        type: String,
        default: null,
        trim: true
    },
    SupportWhatsApp: {
        type: String,
        default: null,
        trim: true
    },
    IsActive: {
        type: Boolean,
        default: true
    },
    Description: {
        type: String,
        default: null,
        trim: true
    }
}, {
    timestamps: true
})

// Ensure only one settings document exists
schema.statics.getSettings = async function() {
    let settings = await this.findOne()
    if (!settings) {
        settings = await this.create({
            SupportLink: 'https://example.com/support',
            IsActive: true
        })
    }
    return settings
}

module.exports = mongoose.model('supportLinkSettings', schema)
