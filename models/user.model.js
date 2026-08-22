let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    MobileNumber: {
        type: String,
        required: true,
        unique: true
    },
    Password: {
        type: String,
        required: true
    },
    DeviceId: {
        type: String,
        required: false,
        unique: false
    },
    SignupTime: {
        type: Date,
        default: Date.now
    },
    LastLoginTime: {
        type: Date,
        default: null
    },
    ReferCode: {
        type: String,
        unique: true
    },
    Coins: {
        type: Number,
        default: 0
    },
    WalletBalance: {
        type: Number,
        default: 0
    },
    ReferredBy: {
        type: String,
        default: null
    },
    IsBlocked: {
        type: Boolean,
        default: false
    },
    BlockedAt: {
        type: Date,
        default: null
    },
    BlockedReason: {
        type: String,
        default: null
    }
})

// Pre-save hook to prevent ReferredBy from being changed or removed once set
schema.pre('save', async function(next) {
    // Only check if document is being modified (not new)
    if (!this.isNew && this.isModified('ReferredBy')) {
        try {
            // Get the original document from database
            const originalDoc = await this.constructor.findById(this._id);
            if (originalDoc && originalDoc.ReferredBy !== null) {
                // If ReferredBy was already set, prevent any changes
                this.ReferredBy = originalDoc.ReferredBy;
            }
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

// Pre-update hook to prevent ReferredBy from being changed via update operations
schema.pre(['findOneAndUpdate', 'updateOne', 'updateMany', 'findByIdAndUpdate'], async function(next) {
    const update = this.getUpdate();
    
    // Check if ReferredBy is being modified
    if (update && ('$set' in update || '$unset' in update)) {
        const setUpdate = update.$set || {};
        const unsetUpdate = update.$unset || {};
        
        // If ReferredBy is being set or unset, we need to check the original document
        if ('ReferredBy' in setUpdate || 'ReferredBy' in unsetUpdate) {
            try {
                // Get the query to find the document
                const query = this.getQuery();
                const originalDoc = await this.model.findOne(query);
                
                if (originalDoc && originalDoc.ReferredBy !== null) {
                    // If ReferredBy was already set, prevent any changes
                    if (update.$set) {
                        update.$set.ReferredBy = originalDoc.ReferredBy;
                    } else {
                        update.$set = { ReferredBy: originalDoc.ReferredBy };
                    }
                    // Remove from $unset if present
                    if (update.$unset && 'ReferredBy' in update.$unset) {
                        delete update.$unset.ReferredBy;
                    }
                }
                next();
            } catch (err) {
                next(err);
            }
        } else {
            next();
        }
    } else if (update && 'ReferredBy' in update) {
        // Direct update (not using $set)
        try {
            const query = this.getQuery();
            const originalDoc = await this.model.findOne(query);
            
            if (originalDoc && originalDoc.ReferredBy !== null) {
                // Prevent change by keeping original value
                update.ReferredBy = originalDoc.ReferredBy;
            }
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

// Pre-save hook to automatically convert Coins to Rupees
schema.pre('save', async function(next) {
    if (this.isModified('Coins') && this.Coins > 0) {
        try {
            // Require models dynamically to avoid circular dependencies/import issues
            const coinConversionSettingsModel = require('./coinConversionSettings.model');
            const coinConversionHistoryModel = require('./coinConversionHistory.model');
            
            // Get conversion settings
            const settings = await coinConversionSettingsModel.getSettings();
            const coinsPerRupee = settings ? (settings.CoinsPerRupee || 100) : 100;
            
            // Calculate rupees to add
            const rupeesToAdd = this.Coins / coinsPerRupee;
            
            // Record conversion history
            await coinConversionHistoryModel.create({
                UserId: this._id,
                CoinsConverted: this.Coins,
                RupeesAdded: rupeesToAdd,
                ConversionRate: coinsPerRupee
            });

            // Update balance and set coins to 0
            this.WalletBalance = (this.WalletBalance || 0) + rupeesToAdd;
            this.Coins = 0;
        } catch (err) {
            console.error('Error in automatic coin conversion pre-save hook:', err);
        }
    }
    next();
});

module.exports = mongoose.model('user', schema)