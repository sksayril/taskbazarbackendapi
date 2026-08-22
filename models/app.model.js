let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    AppName: {
        type: String,
        require: true
    },
    AppImage: {
        type: String,
        require: true
    },
    AppDownloadUrl: {
        type: String,
        require: true
    },
    RewardCoins: {
        type: Number,
        require: true,
        default: 0
    },
    Difficulty: {
        type: String,
        enum: ['Easiest', 'Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    Status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    Description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('app', schema)
