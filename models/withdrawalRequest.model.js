let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        require: true
    },
    Amount: {
        type: Number,
        require: true,
        min: 1
    },
    PaymentMethod: {
        type: String,
        enum: ['UPI', 'BankTransfer'],
        require: true
    },
    // UPI fields
    UPIId: {
        type: String,
        default: null
    },
    VirtualId: {
        type: String,
        default: null
    },
    // Bank Transfer fields
    BankAccountNumber: {
        type: String,
        default: null
    },
    BankIFSC: {
        type: String,
        default: null
    },
    BankName: {
        type: String,
        default: null
    },
    AccountHolderName: {
        type: String,
        default: null
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

schema.index({ UserId: 1, createdAt: -1 }) // Index for efficient user querying
schema.index({ Status: 1, createdAt: -1 }) // Index for efficient admin querying

let WithdrawalRequest
try {
    WithdrawalRequest = mongoose.model('withdrawalRequest')
} catch (e) {
    WithdrawalRequest = mongoose.model('withdrawalRequest', schema)
}

module.exports = WithdrawalRequest
