let mongoose = require('mongoose')

const TASK_TYPES = ['Quiz', 'Captcha', 'DailySpin', 'ScratchCard', 'ScratchCardDailyLimit', 'AppInstall']

const taskAdRuleSchema = new mongoose.Schema({
    TaskType: {
        type: String,
        enum: TASK_TYPES,
        required: true
    },
    IsActive: {
        type: Boolean,
        default: true
    },
    BannerEnabled: {
        type: Boolean,
        default: true
    },
    RewardedEnabled: {
        type: Boolean,
        default: true
    },
    InterstitialEnabled: {
        type: Boolean,
        default: true
    },
    InterstitialAfterCount: {
        type: Number,
        default: 1,
        min: 1
    },
    RewardedAfterCount: {
        type: Number,
        default: 1,
        min: 1
    }
}, { _id: false })

let schema = new mongoose.Schema({
    ConfigKey: {
        type: String,
        default: 'default',
        unique: true
    },
    GlobalAdsEnabled: {
        type: Boolean,
        default: true
    },
    BannerAdsEnabled: {
        type: Boolean,
        default: true
    },
    RewardedAdsEnabled: {
        type: Boolean,
        default: true
    },
    InterstitialAdsEnabled: {
        type: Boolean,
        default: true
    },
    TaskRules: {
        type: [taskAdRuleSchema],
        default: () => TASK_TYPES.map((taskType) => ({
            TaskType: taskType,
            IsActive: true,
            BannerEnabled: true,
            RewardedEnabled: true,
            InterstitialEnabled: true,
            InterstitialAfterCount: 1,
            RewardedAfterCount: 1
        }))
    }
}, {
    timestamps: true
})

schema.statics.getSettings = async function () {
    let settings = await this.findOne({ ConfigKey: 'default' })
    if (!settings) {
        settings = await this.create({ ConfigKey: 'default' })
    }

    // Ensure all task rules exist (for forward compatibility)
    const existingTaskTypes = new Set((settings.TaskRules || []).map(rule => rule.TaskType))
    let changed = false
    TASK_TYPES.forEach((taskType) => {
        if (!existingTaskTypes.has(taskType)) {
            settings.TaskRules.push({
                TaskType: taskType,
                IsActive: true,
                BannerEnabled: true,
                RewardedEnabled: true,
                InterstitialEnabled: true,
                InterstitialAfterCount: 1,
                RewardedAfterCount: 1
            })
            changed = true
        }
    })
    if (changed) {
        await settings.save()
    }
    return settings
}

schema.statics.TASK_TYPES = TASK_TYPES

let AdsManagementSettings
try {
    AdsManagementSettings = mongoose.model('adsManagementSettings')
} catch (e) {
    AdsManagementSettings = mongoose.model('adsManagementSettings', schema)
}

module.exports = AdsManagementSettings
