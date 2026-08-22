let mongoose = require('mongoose')

const GIFT_VOUCHER_BRANDS = ['Amazon', 'Flipkart', 'GooglePlay', 'Paytm']

let schema = new mongoose.Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    Type: {
        type: String,
        enum: ['giftcard'],
        default: 'giftcard',
        required: true
    },
    Brand: {
        type: String,
        enum: GIFT_VOUCHER_BRANDS,
        required: true
    },
    Amount: {
        type: Number,
        required: true,
        min: 1
    },
    Status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Delivered'],
        default: 'Pending'
    },
    VoucherCode: {
        type: String,
        default: null
    },
    AdminNotes: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})

schema.index({ UserId: 1, createdAt: -1 })
schema.index({ Status: 1, createdAt: -1 })

let GiftVoucherRequest
try {
    GiftVoucherRequest = mongoose.model('giftVoucherRequest')
} catch (e) {
    GiftVoucherRequest = mongoose.model('giftVoucherRequest', schema)
}

module.exports = GiftVoucherRequest
module.exports.GIFT_VOUCHER_BRANDS = GIFT_VOUCHER_BRANDS
