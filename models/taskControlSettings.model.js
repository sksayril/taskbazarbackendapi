let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    TaskType: {
        type: String,
        enum: ['Captcha', 'DailySpin', 'ScratchCardDailyLimit', 'AppInstall', 'Quiz'],
        required: true,
        unique: true
    },
    IsActive: {
        type: Boolean,
        default: true
    },
    AdsEnabled: {
        type: Boolean,
        default: true
    },
    DailyLimit: {
        type: Number,
        default: null
    },
    CoinsPerTask: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
})

schema.statics.getControl = async function (taskType) {
    let control = await this.findOne({ TaskType: taskType })
    if (!control) {
        control = await this.create({
            TaskType: taskType,
            IsActive: true,
            AdsEnabled: true,
            DailyLimit: null,
            CoinsPerTask: null
        })
    }
    return control
}

let TaskControlSettings
try {
    TaskControlSettings = mongoose.model('taskControlSettings')
} catch (e) {
    TaskControlSettings = mongoose.model('taskControlSettings', schema)
}

module.exports = TaskControlSettings
