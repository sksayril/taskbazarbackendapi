let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
    AppId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'app',
        require: true
    },
    ScreenshotUrl: {
        type: String,
        require: true
    },
    Status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    AdminNotes: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})

// Index to prevent duplicate submissions for same app by same user
schema.index({ UserId: 1, AppId: 1, Status: 'Approved' }, { unique: true, partialFilterExpression: { Status: 'Approved' } })

module.exports = mongoose.model('appInstallationSubmission', schema)
