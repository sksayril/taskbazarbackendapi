var express = require('express');
var router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');

/** Multipart forms without files (e.g. admin UI after removing file inputs) still need multer to populate req.body. */
function parseMultipartTextFieldsOnly(req, res, next) {
  const ct = (req.headers['content-type'] || '').toLowerCase()
  if (!ct.includes('multipart/form-data')) {
    return next()
  }
  return multer().none()(req, res, next)
}
const { encryptPassword, decryptPassword } = require('../utilities/crypto');

let adminModel = require('../models/admin.model')
let captchaSettingsModel = require('../models/captchaSettings.model')
let referralSettingsModel = require('../models/referralSettings.model')
let dailyBonusSettingsModel = require('../models/dailyBonusSettings.model')
let dailySpinSettingsModel = require('../models/dailySpinSettings.model')
let withdrawalRequestModel = require('../models/withdrawalRequest.model')
let userModel = require('../models/user.model')
let appModel = require('../models/app.model')
let appInstallationSubmissionModel = require('../models/appInstallationSubmission.model')
let coinConversionSettingsModel = require('../models/coinConversionSettings.model')
let coinConversionHistoryModel = require('../models/coinConversionHistory.model')
let scratchCardSettingsModel = require('../models/scratchCardSettings.model')
let scratchCardClaimModel = require('../models/scratchCardClaim.model')
let scratchCardDailyLimitSettingsModel = require('../models/scratchCardDailyLimitSettings.model')
let scratchCardDailyLimitClaimModel = require('../models/scratchCardDailyLimitClaim.model')
let withdrawalSettingsModel = require('../models/withdrawalSettings.model')
let giftVoucherRequestModel = require('../models/giftVoucherRequest.model')
let signupBonusSettingsModel = require('../models/signupBonusSettings.model')
let commissionSlabSettingsModel = require('../models/commissionSlabSettings.model')
let captchaSolveModel = require('../models/captchaSolve.model')
let dailyBonusClaimModel = require('../models/dailyBonusClaim.model')
let sponsorPromotionSubmissionModel = require('../models/sponsorPromotionSubmission.model')
let supportLinkSettingsModel = require('../models/supportLinkSettings.model')
let socialLinksSettingsModel = require('../models/socialLinksSettings.model')
let taskControlSettingsModel = require('../models/taskControlSettings.model')
let adsManagementSettingsModel = require('../models/adsManagementSettings.model')
let popupTemplateSettingsModel = require('../models/popupTemplateSettings.model')

function popupDescriptionFromDoc(doc) {
  if (!doc) return ''
  const d = doc.Description != null ? String(doc.Description).trim() : ''
  if (d) return d
  return doc.Body != null ? String(doc.Body).trim() : ''
}

const CONTROLLED_TASK_TYPES = ['Captcha', 'DailySpin', 'ScratchCardDailyLimit', 'AppInstall', 'Quiz']

function getStartOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function getStartOfYesterday() {
  const date = getStartOfToday()
  date.setDate(date.getDate() - 1)
  return date
}

function getStartOfMonth(offsetMonths = 0) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
}

// Admin Signup API
router.post('/signup', async (req, res) => {
  try {
    let { Email, Password } = req.body
    
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and Password are required"
      })
    }

    let checkAdmin = await adminModel.find({ Email: Email })
    if (checkAdmin.length > 0) {
      return res.status(400).json({
        message: "Admin Already Exist"
      })
    }
    else {
      let Admin_data = await adminModel.create({ Email: Email, Password: Password })
      
      // Generate JWT token with 30 days expiration
      const token = jwt.sign(
        { 
          id: Admin_data._id,
          Email: Admin_data.Email 
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '30d' }
      )
      
      return res.json({
        message: "Admin Created Successfully",
        data: Admin_data,
        token: token
      })
    }

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Admin Login API
router.post('/login', async (req, res) => {
  try {
    let { Email, Password } = req.body
    
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and Password are required"
      })
    }

    let admin = await adminModel.findOne({ Email: Email })
    if (!admin) {
      return res.status(404).json({
        message: "Admin Not Found"
      })
    }

    if (admin.Password !== Password) {
      return res.status(401).json({
        message: "Invalid Password"
      })
    }

    // Generate JWT token with 30 days expiration
    const token = jwt.sign(
      { 
        id: admin._id,
        Email: admin.Email 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    )

    return res.json({
      message: "Login Successful",
      data: {
        Email: admin.Email,
        _id: admin._id
      },
      token: token
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Middleware to verify JWT token for admin
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization
  
  if (!token) {
    return res.status(401).json({
      message: "Access denied. No token provided."
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    req.admin = decoded
    next()
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token"
    })
  }
}

// Alias for backward compatibility
const verifyAdminToken = verifyToken

// Set Captcha Settings API
router.post('/captcha/settings', verifyAdminToken, async (req, res) => {
  try {
    const { DailyCaptchaLimit, RewardPerCaptcha, RewardType } = req.body
    
    if (!DailyCaptchaLimit || RewardPerCaptcha === undefined) {
      return res.status(400).json({
        message: "DailyCaptchaLimit and RewardPerCaptcha are required"
      })
    }

    if (DailyCaptchaLimit <= 0) {
      return res.status(400).json({
        message: "DailyCaptchaLimit must be greater than 0"
      })
    }

    if (RewardPerCaptcha < 0) {
      return res.status(400).json({
        message: "RewardPerCaptcha must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await captchaSettingsModel.findOne()
    if (settings) {
      settings.DailyCaptchaLimit = DailyCaptchaLimit
      settings.RewardPerCaptcha = RewardPerCaptcha
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await captchaSettingsModel.create({
        DailyCaptchaLimit: DailyCaptchaLimit,
        RewardPerCaptcha: RewardPerCaptcha,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Captcha settings updated successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Captcha Settings API
router.get('/captcha/settings', verifyAdminToken, async (req, res) => {
  try {
    let settings = await captchaSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
        DailyCaptchaLimit: 10,
        RewardPerCaptcha: 1,
        RewardType: 'Coins'
      }
    }

    return res.json({
      message: "Captcha settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Set Referral Settings API
router.post('/referral/settings', verifyAdminToken, async (req, res) => {
  try {
    const { RewardForNewUser, RewardForReferrer, RewardType } = req.body
    
    if (RewardForNewUser === undefined || RewardForReferrer === undefined) {
      return res.status(400).json({
        message: "RewardForNewUser and RewardForReferrer are required"
      })
    }

    if (RewardForNewUser < 0 || RewardForReferrer < 0) {
      return res.status(400).json({
        message: "Reward amounts must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await referralSettingsModel.findOne()
    if (settings) {
      settings.RewardForNewUser = RewardForNewUser
      settings.RewardForReferrer = RewardForReferrer
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await referralSettingsModel.create({
        RewardForNewUser: RewardForNewUser,
        RewardForReferrer: RewardForReferrer,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Referral settings updated successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Referral Settings API
router.get('/referral/settings', verifyAdminToken, async (req, res) => {
  try {
    let settings = await referralSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
        RewardForNewUser: 0,
        RewardForReferrer: 0,
        RewardType: 'Coins'
      }
    }

    return res.json({
      message: "Referral settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Set Daily Bonus Settings API
router.post('/dailybonus/settings', verifyAdminToken, async (req, res) => {
  try {
    const { Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, RewardType } = req.body
    
    // Validate all days are provided
    if (Monday === undefined || Tuesday === undefined || Wednesday === undefined || 
        Thursday === undefined || Friday === undefined || Saturday === undefined || 
        Sunday === undefined) {
      return res.status(400).json({
        message: "All days (Monday through Sunday) are required"
      })
    }

    if (Monday < 0 || Tuesday < 0 || Wednesday < 0 || Thursday < 0 || 
        Friday < 0 || Saturday < 0 || Sunday < 0) {
      return res.status(400).json({
        message: "All bonus amounts must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await dailyBonusSettingsModel.findOne()
    if (settings) {
      settings.Monday = Monday
      settings.Tuesday = Tuesday
      settings.Wednesday = Wednesday
      settings.Thursday = Thursday
      settings.Friday = Friday
      settings.Saturday = Saturday
      settings.Sunday = Sunday
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await dailyBonusSettingsModel.create({
        Monday: Monday,
        Tuesday: Tuesday,
        Wednesday: Wednesday,
        Thursday: Thursday,
        Friday: Friday,
        Saturday: Saturday,
        Sunday: Sunday,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Daily bonus settings updated successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Daily Bonus Settings API
router.get('/dailybonus/settings', verifyAdminToken, async (req, res) => {
  try {
    let settings = await dailyBonusSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0,
        RewardType: 'Coins'
      }
    }

    return res.json({
      message: "Daily bonus settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== DAILY SPIN SETTINGS APIs ====================

// Set Daily Spin Settings API
router.post('/dailyspin/settings', verifyAdminToken, async (req, res) => {
  try {
    const { DailySpinLimit } = req.body

    if (DailySpinLimit === undefined || DailySpinLimit === null) {
      return res.status(400).json({
        message: "DailySpinLimit is required"
      })
    }

    if (typeof DailySpinLimit !== 'number' || isNaN(DailySpinLimit)) {
      return res.status(400).json({
        message: "DailySpinLimit must be a valid number"
      })
    }

    if (DailySpinLimit <= 0) {
      return res.status(400).json({
        message: "DailySpinLimit must be greater than 0"
      })
    }

    // Update or create settings
    let settings = await dailySpinSettingsModel.findOne()
    if (settings) {
      settings.DailySpinLimit = DailySpinLimit
      await settings.save()
    } else {
      settings = await dailySpinSettingsModel.create({
        DailySpinLimit: DailySpinLimit
      })
    }

    return res.json({
      message: "Daily spin settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Set Daily Spin Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Daily Spin Settings API
router.get('/dailyspin/settings', verifyAdminToken, async (req, res) => {
  try {
    let settings = await dailySpinSettingsModel.findOne()
    if (!settings) {
      // Return default settings if not exists
      settings = {
        DailySpinLimit: 10
      }
    }

    return res.json({
      message: "Daily spin settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    console.error('Get Daily Spin Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get All Withdrawal Requests API
router.get('/withdrawal/requests', verifyToken, async (req, res) => {
  try {
    const { status } = req.query // Optional filter by status
    
    let query = {}
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      query.Status = status
    }

    // Get all withdrawal requests
    const requests = await withdrawalRequestModel.find(query)
      .populate('UserId', 'MobileNumber DeviceId')
      .sort({ createdAt: -1 })

    // Format response
    const formattedRequests = requests.map(req => ({
      requestId: req._id,
      userId: req.UserId._id,
      userMobileNumber: req.UserId.MobileNumber,
      userDeviceId: req.UserId.DeviceId,
      amount: req.Amount,
      paymentMethod: req.PaymentMethod,
      upiId: req.UPIId,
      virtualId: req.VirtualId,
      bankAccountNumber: req.BankAccountNumber,
      bankIFSC: req.BankIFSC,
      bankName: req.BankName,
      accountHolderName: req.AccountHolderName,
      status: req.Status,
      adminNotes: req.AdminNotes,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt
    }))

    return res.json({
      message: "Withdrawal requests retrieved successfully",
      data: {
        requests: formattedRequests,
        totalRequests: formattedRequests.length,
        pendingCount: formattedRequests.filter(r => r.status === 'Pending').length,
        approvedCount: formattedRequests.filter(r => r.status === 'Approved').length,
        rejectedCount: formattedRequests.filter(r => r.status === 'Rejected').length
      }
    })

  } catch (err) {
    console.error('Get Withdrawal Requests - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Approve/Reject Withdrawal Request API
router.post('/withdrawal/request/:requestId/status', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params
    const { status, adminNotes } = req.body

    // Validate status
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status is required and must be either 'Approved' or 'Rejected'"
      })
    }

    // Find withdrawal request
    const withdrawalRequest = await withdrawalRequestModel.findById(requestId)
      .populate('UserId')

    if (!withdrawalRequest) {
      return res.status(404).json({
        message: "Withdrawal request not found"
      })
    }

    // Check if already processed
    if (withdrawalRequest.Status !== 'Pending') {
      return res.status(400).json({
        message: `This withdrawal request has already been ${withdrawalRequest.Status.toLowerCase()}`
      })
    }

    // Get user
    const user = await userModel.findById(withdrawalRequest.UserId._id)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Update withdrawal request status
    withdrawalRequest.Status = status
    if (adminNotes) {
      withdrawalRequest.AdminNotes = adminNotes
    }
    await withdrawalRequest.save()

    // If rejected, return amount to wallet
    if (status === 'Rejected') {
      user.WalletBalance = (user.WalletBalance || 0) + withdrawalRequest.Amount
      await user.save()
    }
    // If approved, amount stays deducted (already deducted when request was created)

    return res.json({
      message: `Withdrawal request ${status.toLowerCase()} successfully`,
      data: {
        requestId: withdrawalRequest._id,
        amount: withdrawalRequest.Amount,
        paymentMethod: withdrawalRequest.PaymentMethod,
        status: withdrawalRequest.Status,
        adminNotes: withdrawalRequest.AdminNotes,
        userWalletBalance: user.WalletBalance,
        updatedAt: withdrawalRequest.updatedAt
      }
    })

  } catch (err) {
    console.error('Update Withdrawal Request Status - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Bulk Approve/Reject Withdrawal Requests API
router.post('/withdrawal/requests/bulk-status', verifyToken, async (req, res) => {
  try {
    const { requestIds, status, adminNotes } = req.body

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        message: "requestIds must be a non-empty array"
      })
    }

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status is required and must be either 'Approved' or 'Rejected'"
      })
    }

    const requests = await withdrawalRequestModel.find({
      _id: { $in: requestIds },
      Status: 'Pending'
    })

    const results = []

    for (const reqData of requests) {
      reqData.Status = status
      if (adminNotes !== undefined) {
        reqData.AdminNotes = adminNotes
      }
      await reqData.save()

      // If rejected, amount was already deducted at request creation, so return it.
      if (status === 'Rejected') {
        await userModel.findByIdAndUpdate(reqData.UserId, {
          $inc: { WalletBalance: reqData.Amount }
        })
      }

      results.push({
        requestId: reqData._id,
        amount: reqData.Amount,
        status: reqData.Status
      })
    }

    return res.json({
      message: `Bulk withdrawal ${status.toLowerCase()} completed`,
      data: {
        requested: requestIds.length,
        processed: results.length,
        skipped: requestIds.length - results.length,
        results: results
      }
    })
  } catch (err) {
    console.error('Bulk Update Withdrawal Requests - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== Gift Voucher Requests (Admin) ====================

router.get('/gift-voucher/requests', verifyToken, async (req, res) => {
  try {
    const { status } = req.query
    let query = {}
    if (status && ['Pending', 'Approved', 'Rejected', 'Delivered'].includes(status)) {
      query.Status = status
    }

    const rows = await giftVoucherRequestModel.find(query)
      .populate('UserId', 'MobileNumber DeviceId')
      .sort({ createdAt: -1 })

    const requests = rows.map((row) => ({
      requestId: row._id,
      userId: row.UserId ? row.UserId._id : null,
      userMobileNumber: row.UserId ? row.UserId.MobileNumber : null,
      userDeviceId: row.UserId ? row.UserId.DeviceId : null,
      type: 'giftcard',
      brand: row.Brand,
      amount: row.Amount,
      status: row.Status,
      voucherCode: row.VoucherCode || null,
      adminNotes: row.AdminNotes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    const pendingCount = requests.filter((r) => r.status === 'Pending').length
    const approvedCount = requests.filter((r) => r.status === 'Approved').length
    const rejectedCount = requests.filter((r) => r.status === 'Rejected').length
    const deliveredCount = requests.filter((r) => r.status === 'Delivered').length

    return res.json({
      message: "Gift voucher requests retrieved successfully",
      data: {
        requests,
        totalRequests: requests.length,
        pendingCount,
        approvedCount,
        rejectedCount,
        deliveredCount
      }
    })
  } catch (err) {
    console.error('Get gift voucher requests - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.post('/gift-voucher/request/:requestId/approve', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params
    const { adminNotes } = req.body

    const doc = await giftVoucherRequestModel.findById(requestId).populate('UserId')
    if (!doc) {
      return res.status(404).json({ message: "Gift voucher request not found" })
    }
    if (doc.Status !== 'Pending') {
      return res.status(400).json({
        message: `This gift voucher request is already ${doc.Status.toLowerCase()}`
      })
    }

    doc.Status = 'Approved'
    if (adminNotes !== undefined && adminNotes !== null) {
      doc.AdminNotes = adminNotes
    }
    await doc.save()

    const user = await userModel.findById(doc.UserId._id || doc.UserId)

    return res.json({
      message: "Gift voucher request approved successfully",
      data: {
        requestId: doc._id,
        type: 'giftcard',
        brand: doc.Brand,
        amount: doc.Amount,
        status: doc.Status,
        adminNotes: doc.AdminNotes,
        userWalletBalance: user ? user.WalletBalance : null,
        updatedAt: doc.updatedAt
      }
    })
  } catch (err) {
    console.error('Approve gift voucher - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.post('/gift-voucher/request/:requestId/reject', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params
    const { adminNotes } = req.body

    const doc = await giftVoucherRequestModel.findById(requestId).populate('UserId')
    if (!doc) {
      return res.status(404).json({ message: "Gift voucher request not found" })
    }
    if (doc.Status !== 'Pending') {
      return res.status(400).json({
        message: `This gift voucher request is already ${doc.Status.toLowerCase()}`
      })
    }

    const user = await userModel.findById(doc.UserId._id || doc.UserId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    doc.Status = 'Rejected'
    if (adminNotes !== undefined && adminNotes !== null) {
      doc.AdminNotes = adminNotes
    }
    await doc.save()

    user.WalletBalance = (user.WalletBalance || 0) + doc.Amount
    await user.save()

    return res.json({
      message: "Gift voucher request rejected successfully",
      data: {
        requestId: doc._id,
        type: 'giftcard',
        brand: doc.Brand,
        amount: doc.Amount,
        status: doc.Status,
        adminNotes: doc.AdminNotes,
        userWalletBalance: user.WalletBalance,
        updatedAt: doc.updatedAt
      }
    })
  } catch (err) {
    console.error('Reject gift voucher - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.post('/gift-voucher/request/:requestId/deliver', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params
    let { voucherCode, adminNotes } = req.body

    if (voucherCode === undefined || voucherCode === null || String(voucherCode).trim() === '') {
      return res.status(400).json({
        message: "voucherCode is required to deliver the gift voucher"
      })
    }
    voucherCode = String(voucherCode).trim()

    const doc = await giftVoucherRequestModel.findById(requestId).populate('UserId')
    if (!doc) {
      return res.status(404).json({ message: "Gift voucher request not found" })
    }
    if (doc.Status !== 'Approved') {
      return res.status(400).json({
        message: "Voucher code can only be delivered after the request is approved (current status must be Approved)"
      })
    }

    doc.VoucherCode = voucherCode
    doc.Status = 'Delivered'
    if (adminNotes !== undefined && adminNotes !== null) {
      doc.AdminNotes = adminNotes
    }
    await doc.save()

    const user = await userModel.findById(doc.UserId._id || doc.UserId)

    return res.json({
      message: "Gift voucher code delivered successfully",
      data: {
        requestId: doc._id,
        type: 'giftcard',
        brand: doc.Brand,
        amount: doc.Amount,
        status: doc.Status,
        voucherCode: doc.VoucherCode,
        adminNotes: doc.AdminNotes,
        userWalletBalance: user ? user.WalletBalance : null,
        updatedAt: doc.updatedAt
      }
    })
  } catch (err) {
    console.error('Deliver gift voucher - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get All Users API
router.get('/users', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query
    
    // Build query
    let query = {}
    if (search) {
      query.$or = [
        { MobileNumber: { $regex: search, $options: 'i' } },
        { DeviceId: { $regex: search, $options: 'i' } },
        { ReferCode: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const totalUsers = await userModel.countDocuments(query)

    // Get users with pagination
    const users = await userModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Format response with all user details
    const formattedUsers = users.map(user => ({
      userId: user._id,
      mobileNumber: user.MobileNumber,
      deviceId: user.DeviceId,
      referCode: user.ReferCode,
      coins: user.Coins || 0,
      walletBalance: user.WalletBalance || 0,
      referredBy: user.ReferredBy || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    // Calculate statistics
    const totalCoins = await userModel.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$Coins' } } }
    ])
    const totalWalletBalance = await userModel.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$WalletBalance' } } }
    ])

    return res.json({
      message: "Users retrieved successfully",
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers: totalUsers,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
          hasPrevPage: pageNum > 1
        },
        statistics: {
          totalCoins: totalCoins[0]?.total || 0,
          totalWalletBalance: totalWalletBalance[0]?.total || 0
        }
      }
    })

  } catch (err) {
    console.error('Get All Users - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== USERS EARNINGS API ====================

// Get All Users with Earnings API (MUST be before /users/:userId route)
router.get('/users/earnings', verifyAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sortBy = 'totalEarnings' } = req.query
    
    // Build query
    let query = {}
    if (search) {
      query.$or = [
        { UserName: { $regex: search, $options: 'i' } },
        { MobileNumber: { $regex: search, $options: 'i' } },
        { ReferCode: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const totalUsers = await userModel.countDocuments(query)

    // Get users with pagination
    const users = await userModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Calculate earnings for each user
    const usersWithEarnings = await Promise.all(users.map(async (user) => {
      // Get referral count
      const referralCount = await userModel.countDocuments({ ReferredBy: user.ReferCode })
      
      // Get approved app installations earnings
      const appSubmissions = await appInstallationSubmissionModel.find({ 
        UserId: user._id, 
        Status: 'Approved' 
      }).populate('AppId', 'RewardCoins')
      const appEarnings = appSubmissions.reduce((sum, sub) => sum + (sub.AppId?.RewardCoins || 0), 0)
      
      // Get scratch card earnings
      const scratchCardClaims = await scratchCardClaimModel.find({ UserId: user._id })
      const scratchCardEarnings = scratchCardClaims.reduce((sum, claim) => sum + (claim.RewardAmount || 0), 0)
      
      // Get captcha earnings
      const captchaSolves = await captchaSolveModel.find({ UserId: user._id })
      const captchaEarnings = captchaSolves.reduce((sum, solve) => sum + (solve.RewardAmount || 0), 0)
      
      // Get daily bonus earnings
      const dailyBonusClaims = await dailyBonusClaimModel.find({ UserId: user._id })
      const dailyBonusEarnings = dailyBonusClaims.reduce((sum, claim) => sum + (claim.Amount || 0), 0)
      
      // Calculate total earnings (coins + wallet balance)
      const totalEarnings = (user.Coins || 0) + (user.WalletBalance || 0)
      
      // Calculate referral earnings (if user referred others)
      const referralSettings = await referralSettingsModel.findOne()
      const referralEarnings = referralCount * (referralSettings?.RewardForReferrer || 0)

      return {
        userId: user._id,
        userName: user.UserName,
        mobileNumber: user.MobileNumber,
        referCode: user.ReferCode,
        coins: user.Coins || 0,
        walletBalance: user.WalletBalance || 0,
        totalEarnings: totalEarnings,
        earningsBreakdown: {
          coins: user.Coins || 0,
          walletBalance: user.WalletBalance || 0,
          appInstallations: appEarnings,
          scratchCards: scratchCardEarnings,
          captcha: captchaEarnings,
          dailyBonus: dailyBonusEarnings,
          referralEarnings: referralEarnings
        },
        referralCount: referralCount,
        referredBy: user.ReferredBy || null,
        signupTime: user.SignupTime,
        lastLoginTime: user.LastLoginTime,
        isBlocked: user.IsBlocked || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }))

    // Sort by sortBy parameter
    if (sortBy === 'totalEarnings') {
      usersWithEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings)
    } else if (sortBy === 'coins') {
      usersWithEarnings.sort((a, b) => b.coins - a.coins)
    } else if (sortBy === 'walletBalance') {
      usersWithEarnings.sort((a, b) => b.walletBalance - a.walletBalance)
    } else if (sortBy === 'referralCount') {
      usersWithEarnings.sort((a, b) => b.referralCount - a.referralCount)
    }

    // Calculate total statistics
    const totalStats = usersWithEarnings.reduce((acc, user) => {
      acc.totalCoins += user.coins
      acc.totalWalletBalance += user.walletBalance
      acc.totalEarnings += user.totalEarnings
      acc.totalReferrals += user.referralCount
      return acc
    }, { totalCoins: 0, totalWalletBalance: 0, totalEarnings: 0, totalReferrals: 0 })

    return res.json({
      message: "Users with earnings retrieved successfully",
      data: {
        users: usersWithEarnings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers: totalUsers,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
          hasPrevPage: pageNum > 1
        },
        statistics: totalStats
      }
    })

  } catch (err) {
    console.error('Get Users Earnings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== USERS EARNINGS API ====================

// Get All Users with Earnings API (MUST be before /users/:userId route)
router.get('/users/earnings', verifyAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sortBy = 'totalEarnings' } = req.query
    
    // Build query
    let query = {}
    if (search) {
      query.$or = [
        { UserName: { $regex: search, $options: 'i' } },
        { MobileNumber: { $regex: search, $options: 'i' } },
        { ReferCode: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const totalUsers = await userModel.countDocuments(query)

    // Get users with pagination
    const users = await userModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Calculate earnings for each user
    const usersWithEarnings = await Promise.all(users.map(async (user) => {
      // Get referral count
      const referralCount = await userModel.countDocuments({ ReferredBy: user.ReferCode })
      
      // Get approved app installations earnings
      const appSubmissions = await appInstallationSubmissionModel.find({ 
        UserId: user._id, 
        Status: 'Approved' 
      }).populate('AppId', 'RewardCoins')
      const appEarnings = appSubmissions.reduce((sum, sub) => sum + (sub.AppId?.RewardCoins || 0), 0)
      
      // Get scratch card earnings
      const scratchCardClaims = await scratchCardClaimModel.find({ UserId: user._id })
      const scratchCardEarnings = scratchCardClaims.reduce((sum, claim) => sum + (claim.RewardAmount || 0), 0)
      
      // Get captcha earnings
      const captchaSolves = await captchaSolveModel.find({ UserId: user._id })
      const captchaEarnings = captchaSolves.reduce((sum, solve) => sum + (solve.RewardAmount || 0), 0)
      
      // Get daily bonus earnings
      const dailyBonusClaims = await dailyBonusClaimModel.find({ UserId: user._id })
      const dailyBonusEarnings = dailyBonusClaims.reduce((sum, claim) => sum + (claim.Amount || 0), 0)
      
      // Calculate total earnings (coins + wallet balance)
      const totalEarnings = (user.Coins || 0) + (user.WalletBalance || 0)
      
      // Calculate referral earnings (if user referred others)
      const referralSettings = await referralSettingsModel.findOne()
      const referralEarnings = referralCount * (referralSettings?.RewardForReferrer || 0)

      return {
        userId: user._id,
        userName: user.UserName,
        mobileNumber: user.MobileNumber,
        referCode: user.ReferCode,
        coins: user.Coins || 0,
        walletBalance: user.WalletBalance || 0,
        totalEarnings: totalEarnings,
        earningsBreakdown: {
          coins: user.Coins || 0,
          walletBalance: user.WalletBalance || 0,
          appInstallations: appEarnings,
          scratchCards: scratchCardEarnings,
          captcha: captchaEarnings,
          dailyBonus: dailyBonusEarnings,
          referralEarnings: referralEarnings
        },
        referralCount: referralCount,
        referredBy: user.ReferredBy || null,
        signupTime: user.SignupTime,
        lastLoginTime: user.LastLoginTime,
        isBlocked: user.IsBlocked || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }))

    // Sort by sortBy parameter
    if (sortBy === 'totalEarnings') {
      usersWithEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings)
    } else if (sortBy === 'coins') {
      usersWithEarnings.sort((a, b) => b.coins - a.coins)
    } else if (sortBy === 'walletBalance') {
      usersWithEarnings.sort((a, b) => b.walletBalance - a.walletBalance)
    } else if (sortBy === 'referralCount') {
      usersWithEarnings.sort((a, b) => b.referralCount - a.referralCount)
    }

    // Calculate total statistics
    const totalStats = usersWithEarnings.reduce((acc, user) => {
      acc.totalCoins += user.coins
      acc.totalWalletBalance += user.walletBalance
      acc.totalEarnings += user.totalEarnings
      acc.totalReferrals += user.referralCount
      return acc
    }, { totalCoins: 0, totalWalletBalance: 0, totalEarnings: 0, totalReferrals: 0 })

    return res.json({
      message: "Users with earnings retrieved successfully",
      data: {
        users: usersWithEarnings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers: totalUsers,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
          hasPrevPage: pageNum > 1
        },
        statistics: totalStats
      }
    })

  } catch (err) {
    console.error('Get Users Earnings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Single User Details API
router.get('/users/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params

    // Get user details
    const user = await userModel.findById(userId)

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Get user's withdrawal requests
    const withdrawalRequests = await withdrawalRequestModel.find({ UserId: userId })
      .sort({ createdAt: -1 })

    // Get referral statistics
    const referralCount = await userModel.countDocuments({ ReferredBy: user.ReferCode })
    const totalReferralEarnings = await withdrawalRequestModel.aggregate([
      { $match: { UserId: userId, Status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$Amount' } } }
    ])

    // Get app installation submissions (task completion data)
    const appSubmissions = await appInstallationSubmissionModel.find({ UserId: userId })
      .populate('AppId', 'AppName AppImage RewardCoins Difficulty')
      .sort({ createdAt: -1 })

    // Calculate app submission statistics
    const totalAppSubmissions = appSubmissions.length
    const approvedAppSubmissions = appSubmissions.filter(s => s.Status === 'Approved').length
    const pendingAppSubmissions = appSubmissions.filter(s => s.Status === 'Pending').length
    const rejectedAppSubmissions = appSubmissions.filter(s => s.Status === 'Rejected').length
    const totalEarningsFromApps = appSubmissions
      .filter(s => s.Status === 'Approved')
      .reduce((sum, sub) => sum + (sub.AppId?.RewardCoins || 0), 0)

    // Decrypt password to get original password
    let originalPassword = null;
    try {
      if (user.Password) {
        originalPassword = decryptPassword(user.Password);
      }
    } catch (decryptError) {
      console.error('Error decrypting password:', decryptError);
      // Continue even if decryption fails, password will be null
    }

    // Format response with all user details
    const userDetails = {
      userId: user._id,
      mobileNumber: user.MobileNumber,
      password: originalPassword, // Original decrypted password
      deviceId: user.DeviceId,
      referCode: user.ReferCode,
      coins: user.Coins || 0,
      walletBalance: user.WalletBalance || 0,
      referredBy: user.ReferredBy || null,
      isBlocked: user.IsBlocked || false,
      blockedAt: user.BlockedAt || null,
      blockedReason: user.BlockedReason || null,
      signupTime: user.SignupTime,
      lastLoginTime: user.LastLoginTime,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      statistics: {
        referralCount: referralCount,
        totalWithdrawalRequests: withdrawalRequests.length,
        pendingWithdrawals: withdrawalRequests.filter(r => r.Status === 'Pending').length,
        approvedWithdrawals: withdrawalRequests.filter(r => r.Status === 'Approved').length,
        rejectedWithdrawals: withdrawalRequests.filter(r => r.Status === 'Rejected').length,
        totalWithdrawn: totalReferralEarnings[0]?.total || 0,
        totalAppSubmissions: totalAppSubmissions,
        approvedAppSubmissions: approvedAppSubmissions,
        pendingAppSubmissions: pendingAppSubmissions,
        rejectedAppSubmissions: rejectedAppSubmissions,
        totalEarningsFromApps: totalEarningsFromApps
      },
      withdrawalRequests: withdrawalRequests.map(req => ({
        requestId: req._id,
        amount: req.Amount,
        paymentMethod: req.PaymentMethod,
        status: req.Status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt
      })),
      appSubmissions: appSubmissions.map(sub => ({
        submissionId: sub._id,
        appId: sub.AppId?._id,
        appName: sub.AppId?.AppName,
        appImage: sub.AppId?.AppImage,
        appRewardCoins: sub.AppId?.RewardCoins,
        appDifficulty: sub.AppId?.Difficulty,
        screenshotUrl: sub.ScreenshotUrl,
        status: sub.Status,
        adminNotes: sub.AdminNotes,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      }))
    }

    return res.json({
      message: "User details retrieved successfully",
      data: userDetails
    })

  } catch (err) {
    console.error('Get User Details - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Edit User Data API (Admin)
router.put('/users/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { 
      MobileNumber, 
      Password, 
      DeviceId, 
      Coins, 
      WalletBalance 
    } = req.body

    // Find user
    const user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Decrypt original password for comparison
    let originalPasswordValue = null;
    try {
      if (user.Password) {
        originalPasswordValue = decryptPassword(user.Password);
      }
    } catch (decryptError) {
      console.error('Error decrypting original password:', decryptError);
    }

    // Store original values for response
    const originalValues = {
      mobileNumber: user.MobileNumber,
      password: originalPasswordValue,
      deviceId: user.DeviceId,
      coins: user.Coins || 0,
      walletBalance: user.WalletBalance || 0
    }

    // Update MobileNumber if provided
    if (MobileNumber !== undefined) {
      if (typeof MobileNumber !== 'string' || MobileNumber.trim().length === 0) {
        return res.status(400).json({
          message: "MobileNumber must be a valid non-empty string"
        })
      }

      // Check if MobileNumber is already taken by another user
      const existingUser = await userModel.findOne({ 
        MobileNumber: MobileNumber.trim(),
        _id: { $ne: userId }
      })
      
      if (existingUser) {
        return res.status(400).json({
          message: "MobileNumber already exists for another user"
        })
      }

      user.MobileNumber = MobileNumber.trim()
    }

    // Update Password if provided
    if (Password !== undefined) {
      if (typeof Password !== 'string' || Password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long"
        })
      }

      // Encrypt password using crypto-js
      const encryptedPassword = encryptPassword(Password)
      user.Password = encryptedPassword
    }

    // Update DeviceId if provided
    if (DeviceId !== undefined) {
      if (typeof DeviceId !== 'string' || DeviceId.trim().length === 0) {
        return res.status(400).json({
          message: "DeviceId must be a valid non-empty string"
        })
      }

      // Check if DeviceId is already taken by another user
      const existingDevice = await userModel.findOne({ 
        DeviceId: DeviceId.trim(),
        _id: { $ne: userId }
      })
      
      if (existingDevice) {
        return res.status(400).json({
          message: "DeviceId already exists for another user"
        })
      }

      user.DeviceId = DeviceId.trim()
    }

    // Update Coins if provided
    if (Coins !== undefined) {
      if (typeof Coins !== 'number' || isNaN(Coins)) {
        return res.status(400).json({
          message: "Coins must be a valid number"
        })
      }

      if (Coins < 0) {
        return res.status(400).json({
          message: "Coins cannot be negative"
        })
      }

      user.Coins = Coins
    }

    // Update WalletBalance if provided
    if (WalletBalance !== undefined) {
      if (typeof WalletBalance !== 'number' || isNaN(WalletBalance)) {
        return res.status(400).json({
          message: "WalletBalance must be a valid number"
        })
      }

      if (WalletBalance < 0) {
        return res.status(400).json({
          message: "WalletBalance cannot be negative"
        })
      }

      user.WalletBalance = WalletBalance
    }

    // Check if any fields were provided to update
    const fieldsToUpdate = ['MobileNumber', 'Password', 'DeviceId', 'Coins', 'WalletBalance']
    const hasUpdates = fieldsToUpdate.some(field => req.body[field] !== undefined)
    
    if (!hasUpdates) {
      return res.status(400).json({
        message: "No fields provided to update. Please provide at least one field: MobileNumber, Password, DeviceId, Coins, or WalletBalance"
      })
    }

    // Save user
    await user.save()

    // Refresh user data to get latest values
    const updatedUser = await userModel.findById(userId)

    // Decrypt password to get original password
    let originalPassword = null;
    try {
      if (updatedUser.Password) {
        originalPassword = decryptPassword(updatedUser.Password);
      }
    } catch (decryptError) {
      console.error('Error decrypting password:', decryptError);
      // Continue even if decryption fails, password will be null
    }

    // Get user's statistics for response
    const withdrawalRequests = await withdrawalRequestModel.find({ UserId: userId })
    const referralCount = await userModel.countDocuments({ ReferredBy: updatedUser.ReferCode })

    return res.json({
      message: "User updated successfully",
      data: {
        userId: updatedUser._id,
        mobileNumber: updatedUser.MobileNumber,
        password: originalPassword, // Original decrypted password
        deviceId: updatedUser.DeviceId,
        referCode: updatedUser.ReferCode,
        coins: updatedUser.Coins || 0,
        walletBalance: updatedUser.WalletBalance || 0,
        referredBy: updatedUser.ReferredBy || null,
        isBlocked: updatedUser.IsBlocked || false,
        blockedAt: updatedUser.BlockedAt || null,
        blockedReason: updatedUser.BlockedReason || null,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        changes: {
          mobileNumber: MobileNumber !== undefined ? {
            from: originalValues.mobileNumber,
            to: updatedUser.MobileNumber
          } : undefined,
          deviceId: DeviceId !== undefined ? {
            from: originalValues.deviceId,
            to: updatedUser.DeviceId
          } : undefined,
          coins: Coins !== undefined ? {
            from: originalValues.coins,
            to: updatedUser.Coins || 0
          } : undefined,
          walletBalance: WalletBalance !== undefined ? {
            from: originalValues.walletBalance,
            to: updatedUser.WalletBalance || 0
          } : undefined,
          password: Password !== undefined ? {
            from: originalValues.password || "N/A",
            to: originalPassword || "N/A"
          } : undefined
        },
        statistics: {
          referralCount: referralCount,
          totalWithdrawalRequests: withdrawalRequests.length
        }
      }
    })

  } catch (err) {
    console.error('Edit User - Error:', err)
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0]
      return res.status(400).json({
        message: `${field} already exists for another user`
      })
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Block User API (Admin)
router.post('/users/:userId/block', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { reason } = req.body

    // Find user
    const user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Check if user is already blocked
    if (user.IsBlocked === true) {
      return res.status(400).json({
        message: "User is already blocked"
      })
    }

    // Block the user
    user.IsBlocked = true
    user.BlockedAt = new Date()
    user.BlockedReason = reason || null
    await user.save()

    return res.json({
      message: "User blocked successfully",
      data: {
        userId: user._id,
        mobileNumber: user.MobileNumber,
        isBlocked: user.IsBlocked,
        blockedAt: user.BlockedAt,
        blockedReason: user.BlockedReason
      }
    })

  } catch (err) {
    console.error('Block User - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Unblock User API (Admin)
router.post('/users/:userId/unblock', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params

    // Find user
    const user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Check if user is already unblocked
    if (user.IsBlocked === false) {
      return res.status(400).json({
        message: "User is already unblocked"
      })
    }

    // Unblock the user
    user.IsBlocked = false
    user.BlockedAt = null
    user.BlockedReason = null
    await user.save()

    return res.json({
      message: "User unblocked successfully",
      data: {
        userId: user._id,
        mobileNumber: user.MobileNumber,
        isBlocked: user.IsBlocked,
        blockedAt: user.BlockedAt,
        blockedReason: user.BlockedReason
      }
    })

  } catch (err) {
    console.error('Unblock User - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== APP MANAGEMENT APIs ====================

// Create App API
router.post('/apps', verifyToken, async (req, res) => {
  try {
    const { AppName, AppImage, AppDownloadUrl, RewardCoins, Difficulty, Status, Description } = req.body
    
    if (!AppName || !AppImage || !AppDownloadUrl || RewardCoins === undefined) {
      return res.status(400).json({
        message: "AppName, AppImage, AppDownloadUrl, and RewardCoins are required"
      })
    }

    if (RewardCoins < 0) {
      return res.status(400).json({
        message: "RewardCoins must be 0 or greater"
      })
    }

    const validDifficulties = ['Easiest', 'Easy', 'Medium', 'Hard']
    const validStatuses = ['Active', 'Inactive']
    
    const difficulty = Difficulty || 'Medium'
    const status = Status || 'Active'

    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        message: "Difficulty must be one of: Easiest, Easy, Medium, Hard"
      })
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be either 'Active' or 'Inactive'"
      })
    }

    const app = await appModel.create({
      AppName: AppName,
      AppImage: AppImage,
      AppDownloadUrl: AppDownloadUrl,
      RewardCoins: RewardCoins,
      Difficulty: difficulty,
      Status: status,
      Description: Description || ''
    })

    return res.json({
      message: "App created successfully",
      data: app
    })

  } catch (err) {
    console.error('Create App - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get All Apps API
router.get('/apps', verifyToken, async (req, res) => {
  try {
    const { status, difficulty, sortBy } = req.query
    
    let query = {}
    if (status && ['Active', 'Inactive'].includes(status)) {
      query.Status = status
    }
    if (difficulty && ['Easiest', 'Easy', 'Medium', 'Hard'].includes(difficulty)) {
      query.Difficulty = difficulty
    }

    let sortOptions = { createdAt: -1 } // Default: newest first
    if (sortBy === 'reward') {
      sortOptions = { RewardCoins: -1 } // Highest paying first
    } else if (sortBy === 'difficulty') {
      const difficultyOrder = { 'Easiest': 1, 'Easy': 2, 'Medium': 3, 'Hard': 4 }
      // We'll sort in memory for difficulty
    }

    let apps = await appModel.find(query).sort(sortOptions)

    // If sorting by difficulty, sort in memory
    if (sortBy === 'difficulty') {
      const difficultyOrder = { 'Easiest': 1, 'Easy': 2, 'Medium': 3, 'Hard': 4 }
      apps = apps.sort((a, b) => difficultyOrder[a.Difficulty] - difficultyOrder[b.Difficulty])
    }

    // Get statistics for each app
    const appsWithStats = await Promise.all(apps.map(async (app) => {
      const totalSubmissions = await appInstallationSubmissionModel.countDocuments({ AppId: app._id })
      const approvedSubmissions = await appInstallationSubmissionModel.countDocuments({ 
        AppId: app._id, 
        Status: 'Approved' 
      })
      const pendingSubmissions = await appInstallationSubmissionModel.countDocuments({ 
        AppId: app._id, 
        Status: 'Pending' 
      })

      return {
        appId: app._id,
        appName: app.AppName,
        appImage: app.AppImage,
        appDownloadUrl: app.AppDownloadUrl,
        rewardCoins: app.RewardCoins,
        difficulty: app.Difficulty,
        status: app.Status,
        description: app.Description,
        statistics: {
          totalSubmissions: totalSubmissions,
          approvedSubmissions: approvedSubmissions,
          pendingSubmissions: pendingSubmissions
        },
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }
    }))

    return res.json({
      message: "Apps retrieved successfully",
      data: {
        apps: appsWithStats,
        totalApps: appsWithStats.length
      }
    })

  } catch (err) {
    console.error('Get All Apps - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== APP INSTALLATION SUBMISSION APIs ====================

// Get All App Installation Submissions API (MUST come before /apps/:appId route)
router.get('/apps/submissions', verifyToken, async (req, res) => {
  try {
    const { status, appId, userId, sortBy } = req.query
    
    let query = {}
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      query.Status = status
    }
    if (appId) {
      query.AppId = appId
    }
    if (userId) {
      query.UserId = userId
    }

    let sortOptions = { createdAt: -1 } // Default: newest first
    if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 }
    }

    const submissions = await appInstallationSubmissionModel.find(query)
      .populate('UserId', 'MobileNumber DeviceId ReferCode')
      .populate('AppId', 'AppName AppImage RewardCoins Difficulty')
      .sort(sortOptions)

    const formattedSubmissions = submissions.map(sub => ({
      submissionId: sub._id,
      userId: sub.UserId._id,
      userMobileNumber: sub.UserId.MobileNumber,
      userDeviceId: sub.UserId.DeviceId,
      userReferCode: sub.UserId.ReferCode,
      appId: sub.AppId._id,
      appName: sub.AppId.AppName,
      appImage: sub.AppId.AppImage,
      appRewardCoins: sub.AppId.RewardCoins,
      appDifficulty: sub.AppId.Difficulty,
      screenshotUrl: sub.ScreenshotUrl,
      status: sub.Status,
      adminNotes: sub.AdminNotes,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }))

    return res.json({
      message: "App installation submissions retrieved successfully",
      data: {
        submissions: formattedSubmissions,
        totalSubmissions: formattedSubmissions.length,
        pendingCount: formattedSubmissions.filter(s => s.status === 'Pending').length,
        approvedCount: formattedSubmissions.filter(s => s.status === 'Approved').length,
        rejectedCount: formattedSubmissions.filter(s => s.status === 'Rejected').length
      }
    })

  } catch (err) {
    console.error('Get App Submissions - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Single App API
router.get('/apps/:appId', verifyToken, async (req, res) => {
  try {
    const { appId } = req.params

    const app = await appModel.findById(appId)
    if (!app) {
      return res.status(404).json({
        message: "App not found"
      })
    }

    // Get statistics
    const totalSubmissions = await appInstallationSubmissionModel.countDocuments({ AppId: appId })
    const approvedSubmissions = await appInstallationSubmissionModel.countDocuments({ 
      AppId: appId, 
      Status: 'Approved' 
    })
    const pendingSubmissions = await appInstallationSubmissionModel.countDocuments({ 
      AppId: appId, 
      Status: 'Pending' 
    })
    const rejectedSubmissions = await appInstallationSubmissionModel.countDocuments({ 
      AppId: appId, 
      Status: 'Rejected' 
    })

    return res.json({
      message: "App retrieved successfully",
      data: {
        appId: app._id,
        appName: app.AppName,
        appImage: app.AppImage,
        appDownloadUrl: app.AppDownloadUrl,
        rewardCoins: app.RewardCoins,
        difficulty: app.Difficulty,
        status: app.Status,
        description: app.Description,
        statistics: {
          totalSubmissions: totalSubmissions,
          approvedSubmissions: approvedSubmissions,
          pendingSubmissions: pendingSubmissions,
          rejectedSubmissions: rejectedSubmissions
        },
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }
    })

  } catch (err) {
    console.error('Get App - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Update App API
router.put('/apps/:appId', verifyToken, async (req, res) => {
  try {
    const { appId } = req.params
    const { AppName, AppImage, AppDownloadUrl, RewardCoins, Difficulty, Status, Description } = req.body

    const app = await appModel.findById(appId)
    if (!app) {
      return res.status(404).json({
        message: "App not found"
      })
    }

    if (RewardCoins !== undefined && RewardCoins < 0) {
      return res.status(400).json({
        message: "RewardCoins must be 0 or greater"
      })
    }

    const validDifficulties = ['Easiest', 'Easy', 'Medium', 'Hard']
    const validStatuses = ['Active', 'Inactive']
    
    if (Difficulty && !validDifficulties.includes(Difficulty)) {
      return res.status(400).json({
        message: "Difficulty must be one of: Easiest, Easy, Medium, Hard"
      })
    }

    if (Status && !validStatuses.includes(Status)) {
      return res.status(400).json({
        message: "Status must be either 'Active' or 'Inactive'"
      })
    }

    // Update fields
    if (AppName !== undefined) app.AppName = AppName
    if (AppImage !== undefined) app.AppImage = AppImage
    if (AppDownloadUrl !== undefined) app.AppDownloadUrl = AppDownloadUrl
    if (RewardCoins !== undefined) app.RewardCoins = RewardCoins
    if (Difficulty !== undefined) app.Difficulty = Difficulty
    if (Status !== undefined) app.Status = Status
    if (Description !== undefined) app.Description = Description

    await app.save()

    return res.json({
      message: "App updated successfully",
      data: app
    })

  } catch (err) {
    console.error('Update App - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Delete App API
router.delete('/apps/:appId', verifyToken, async (req, res) => {
  try {
    const { appId } = req.params

    const app = await appModel.findById(appId)
    if (!app) {
      return res.status(404).json({
        message: "App not found"
      })
    }

    // Check if there are any submissions for this app
    const submissionsCount = await appInstallationSubmissionModel.countDocuments({ AppId: appId })
    if (submissionsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete app. There are ${submissionsCount} submission(s) associated with this app.`
      })
    }

    await appModel.findByIdAndDelete(appId)

    return res.json({
      message: "App deleted successfully"
    })

  } catch (err) {
    console.error('Delete App - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Approve/Reject App Installation Submission API
router.post('/apps/submissions/:submissionId/status', verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params
    const { status, adminNotes } = req.body

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status is required and must be either 'Approved' or 'Rejected'"
      })
    }

    const submission = await appInstallationSubmissionModel.findById(submissionId)
      .populate('UserId')
      .populate('AppId')

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found"
      })
    }

    if (submission.Status !== 'Pending') {
      return res.status(400).json({
        message: `This submission has already been ${submission.Status.toLowerCase()}`
      })
    }

    // Get user
    const user = await userModel.findById(submission.UserId._id)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Update submission status
    submission.Status = status
    if (adminNotes) {
      submission.AdminNotes = adminNotes
    }
    await submission.save()

    // If approved, add reward coins to user's wallet
    if (status === 'Approved') {
      const appInstallControl = await taskControlSettingsModel.getControl('AppInstall')
      const rewardCoins = appInstallControl.CoinsPerTask !== null && appInstallControl.CoinsPerTask !== undefined
        ? appInstallControl.CoinsPerTask
        : (submission.AppId.RewardCoins || 0)
      user.Coins = (user.Coins || 0) + rewardCoins
      await user.save()
    }

    return res.json({
      message: `Submission ${status.toLowerCase()} successfully`,
      data: {
        submissionId: submission._id,
        appName: submission.AppId.AppName,
        rewardCoins: submission.AppId.RewardCoins,
        status: submission.Status,
        adminNotes: submission.AdminNotes,
        userCoins: user.Coins,
        updatedAt: submission.updatedAt
      }
    })

  } catch (err) {
    console.error('Update Submission Status - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Bulk Approve/Reject App Installation Submissions API
router.post('/apps/submissions/bulk-status', verifyToken, async (req, res) => {
  try {
    const { submissionIds, status, adminNotes } = req.body

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({
        message: "submissionIds must be a non-empty array"
      })
    }

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status is required and must be either 'Approved' or 'Rejected'"
      })
    }

    const submissions = await appInstallationSubmissionModel.find({
      _id: { $in: submissionIds },
      Status: 'Pending'
    }).populate('AppId', 'RewardCoins AppName')

    const results = []
    let processedCount = 0

    for (const submission of submissions) {
      submission.Status = status
      if (adminNotes !== undefined) {
        submission.AdminNotes = adminNotes
      }
      await submission.save()

      let finalCoins = null
      if (status === 'Approved') {
        const appInstallControl = await taskControlSettingsModel.getControl('AppInstall')
        const rewardCoins = appInstallControl.CoinsPerTask !== null && appInstallControl.CoinsPerTask !== undefined
          ? appInstallControl.CoinsPerTask
          : (submission.AppId?.RewardCoins || 0)

        const user = await userModel.findById(submission.UserId)
        if (user) {
          user.Coins = (user.Coins || 0) + rewardCoins
          await user.save()
          finalCoins = user.Coins || 0
        }
      }

      processedCount += 1
      results.push({
        submissionId: submission._id,
        status: submission.Status,
        appName: submission.AppId?.AppName || null,
        userCoins: finalCoins
      })
    }

    return res.json({
      message: `Bulk ${status.toLowerCase()} completed`,
      data: {
        requested: submissionIds.length,
        processed: processedCount,
        skipped: submissionIds.length - processedCount,
        results: results
      }
    })
  } catch (err) {
    console.error('Bulk Update App Submission Status - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Delete App Installation Submission API
router.delete('/apps/submissions/:submissionId', verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params
    const { allowApprovedDelete = false, revertReward = false } = req.query

    const submission = await appInstallationSubmissionModel.findById(submissionId)
      .populate('AppId', 'RewardCoins')

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found"
      })
    }

    if (submission.Status === 'Approved' && String(allowApprovedDelete) !== 'true') {
      return res.status(400).json({
        message: "Approved submission cannot be deleted without allowApprovedDelete=true"
      })
    }

    if (submission.Status === 'Approved' && String(revertReward) === 'true') {
      const appInstallControl = await taskControlSettingsModel.getControl('AppInstall')
      const rewardCoins = appInstallControl.CoinsPerTask !== null && appInstallControl.CoinsPerTask !== undefined
        ? appInstallControl.CoinsPerTask
        : (submission.AppId?.RewardCoins || 0)
      await userModel.findByIdAndUpdate(submission.UserId, {
        $inc: { Coins: -Math.abs(rewardCoins) }
      })
    }

    await appInstallationSubmissionModel.findByIdAndDelete(submissionId)

    return res.json({
      message: "Submission deleted successfully",
      data: {
        submissionId: submissionId,
        status: submission.Status
      }
    })
  } catch (err) {
    console.error('Delete App Submission - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== COIN CONVERSION SETTINGS APIs ====================

// Set Coin Conversion Settings API
router.post('/coinconversion/settings', verifyToken, async (req, res) => {
  try {
    const { CoinsPerRupee, MinimumCoinsToConvert } = req.body
    
    if (CoinsPerRupee === undefined || MinimumCoinsToConvert === undefined) {
      return res.status(400).json({
        message: "CoinsPerRupee and MinimumCoinsToConvert are required"
      })
    }

    if (CoinsPerRupee <= 0) {
      return res.status(400).json({
        message: "CoinsPerRupee must be greater than 0"
      })
    }

    if (MinimumCoinsToConvert < 0) {
      return res.status(400).json({
        message: "MinimumCoinsToConvert must be 0 or greater"
      })
    }

    // Get or create settings
    let settings = await coinConversionSettingsModel.findOne()
    if (settings) {
      settings.CoinsPerRupee = CoinsPerRupee
      settings.MinimumCoinsToConvert = MinimumCoinsToConvert
      await settings.save()
    } else {
      settings = await coinConversionSettingsModel.create({
        CoinsPerRupee: CoinsPerRupee,
        MinimumCoinsToConvert: MinimumCoinsToConvert
      })
    }

    return res.json({
      message: "Coin conversion settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Set Coin Conversion Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Coin Conversion Settings API
router.get('/coinconversion/settings', verifyToken, async (req, res) => {
  try {
    let settings = await coinConversionSettingsModel.getSettings()

    return res.json({
      message: "Coin conversion settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    console.error('Get Coin Conversion Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== SIGNUP BONUS SETTINGS APIs ====================

// Set Signup Bonus Settings API
router.post('/signupbonus/settings', verifyToken, async (req, res) => {
  try {
    const { SignupBonusAmount, RewardType } = req.body
    
    if (SignupBonusAmount === undefined || SignupBonusAmount === null) {
      return res.status(400).json({
        message: "SignupBonusAmount is required"
      })
    }

    if (typeof SignupBonusAmount !== 'number' || SignupBonusAmount < 0) {
      return res.status(400).json({
        message: "SignupBonusAmount must be a number greater than or equal to 0"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await signupBonusSettingsModel.findOne()
    if (settings) {
      settings.SignupBonusAmount = SignupBonusAmount
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await signupBonusSettingsModel.create({
        SignupBonusAmount: SignupBonusAmount,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Signup bonus settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Set Signup Bonus Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Signup Bonus Settings API
router.get('/signupbonus/settings', verifyToken, async (req, res) => {
  try {
    let settings = await signupBonusSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
        SignupBonusAmount: 0,
        RewardType: 'Coins'
      }
    }

    return res.json({
      message: "Signup bonus settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    console.error('Get Signup Bonus Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== SCRATCH CARD SETTINGS APIs ====================

// Helper function to get start of week (Monday) normalized to midnight
function getWeekStartDate(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// Set Scratch Card Settings API
router.post('/scratchcard/settings', verifyToken, async (req, res) => {
  try {
    const { Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, RewardType } = req.body
    
    // Validate all days are provided
    if (Sunday === undefined || Monday === undefined || Tuesday === undefined || 
        Wednesday === undefined || Thursday === undefined || Friday === undefined || 
        Saturday === undefined) {
      return res.status(400).json({
        message: "All days (Sunday through Saturday) are required"
      })
    }

    if (Sunday < 0 || Monday < 0 || Tuesday < 0 || Wednesday < 0 || 
        Thursday < 0 || Friday < 0 || Saturday < 0) {
      return res.status(400).json({
        message: "All scratch card amounts must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await scratchCardSettingsModel.findOne()
    if (settings) {
      settings.Sunday = Sunday
      settings.Monday = Monday
      settings.Tuesday = Tuesday
      settings.Wednesday = Wednesday
      settings.Thursday = Thursday
      settings.Friday = Friday
      settings.Saturday = Saturday
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await scratchCardSettingsModel.create({
        Sunday: Sunday,
        Monday: Monday,
        Tuesday: Tuesday,
        Wednesday: Wednesday,
        Thursday: Thursday,
        Friday: Friday,
        Saturday: Saturday,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Scratch card settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Set Scratch Card Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Scratch Card Settings API
router.get('/scratchcard/settings', verifyToken, async (req, res) => {
  try {
    let settings = await scratchCardSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
        Sunday: 0,
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        RewardType: 'Coins'
      }
    }

    return res.json({
      message: "Scratch card settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    console.error('Get Scratch Card Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== SCRATCH CARD DAILY LIMIT SETTINGS APIs ====================

// Set Scratch Card Daily Limit Settings API
router.post('/scratchcard/dailylimit/settings', verifyToken, async (req, res) => {
  try {
    const { DailyLimit, RewardAmount, RewardCoins, IsActive } = req.body
    
    // Validate DailyLimit
    if (DailyLimit !== undefined && DailyLimit !== null) {
      if (typeof DailyLimit !== 'number' || isNaN(DailyLimit) || DailyLimit < 1) {
        return res.status(400).json({
          message: "DailyLimit must be a number greater than or equal to 1"
        })
      }
    }

    // Validate RewardAmount
    if (RewardAmount !== undefined && RewardAmount !== null) {
      if (typeof RewardAmount !== 'number' || isNaN(RewardAmount) || RewardAmount < 0) {
        return res.status(400).json({
          message: "RewardAmount must be a number greater than or equal to 0"
        })
      }
    }

    // Validate RewardCoins
    if (RewardCoins !== undefined && RewardCoins !== null) {
      if (typeof RewardCoins !== 'number' || isNaN(RewardCoins) || RewardCoins < 0) {
        return res.status(400).json({
          message: "RewardCoins must be a number greater than or equal to 0"
        })
      }
    }

    // Validate IsActive
    if (IsActive !== undefined && IsActive !== null && typeof IsActive !== 'boolean') {
      return res.status(400).json({
        message: "IsActive must be a boolean value"
      })
    }

    // Update or create settings
    let settings = await scratchCardDailyLimitSettingsModel.findOne()
    if (settings) {
      // Update only provided fields
      if (DailyLimit !== undefined) settings.DailyLimit = DailyLimit
      if (RewardAmount !== undefined) settings.RewardAmount = RewardAmount
      if (RewardCoins !== undefined) settings.RewardCoins = RewardCoins
      if (IsActive !== undefined) settings.IsActive = IsActive
      
      // Check if at least one reward is set after update
      // Use updated values if provided, otherwise use existing values
      const finalRewardAmount = RewardAmount !== undefined ? RewardAmount : (settings.RewardAmount || 0)
      const finalRewardCoins = RewardCoins !== undefined ? RewardCoins : (settings.RewardCoins || 0)
      
      if (finalRewardAmount === 0 && finalRewardCoins === 0) {
        return res.status(400).json({
          message: "At least one reward (RewardAmount or RewardCoins) must be greater than 0"
        })
      }
      
      // Update the settings with final values
      settings.RewardAmount = finalRewardAmount
      settings.RewardCoins = finalRewardCoins
      
      await settings.save()
    } else {
      // Check if at least one reward is set for new settings
      const finalRewardAmount = RewardAmount !== undefined ? RewardAmount : 0
      const finalRewardCoins = RewardCoins !== undefined ? RewardCoins : 0
      
      if (finalRewardAmount === 0 && finalRewardCoins === 0) {
        return res.status(400).json({
          message: "At least one reward (RewardAmount or RewardCoins) must be greater than 0"
        })
      }
      
      settings = await scratchCardDailyLimitSettingsModel.create({
        DailyLimit: DailyLimit !== undefined ? DailyLimit : 1,
        RewardAmount: finalRewardAmount,
        RewardCoins: finalRewardCoins,
        IsActive: IsActive !== undefined ? IsActive : true
      })
    }

    return res.json({
      message: "Scratch card daily limit settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Set Scratch Card Daily Limit Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Scratch Card Daily Limit Settings API
router.get('/scratchcard/dailylimit/settings', verifyToken, async (req, res) => {
  try {
    let settings = await scratchCardDailyLimitSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
        DailyLimit: 1,
        RewardAmount: 0,
        RewardCoins: 0,
        IsActive: true
      }
    }

    return res.json({
      message: "Scratch card daily limit settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    console.error('Get Scratch Card Daily Limit Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== WITHDRAWAL SETTINGS APIs ====================

// Set Withdrawal Threshold API
router.post('/withdrawal/threshold', verifyAdminToken, async (req, res) => {
  try {
    const { MinimumWithdrawalAmount, DailyWithdrawalRequestLimit, WithdrawalDenominations } = req.body
    
    if (MinimumWithdrawalAmount === undefined || MinimumWithdrawalAmount === null) {
      return res.status(400).json({
        message: "MinimumWithdrawalAmount is required"
      })
    }

    if (typeof MinimumWithdrawalAmount !== 'number' || isNaN(MinimumWithdrawalAmount)) {
      return res.status(400).json({
        message: "MinimumWithdrawalAmount must be a valid number"
      })
    }

    if (MinimumWithdrawalAmount < 1) {
      return res.status(400).json({
        message: "MinimumWithdrawalAmount must be at least 1"
      })
    }

    if (DailyWithdrawalRequestLimit !== undefined && (typeof DailyWithdrawalRequestLimit !== 'number' || DailyWithdrawalRequestLimit < 1 || DailyWithdrawalRequestLimit > 8 || !Number.isInteger(DailyWithdrawalRequestLimit))) {
      return res.status(400).json({
        message: "DailyWithdrawalRequestLimit must be an integer between 1 and 8"
      })
    }

    if (WithdrawalDenominations !== undefined) {
      if (!Array.isArray(WithdrawalDenominations) || WithdrawalDenominations.length === 0) {
        return res.status(400).json({
          message: "WithdrawalDenominations must be a non-empty array of numbers"
        })
      }
      if (!WithdrawalDenominations.every(d => typeof d === 'number' && d > 0)) {
        return res.status(400).json({
          message: "Each denomination must be a positive number"
        })
      }
    }

    // Update or create settings
    let settings = await withdrawalSettingsModel.findOne()
    if (settings) {
      settings.MinimumWithdrawalAmount = MinimumWithdrawalAmount
      if (DailyWithdrawalRequestLimit !== undefined) {
        settings.DailyWithdrawalRequestLimit = DailyWithdrawalRequestLimit
      }
      if (WithdrawalDenominations !== undefined) {
        settings.WithdrawalDenominations = WithdrawalDenominations
      }
      await settings.save()
    } else {
      settings = await withdrawalSettingsModel.create({
        MinimumWithdrawalAmount: MinimumWithdrawalAmount,
        DailyWithdrawalRequestLimit: DailyWithdrawalRequestLimit !== undefined ? DailyWithdrawalRequestLimit : 1,
        WithdrawalDenominations: WithdrawalDenominations !== undefined ? WithdrawalDenominations : [10, 20, 30, 50]
      })
    }

    return res.json({
      message: "Withdrawal threshold updated successfully",
      data: {
        MinimumWithdrawalAmount: settings.MinimumWithdrawalAmount,
        DailyWithdrawalRequestLimit: settings.DailyWithdrawalRequestLimit,
        WithdrawalDenominations: settings.WithdrawalDenominations,
        updatedAt: settings.updatedAt
      }
    })

  } catch (err) {
    console.error('Set Withdrawal Threshold - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Withdrawal Threshold API
router.get('/withdrawal/threshold', verifyAdminToken, async (req, res) => {
  try {
    let settings = await withdrawalSettingsModel.getSettings()

    return res.json({
      message: "Withdrawal threshold retrieved successfully",
      data: {
        MinimumWithdrawalAmount: settings.MinimumWithdrawalAmount,
        DailyWithdrawalRequestLimit: settings.DailyWithdrawalRequestLimit,
        WithdrawalDenominations: settings.WithdrawalDenominations,
        updatedAt: settings.updatedAt
      }
    })

  } catch (err) {
    console.error('Get Withdrawal Threshold - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== TASK CONTROL APIs ====================
router.get('/task-controls', verifyAdminToken, async (req, res) => {
  try {
    const controls = await Promise.all(
      CONTROLLED_TASK_TYPES.map(async (taskType) => taskControlSettingsModel.getControl(taskType))
    )
    return res.json({
      message: "Task controls retrieved successfully",
      data: controls
    })
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.post('/task-controls/:taskType', verifyAdminToken, async (req, res) => {
  try {
    const { taskType } = req.params
    const { IsActive, AdsEnabled, DailyLimit, CoinsPerTask } = req.body

    if (!CONTROLLED_TASK_TYPES.includes(taskType)) {
      return res.status(400).json({
        message: `taskType must be one of ${CONTROLLED_TASK_TYPES.join(', ')}`
      })
    }

    const control = await taskControlSettingsModel.getControl(taskType)
    if (IsActive !== undefined) control.IsActive = Boolean(IsActive)
    if (AdsEnabled !== undefined) control.AdsEnabled = Boolean(AdsEnabled)
    if (DailyLimit !== undefined) {
      control.DailyLimit = DailyLimit === null ? null : Number(DailyLimit)
    }
    if (CoinsPerTask !== undefined) {
      control.CoinsPerTask = CoinsPerTask === null ? null : Number(CoinsPerTask)
    }

    await control.save()
    return res.json({
      message: "Task control updated successfully",
      data: control
    })
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== ADS MANAGEMENT APIs ====================
router.get('/ads/settings', verifyAdminToken, async (req, res) => {
  try {
    const settings = await adsManagementSettingsModel.getSettings()
    return res.json({
      message: "Ads settings retrieved successfully",
      data: settings
    })
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.post('/ads/settings', verifyAdminToken, async (req, res) => {
  try {
    const {
      GlobalAdsEnabled,
      BannerAdsEnabled,
      RewardedAdsEnabled,
      InterstitialAdsEnabled,
      TaskRules
    } = req.body

    const settings = await adsManagementSettingsModel.getSettings()

    if (GlobalAdsEnabled !== undefined) settings.GlobalAdsEnabled = Boolean(GlobalAdsEnabled)
    if (BannerAdsEnabled !== undefined) settings.BannerAdsEnabled = Boolean(BannerAdsEnabled)
    if (RewardedAdsEnabled !== undefined) settings.RewardedAdsEnabled = Boolean(RewardedAdsEnabled)
    if (InterstitialAdsEnabled !== undefined) settings.InterstitialAdsEnabled = Boolean(InterstitialAdsEnabled)

    if (Array.isArray(TaskRules)) {
      const validTaskTypes = adsManagementSettingsModel.TASK_TYPES
      for (const incomingRule of TaskRules) {
        if (!incomingRule || !incomingRule.TaskType || !validTaskTypes.includes(incomingRule.TaskType)) {
          continue
        }

        let existingRule = settings.TaskRules.find(rule => rule.TaskType === incomingRule.TaskType)
        if (!existingRule) {
          settings.TaskRules.push({
            TaskType: incomingRule.TaskType,
            IsActive: true,
            BannerEnabled: true,
            RewardedEnabled: true,
            InterstitialEnabled: true,
            InterstitialAfterCount: 1,
            RewardedAfterCount: 1
          })
          existingRule = settings.TaskRules.find(rule => rule.TaskType === incomingRule.TaskType)
        }

        if (incomingRule.IsActive !== undefined) existingRule.IsActive = Boolean(incomingRule.IsActive)
        if (incomingRule.BannerEnabled !== undefined) existingRule.BannerEnabled = Boolean(incomingRule.BannerEnabled)
        if (incomingRule.RewardedEnabled !== undefined) existingRule.RewardedEnabled = Boolean(incomingRule.RewardedEnabled)
        if (incomingRule.InterstitialEnabled !== undefined) existingRule.InterstitialEnabled = Boolean(incomingRule.InterstitialEnabled)
        if (incomingRule.InterstitialAfterCount !== undefined) {
          existingRule.InterstitialAfterCount = Math.max(1, Number(incomingRule.InterstitialAfterCount) || 1)
        }
        if (incomingRule.RewardedAfterCount !== undefined) {
          existingRule.RewardedAfterCount = Math.max(1, Number(incomingRule.RewardedAfterCount) || 1)
        }
      }
    }

    await settings.save()
    return res.json({
      message: "Ads settings updated successfully",
      data: settings
    })
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.post('/ads/settings/task/:taskType', verifyAdminToken, async (req, res) => {
  try {
    const { taskType } = req.params
    const validTaskTypes = adsManagementSettingsModel.TASK_TYPES
    if (!validTaskTypes.includes(taskType)) {
      return res.status(400).json({
        message: `taskType must be one of ${validTaskTypes.join(', ')}`
      })
    }

    const {
      IsActive,
      BannerEnabled,
      RewardedEnabled,
      InterstitialEnabled,
      InterstitialAfterCount,
      RewardedAfterCount
    } = req.body

    const settings = await adsManagementSettingsModel.getSettings()
    let taskRule = settings.TaskRules.find(rule => rule.TaskType === taskType)
    if (!taskRule) {
      settings.TaskRules.push({
        TaskType: taskType,
        IsActive: true,
        BannerEnabled: true,
        RewardedEnabled: true,
        InterstitialEnabled: true,
        InterstitialAfterCount: 1,
        RewardedAfterCount: 1
      })
      taskRule = settings.TaskRules.find(rule => rule.TaskType === taskType)
    }

    if (IsActive !== undefined) taskRule.IsActive = Boolean(IsActive)
    if (BannerEnabled !== undefined) taskRule.BannerEnabled = Boolean(BannerEnabled)
    if (RewardedEnabled !== undefined) taskRule.RewardedEnabled = Boolean(RewardedEnabled)
    if (InterstitialEnabled !== undefined) taskRule.InterstitialEnabled = Boolean(InterstitialEnabled)
    if (InterstitialAfterCount !== undefined) taskRule.InterstitialAfterCount = Math.max(1, Number(InterstitialAfterCount) || 1)
    if (RewardedAfterCount !== undefined) taskRule.RewardedAfterCount = Math.max(1, Number(RewardedAfterCount) || 1)

    await settings.save()
    return res.json({
      message: "Task ad settings updated successfully",
      data: taskRule
    })
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== ADMIN DASHBOARD API ====================

// Get Admin Dashboard Statistics API
router.get('/dashboard', verifyAdminToken, async (req, res) => {
  try {
    const { days = 30 } = req.query // Default to last 30 days for registration chart
    
    // 1. Total Users Count
    const totalUsers = await userModel.countDocuments()

    // 2. Total Wallet Balance (sum of all users' wallet balances)
    const totalWalletBalanceResult = await userModel.aggregate([
      {
        $group: {
          _id: null,
          totalWalletBalance: { $sum: { $ifNull: ['$WalletBalance', 0] } }
        }
      }
    ])
    const totalWalletBalance = totalWalletBalanceResult[0]?.totalWalletBalance || 0

    // 3. Total Coins (sum of all users' coins)
    const totalCoinsResult = await userModel.aggregate([
      {
        $group: {
          _id: null,
          totalCoins: { $sum: { $ifNull: ['$Coins', 0] } }
        }
      }
    ])
    const totalCoins = totalCoinsResult[0]?.totalCoins || 0

    // 4. Day-wise User Registration Chart (last N days)
    const daysNum = parseInt(days) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysNum)
    startDate.setHours(0, 0, 0, 0)

    // Get day-wise registration data
    const registrationData = await userModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ])

    // Format registration chart data
    const registrationChart = registrationData.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      registrations: item.count
    }))

    // Fill in missing days with 0 registrations
    const chartData = []
    const today = new Date()
    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const existingData = registrationChart.find(item => item.date === dateStr)
      
      chartData.push({
        date: dateStr,
        registrations: existingData ? existingData.registrations : 0
      })
    }

    // 5. Total Withdrawals Amount (sum of all approved withdrawals)
    const totalWithdrawalsResult = await withdrawalRequestModel.aggregate([
      {
        $match: {
          Status: 'Approved'
        }
      },
      {
        $group: {
          _id: null,
          totalWithdrawals: { $sum: '$Amount' }
        }
      }
    ])
    const totalWithdrawals = totalWithdrawalsResult[0]?.totalWithdrawals || 0

    // 6. Withdrawal Statistics
    const withdrawalStats = await withdrawalRequestModel.aggregate([
      {
        $group: {
          _id: '$Status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$Amount' }
        }
      }
    ])

    const withdrawalStatistics = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 }
    }

    withdrawalStats.forEach(stat => {
      if (stat._id === 'Pending') {
        withdrawalStatistics.pending = { count: stat.count, totalAmount: stat.totalAmount }
      } else if (stat._id === 'Approved') {
        withdrawalStatistics.approved = { count: stat.count, totalAmount: stat.totalAmount }
      } else if (stat._id === 'Rejected') {
        withdrawalStatistics.rejected = { count: stat.count, totalAmount: stat.totalAmount }
      }
    })

    // 7. Recent registrations (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    const recentRegistrations = await userModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })

    // 8. Today's registrations
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayRegistrations = await userModel.countDocuments({
      createdAt: { $gte: todayStart }
    })

    const yesterdayStart = getStartOfYesterday()
    const sevenDayStart = new Date(todayStart)
    sevenDayStart.setDate(sevenDayStart.getDate() - 6)
    const thisMonthStart = getStartOfMonth(0)
    const lastMonthStart = getStartOfMonth(-1)

    const yesterdayRegistrations = await userModel.countDocuments({
      createdAt: { $gte: yesterdayStart, $lt: todayStart }
    })
    const sevenDayUsers = await userModel.countDocuments({
      createdAt: { $gte: sevenDayStart }
    })
    const thisMonthUsers = await userModel.countDocuments({
      createdAt: { $gte: thisMonthStart }
    })
    const lastMonthUsers = await userModel.countDocuments({
      createdAt: { $gte: lastMonthStart, $lt: thisMonthStart }
    })

    const withdrawalsTodayAgg = await withdrawalRequestModel.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$Amount' } } }
    ])
    const withdrawalsYesterdayAgg = await withdrawalRequestModel.aggregate([
      { $match: { createdAt: { $gte: yesterdayStart, $lt: todayStart } } },
      { $group: { _id: null, total: { $sum: '$Amount' } } }
    ])
    const withdrawalsThisMonthAgg = await withdrawalRequestModel.aggregate([
      { $match: { createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$Amount' } } }
    ])

    const todayWithdrawal = withdrawalsTodayAgg[0]?.total || 0
    const yesterdayWithdrawal = withdrawalsYesterdayAgg[0]?.total || 0
    const thisMonthWithdrawal = withdrawalsThisMonthAgg[0]?.total || 0

    return res.json({
      message: "Dashboard statistics retrieved successfully",
      data: {
        requestedSummary: {
          users: {
            today: todayRegistrations,
            yesterday: yesterdayRegistrations,
            sevenDays: sevenDayUsers,
            thisMonth: thisMonthUsers,
            lastMonth: lastMonthUsers,
            total: totalUsers
          },
          withdrawals: {
            today: todayWithdrawal,
            yesterday: yesterdayWithdrawal,
            thisMonth: thisMonthWithdrawal
          }
        },
        users: {
          totalUsers: totalUsers,
          todayRegistrations: todayRegistrations,
          recentRegistrations: recentRegistrations // Last 7 days
        },
        wallet: {
          totalWalletBalance: totalWalletBalance,
          totalCoins: totalCoins
        },
        withdrawals: {
          totalWithdrawals: totalWithdrawals, // Total approved withdrawals amount
          statistics: withdrawalStatistics
        },
        registrationChart: {
          days: daysNum,
          data: chartData
        }
      }
    })

  } catch (err) {
    console.error('Get Dashboard Statistics - Error:', err)
    console.error('Get Dashboard Statistics - Error Stack:', err.stack)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== COMMISSION SLAB SETTINGS APIs ====================

// Create Commission Slab API
router.post('/commission/slabs', verifyAdminToken, async (req, res) => {
  try {
    const { SlabName, MinEarnings, MaxEarnings, CommissionPercentage, RewardType, IsActive, Order, CommissionBasedOn } = req.body
    
    if (!SlabName || MinEarnings === undefined || CommissionPercentage === undefined) {
      return res.status(400).json({
        message: "SlabName, MinEarnings, and CommissionPercentage are required"
      })
    }

    if (MinEarnings < 0) {
      return res.status(400).json({
        message: "MinEarnings must be 0 or greater"
      })
    }

    if (MaxEarnings !== null && MaxEarnings !== undefined && MaxEarnings <= MinEarnings) {
      return res.status(400).json({
        message: "MaxEarnings must be greater than MinEarnings"
      })
    }

    if (CommissionPercentage < 0 || CommissionPercentage > 100) {
      return res.status(400).json({
        message: "CommissionPercentage must be between 0 and 100"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    const validCommissionBasis = ['ReferredUserWalletBalance', 'WithdrawalRequestAmount', 'WithdrawalRequestTime']
    const commissionBasedOn = CommissionBasedOn || 'ReferredUserWalletBalance'
    
    if (!validCommissionBasis.includes(commissionBasedOn)) {
      return res.status(400).json({
        message: "CommissionBasedOn must be one of: ReferredUserWalletBalance, WithdrawalRequestAmount, WithdrawalRequestTime"
      })
    }

    // Check for overlapping slabs
    const existingSlabs = await commissionSlabSettingsModel.find({ IsActive: true })
    for (const slab of existingSlabs) {
      const slabMin = slab.MinEarnings
      const slabMax = slab.MaxEarnings || Infinity
      const newMin = MinEarnings
      const newMax = MaxEarnings || Infinity

      if ((newMin >= slabMin && newMin < slabMax) || 
          (newMax > slabMin && newMax <= slabMax) ||
          (newMin <= slabMin && newMax >= slabMax)) {
        return res.status(400).json({
          message: `Slab overlaps with existing slab "${slab.SlabName}" (${slab.MinEarnings} - ${slab.MaxEarnings || '∞'})`
        })
      }
    }

    const slab = await commissionSlabSettingsModel.create({
      SlabName: SlabName.trim(),
      MinEarnings: MinEarnings,
      MaxEarnings: MaxEarnings || null,
      CommissionPercentage: CommissionPercentage,
      RewardType: rewardType,
      IsActive: IsActive !== undefined ? IsActive : true,
      Order: Order !== undefined ? Order : 0,
      CommissionBasedOn: commissionBasedOn
    })

    return res.json({
      message: "Commission slab created successfully",
      data: slab
    })

  } catch (err) {
    console.error('Create Commission Slab - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get All Commission Slabs API
router.get('/commission/slabs', verifyAdminToken, async (req, res) => {
  try {
    const slabs = await commissionSlabSettingsModel.find()
      .sort({ Order: 1, MinEarnings: 1 })

    return res.json({
      message: "Commission slabs retrieved successfully",
      data: {
        slabs: slabs,
        totalSlabs: slabs.length,
        activeSlabs: slabs.filter(s => s.IsActive).length
      }
    })

  } catch (err) {
    console.error('Get Commission Slabs - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Update Commission Slab API
router.put('/commission/slabs/:slabId', verifyAdminToken, async (req, res) => {
  try {
    const { slabId } = req.params
    const { SlabName, MinEarnings, MaxEarnings, CommissionPercentage, RewardType, IsActive, Order, CommissionBasedOn } = req.body

    const slab = await commissionSlabSettingsModel.findById(slabId)
    if (!slab) {
      return res.status(404).json({
        message: "Commission slab not found"
      })
    }

    // Validate if provided
    if (MinEarnings !== undefined && MinEarnings < 0) {
      return res.status(400).json({
        message: "MinEarnings must be 0 or greater"
      })
    }

    if (MaxEarnings !== null && MaxEarnings !== undefined) {
      const finalMinEarnings = MinEarnings !== undefined ? MinEarnings : slab.MinEarnings
      if (MaxEarnings <= finalMinEarnings) {
        return res.status(400).json({
          message: "MaxEarnings must be greater than MinEarnings"
        })
      }
    }

    if (CommissionPercentage !== undefined && (CommissionPercentage < 0 || CommissionPercentage > 100)) {
      return res.status(400).json({
        message: "CommissionPercentage must be between 0 and 100"
      })
    }

    if (RewardType && !['Coins', 'WalletBalance'].includes(RewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    if (CommissionBasedOn && !['ReferredUserWalletBalance', 'WithdrawalRequestAmount', 'WithdrawalRequestTime'].includes(CommissionBasedOn)) {
      return res.status(400).json({
        message: "CommissionBasedOn must be one of: ReferredUserWalletBalance, WithdrawalRequestAmount, WithdrawalRequestTime"
      })
    }

    // Check for overlapping slabs (excluding current slab)
    if (MinEarnings !== undefined || MaxEarnings !== undefined) {
      const finalMin = MinEarnings !== undefined ? MinEarnings : slab.MinEarnings
      const finalMax = MaxEarnings !== undefined ? (MaxEarnings || null) : slab.MaxEarnings

      const existingSlabs = await commissionSlabSettingsModel.find({ 
        _id: { $ne: slabId },
        IsActive: true 
      })
      
      for (const existingSlab of existingSlabs) {
        const slabMin = existingSlab.MinEarnings
        const slabMax = existingSlab.MaxEarnings || Infinity
        const newMin = finalMin
        const newMax = finalMax || Infinity

        if ((newMin >= slabMin && newMin < slabMax) || 
            (newMax > slabMin && newMax <= slabMax) ||
            (newMin <= slabMin && newMax >= slabMax)) {
          return res.status(400).json({
            message: `Slab overlaps with existing slab "${existingSlab.SlabName}" (${existingSlab.MinEarnings} - ${existingSlab.MaxEarnings || '∞'})`
          })
        }
      }
    }

    // Update fields
    if (SlabName !== undefined) slab.SlabName = SlabName.trim()
    if (MinEarnings !== undefined) slab.MinEarnings = MinEarnings
    if (MaxEarnings !== undefined) slab.MaxEarnings = MaxEarnings || null
    if (CommissionPercentage !== undefined) slab.CommissionPercentage = CommissionPercentage
    if (RewardType !== undefined) slab.RewardType = RewardType
    if (IsActive !== undefined) slab.IsActive = IsActive
    if (Order !== undefined) slab.Order = Order
    if (CommissionBasedOn !== undefined) slab.CommissionBasedOn = CommissionBasedOn

    await slab.save()

    return res.json({
      message: "Commission slab updated successfully",
      data: slab
    })

  } catch (err) {
    console.error('Update Commission Slab - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Delete Commission Slab API
router.delete('/commission/slabs/:slabId', verifyAdminToken, async (req, res) => {
  try {
    const { slabId } = req.params

    const slab = await commissionSlabSettingsModel.findById(slabId)
    if (!slab) {
      return res.status(404).json({
        message: "Commission slab not found"
      })
    }

    await commissionSlabSettingsModel.findByIdAndDelete(slabId)

    return res.json({
      message: "Commission slab deleted successfully"
    })

  } catch (err) {
    console.error('Delete Commission Slab - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Update Referral Settings to support percentage
router.post('/referral/settings', verifyAdminToken, async (req, res) => {
  try {
    const { RewardForNewUser, RewardForReferrer, RewardType, UsePercentage, ReferrerPercentage, PercentageBasedOn } = req.body
    
    if (RewardForNewUser === undefined || RewardForReferrer === undefined) {
      return res.status(400).json({
        message: "RewardForNewUser and RewardForReferrer are required"
      })
    }

    if (RewardForNewUser < 0 || RewardForReferrer < 0) {
      return res.status(400).json({
        message: "Reward amounts must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Validate percentage fields if UsePercentage is true
    if (UsePercentage === true) {
      if (ReferrerPercentage === undefined || ReferrerPercentage < 0 || ReferrerPercentage > 100) {
        return res.status(400).json({
          message: "ReferrerPercentage must be between 0 and 100 when UsePercentage is true"
        })
      }
      if (!PercentageBasedOn || !['SignupBonus', 'TotalEarnings', 'WalletBalance'].includes(PercentageBasedOn)) {
        return res.status(400).json({
          message: "PercentageBasedOn must be one of: SignupBonus, TotalEarnings, WalletBalance"
        })
      }
    }

    // Update or create settings
    let settings = await referralSettingsModel.findOne()
    if (settings) {
      settings.RewardForNewUser = RewardForNewUser
      settings.RewardForReferrer = RewardForReferrer
      settings.RewardType = rewardType
      if (UsePercentage !== undefined) settings.UsePercentage = UsePercentage
      if (ReferrerPercentage !== undefined) settings.ReferrerPercentage = ReferrerPercentage
      if (PercentageBasedOn !== undefined) settings.PercentageBasedOn = PercentageBasedOn
      await settings.save()
    } else {
      settings = await referralSettingsModel.create({
        RewardForNewUser: RewardForNewUser,
        RewardForReferrer: RewardForReferrer,
        RewardType: rewardType,
        UsePercentage: UsePercentage || false,
        ReferrerPercentage: ReferrerPercentage || 0,
        PercentageBasedOn: PercentageBasedOn || 'SignupBonus'
      })
    }

    return res.json({
      message: "Referral settings updated successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== SPONSOR PROMOTION SUBMISSION APIs ====================

// Get All Sponsor Promotion Submissions API
router.get('/sponsor/promotions', verifyAdminToken, async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 50, search } = req.query
    
    // Build query
    let query = {}
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      query.Status = status
    }
    if (userId) {
      query.UserId = userId
    }
    if (search) {
      query.$or = [
        { SponsorName: { $regex: search, $options: 'i' } },
        { MobileNumber: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } },
        { AppPromotion: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const totalSubmissions = await sponsorPromotionSubmissionModel.countDocuments(query)

    // Get submissions with pagination
    const submissions = await sponsorPromotionSubmissionModel.find(query)
      .populate('UserId', 'UserName MobileNumber ReferCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Format response
    const formattedSubmissions = submissions.map(sub => ({
      submissionId: sub._id,
      userId: sub.UserId._id,
      userName: sub.UserId.UserName,
      userMobileNumber: sub.UserId.MobileNumber,
      userReferCode: sub.UserId.ReferCode,
      sponsorName: sub.SponsorName,
      mobileNumber: sub.MobileNumber,
      email: sub.Email,
      appPromotion: sub.AppPromotion,
      status: sub.Status,
      adminNotes: sub.AdminNotes,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }))

    // Calculate statistics
    const allSubmissions = await sponsorPromotionSubmissionModel.find({})
    const statistics = {
      total: allSubmissions.length,
      pending: allSubmissions.filter(s => s.Status === 'Pending').length,
      approved: allSubmissions.filter(s => s.Status === 'Approved').length,
      rejected: allSubmissions.filter(s => s.Status === 'Rejected').length
    }

    return res.json({
      message: "Sponsor promotion submissions retrieved successfully",
      data: {
        submissions: formattedSubmissions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalSubmissions / limitNum),
          totalSubmissions: totalSubmissions,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalSubmissions / limitNum),
          hasPrevPage: pageNum > 1
        },
        statistics: statistics
      }
    })

  } catch (err) {
    console.error('Get Sponsor Promotion Submissions - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Approve/Reject Sponsor Promotion Submission API
router.post('/sponsor/promotions/:submissionId/status', verifyAdminToken, async (req, res) => {
  try {
    const { submissionId } = req.params
    const { status, adminNotes } = req.body

    // Validate status
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status is required and must be either 'Approved' or 'Rejected'"
      })
    }

    // Find submission
    const submission = await sponsorPromotionSubmissionModel.findById(submissionId)
      .populate('UserId', 'UserName MobileNumber ReferCode')

    if (!submission) {
      return res.status(404).json({
        message: "Sponsor promotion submission not found"
      })
    }

    // Check if already processed
    if (submission.Status !== 'Pending') {
      return res.status(400).json({
        message: `This submission has already been ${submission.Status.toLowerCase()}`
      })
    }

    // Update submission status
    submission.Status = status
    if (adminNotes) {
      submission.AdminNotes = adminNotes
    }
    await submission.save()

    return res.json({
      message: `Sponsor promotion submission ${status.toLowerCase()} successfully`,
      data: {
        submissionId: submission._id,
        sponsorName: submission.SponsorName,
        mobileNumber: submission.MobileNumber,
        email: submission.Email,
        appPromotion: submission.AppPromotion,
        status: submission.Status,
        adminNotes: submission.AdminNotes,
        userName: submission.UserId.UserName,
        userMobileNumber: submission.UserId.MobileNumber,
        updatedAt: submission.updatedAt
      }
    })

  } catch (err) {
    console.error('Update Sponsor Promotion Submission Status - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== CRON JOBS MANAGEMENT APIs ====================

// Manual Daily Reset API (Admin can trigger daily reset manually)
router.post('/cron/daily-reset', verifyAdminToken, async (req, res) => {
  try {
    const { startCronJobs, dailyResetJob } = require('../utilities/cronJobs');
    
    // Manually trigger the daily reset job
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const scratchCardDailyLimitClaimModel = require('../models/scratchCardDailyLimitClaim.model');
    const dailySpinUsageModel = require('../models/dailySpinUsage.model');
    const captchaSolveModel = require('../models/captchaSolve.model');

    // Get statistics
    const scratchCardClaimsToday = await scratchCardDailyLimitClaimModel.countDocuments({
      ClaimDate: { $gte: today }
    });
    const scratchCardClaimsYesterday = await scratchCardDailyLimitClaimModel.countDocuments({
      ClaimDate: { $gte: yesterday, $lt: today }
    });

    const spinUsageToday = await dailySpinUsageModel.countDocuments({
      SpinDate: { $gte: today }
    });
    const spinUsageYesterday = await dailySpinUsageModel.countDocuments({
      SpinDate: { $gte: yesterday, $lt: today }
    });

    const captchaSolvesToday = await captchaSolveModel.countDocuments({
      SolveDate: { $gte: today }
    });
    const captchaSolvesYesterday = await captchaSolveModel.countDocuments({
      SolveDate: { $gte: yesterday, $lt: today }
    });

    return res.json({
      message: "Daily reset status retrieved successfully",
      data: {
        resetTime: new Date().toISOString(),
        today: today.toISOString(),
        yesterday: yesterday.toISOString(),
        statistics: {
          scratchCard: {
            today: scratchCardClaimsToday,
            yesterday: scratchCardClaimsYesterday
          },
          dailySpin: {
            today: spinUsageToday,
            yesterday: spinUsageYesterday
          },
          captcha: {
            today: captchaSolvesToday,
            yesterday: captchaSolvesYesterday
          }
        },
        note: "Daily limits automatically reset at midnight. This shows current status."
      }
    });

  } catch (err) {
    console.error('Manual Daily Reset - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Cron Jobs Status API
router.get('/cron/status', verifyAdminToken, async (req, res) => {
  try {
    const { dailyResetJob, cleanupOldRecordsJob } = require('../utilities/cronJobs');
    
    return res.json({
      message: "Cron jobs status retrieved successfully",
      data: {
        dailyResetJob: {
          scheduled: dailyResetJob.running || false,
          schedule: "0 0 * * * (Daily at 00:00)",
          description: "Verifies daily limit resets for scratch cards, spins, and captcha"
        },
        cleanupOldRecordsJob: {
          scheduled: cleanupOldRecordsJob.running || false,
          schedule: "0 1 * * * (Daily at 01:00)",
          description: "Cleans up old records older than 90 days"
        },
        note: "Cron jobs automatically start when the server starts and database is connected"
      }
    });

  } catch (err) {
    console.error('Get Cron Jobs Status - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== SUPPORT LINK SETTINGS APIs ====================

// Set Support Link API
router.post('/support/link', verifyAdminToken, async (req, res) => {
  try {
    const { SupportLink, SupportEmail, SupportPhone, SupportWhatsApp, IsActive, Description } = req.body
    
    if (!SupportLink) {
      return res.status(400).json({
        message: "SupportLink is required"
      })
    }

    if (typeof SupportLink !== 'string' || SupportLink.trim().length === 0) {
      return res.status(400).json({
        message: "SupportLink must be a valid non-empty string"
      })
    }

    // Validate URL format (basic validation)
    try {
      new URL(SupportLink.trim())
    } catch (urlError) {
      return res.status(400).json({
        message: "SupportLink must be a valid URL"
      })
    }

    // Validate email if provided
    if (SupportEmail && SupportEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(SupportEmail.trim())) {
        return res.status(400).json({
          message: "SupportEmail must be a valid email address"
        })
      }
    }

    // Update or create settings
    let settings = await supportLinkSettingsModel.findOne()
    if (settings) {
      settings.SupportLink = SupportLink.trim()
      if (SupportEmail !== undefined) settings.SupportEmail = SupportEmail ? SupportEmail.trim().toLowerCase() : null
      if (SupportPhone !== undefined) settings.SupportPhone = SupportPhone ? SupportPhone.trim() : null
      if (SupportWhatsApp !== undefined) settings.SupportWhatsApp = SupportWhatsApp ? SupportWhatsApp.trim() : null
      if (IsActive !== undefined) settings.IsActive = IsActive
      if (Description !== undefined) settings.Description = Description ? Description.trim() : null
      await settings.save()
    } else {
      settings = await supportLinkSettingsModel.create({
        SupportLink: SupportLink.trim(),
        SupportEmail: SupportEmail ? SupportEmail.trim().toLowerCase() : null,
        SupportPhone: SupportPhone ? SupportPhone.trim() : null,
        SupportWhatsApp: SupportWhatsApp ? SupportWhatsApp.trim() : null,
        IsActive: IsActive !== undefined ? IsActive : true,
        Description: Description ? Description.trim() : null
      })
    }

    return res.json({
      message: "Support link settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Set Support Link - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Support Link Settings API
router.get('/support/link', verifyAdminToken, async (req, res) => {
  try {
    let settings = await supportLinkSettingsModel.getSettings()

    return res.json({
      message: "Support link settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    console.error('Get Support Link - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Update Support Link API
router.put('/support/link', verifyAdminToken, async (req, res) => {
  try {
    const { SupportLink, SupportEmail, SupportPhone, SupportWhatsApp, IsActive, Description } = req.body

    let settings = await supportLinkSettingsModel.findOne()
    if (!settings) {
      // If no settings exist, create new one
      if (!SupportLink) {
        return res.status(400).json({
          message: "SupportLink is required when creating new settings"
        })
      }
      settings = await supportLinkSettingsModel.create({
        SupportLink: SupportLink.trim(),
        SupportEmail: SupportEmail ? SupportEmail.trim().toLowerCase() : null,
        SupportPhone: SupportPhone ? SupportPhone.trim() : null,
        SupportWhatsApp: SupportWhatsApp ? SupportWhatsApp.trim() : null,
        IsActive: IsActive !== undefined ? IsActive : true,
        Description: Description ? Description.trim() : null
      })
    } else {
      // Update existing settings
      if (SupportLink !== undefined) {
        if (typeof SupportLink !== 'string' || SupportLink.trim().length === 0) {
          return res.status(400).json({
            message: "SupportLink must be a valid non-empty string"
          })
        }
        // Validate URL format
        try {
          new URL(SupportLink.trim())
        } catch (urlError) {
          return res.status(400).json({
            message: "SupportLink must be a valid URL"
          })
        }
        settings.SupportLink = SupportLink.trim()
      }

      if (SupportEmail !== undefined) {
        if (SupportEmail && SupportEmail.trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(SupportEmail.trim())) {
            return res.status(400).json({
              message: "SupportEmail must be a valid email address"
            })
          }
          settings.SupportEmail = SupportEmail.trim().toLowerCase()
        } else {
          settings.SupportEmail = null
        }
      }

      if (SupportPhone !== undefined) {
        settings.SupportPhone = SupportPhone ? SupportPhone.trim() : null
      }

      if (SupportWhatsApp !== undefined) {
        settings.SupportWhatsApp = SupportWhatsApp ? SupportWhatsApp.trim() : null
      }

      if (IsActive !== undefined) {
        settings.IsActive = IsActive
      }

      if (Description !== undefined) {
        settings.Description = Description ? Description.trim() : null
      }

      await settings.save()
    }

    return res.json({
      message: "Support link settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Update Support Link - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== SOCIAL LINKS APIs (Telegram / YouTube / Instagram) ====================

function resolveOptionalHttpUrl (value, fieldLabel) {
  if (value === undefined) return { ok: true, mode: 'omit' }
  if (value === null || (typeof value === 'string' && value.trim() === '')) {
    return { ok: true, mode: 'clear' }
  }
  if (typeof value !== 'string') {
    return { ok: false, message: `${fieldLabel} must be a string, null, or empty string to clear` }
  }
  try {
    const u = new URL(value.trim())
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { ok: false, message: `${fieldLabel} must use http or https` }
    }
    return { ok: true, mode: 'set', value: value.trim() }
  } catch (e) {
    return { ok: false, message: `${fieldLabel} must be a valid URL` }
  }
}

router.get('/social-links', verifyAdminToken, async (req, res) => {
  try {
    const settings = await socialLinksSettingsModel.getSettings()
    return res.json({
      message: "Social links settings retrieved successfully",
      data: settings
    })
  } catch (err) {
    console.error('Get Social Links - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.put('/social-links', verifyAdminToken, async (req, res) => {
  try {
    const { IsActive } = req.body
    const settings = await socialLinksSettingsModel.getSettings()

    for (const [key, label] of [
      ['TelegramLink', 'TelegramLink'],
      ['YouTubeLink', 'YouTubeLink'],
      ['InstagramLink', 'InstagramLink']
    ]) {
      const r = resolveOptionalHttpUrl(req.body[key], label)
      if (!r.ok) {
        return res.status(400).json({ message: r.message })
      }
      if (r.mode === 'set') settings[key] = r.value
      if (r.mode === 'clear') settings[key] = null
    }

    if (IsActive !== undefined) {
      settings.IsActive = Boolean(IsActive)
    }

    await settings.save()
    return res.json({
      message: "Social links settings updated successfully",
      data: settings
    })
  } catch (err) {
    console.error('Update Social Links - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get complete user earning activity (admin view)
router.get('/users/:userId/activity', verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 50, type } = req.query

    const user = await userModel.findById(userId).select('UserName MobileNumber ReferCode Coins WalletBalance')
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 50
    const typeFilter = type ? String(type).toUpperCase() : null

    const [appSubs, captchaSolves, scratchClaims, scratchDailyClaims, conversions, withdrawals, dailyBonusClaims, sponsorSubmissions] = await Promise.all([
      appInstallationSubmissionModel.find({ UserId: userId }).populate('AppId', 'AppName RewardCoins').sort({ updatedAt: -1 }).limit(200),
      captchaSolveModel.find({ UserId: userId }).sort({ createdAt: -1 }).limit(200),
      scratchCardClaimModel.find({ UserId: userId }).sort({ createdAt: -1 }).limit(200),
      scratchCardDailyLimitClaimModel.find({ UserId: userId }).sort({ createdAt: -1 }).limit(200),
      coinConversionHistoryModel.find({ UserId: userId }).sort({ createdAt: -1 }).limit(200),
      withdrawalRequestModel.find({ UserId: userId }).sort({ createdAt: -1 }).limit(200),
      dailyBonusClaimModel.find({ UserId: userId }).sort({ createdAt: -1 }).limit(200),
      sponsorPromotionSubmissionModel.find({ UserId: userId }).sort({ createdAt: -1 }).limit(200)
    ])

    let events = [
      ...appSubs.map(s => ({
        type: 'APP_INSTALL',
        title: `App Install - ${s.AppId?.AppName || 'App'}`,
        status: s.Status,
        coinsChange: s.Status === 'Approved' ? (s.AppId?.RewardCoins || 0) : 0,
        walletChange: 0,
        createdAt: s.updatedAt || s.createdAt
      })),
      ...captchaSolves.map(c => ({
        type: 'CAPTCHA',
        title: 'Captcha',
        status: 'Completed',
        coinsChange: c.RewardType === 'Coins' ? c.RewardAmount : 0,
        walletChange: c.RewardType === 'WalletBalance' ? c.RewardAmount : 0,
        createdAt: c.createdAt
      })),
      ...scratchClaims.map(c => ({
        type: 'SCRATCH_CARD',
        title: `Scratch Card - ${c.Day}`,
        status: 'Completed',
        coinsChange: c.RewardType === 'Coins' ? c.RewardAmount : 0,
        walletChange: c.RewardType === 'WalletBalance' ? c.RewardAmount : 0,
        createdAt: c.createdAt
      })),
      ...scratchDailyClaims.map(c => ({
        type: 'SCRATCH_CARD_DAILY_LIMIT',
        title: 'Scratch Card Daily Limit',
        status: 'Completed',
        coinsChange: c.RewardCoins || 0,
        walletChange: c.RewardAmount || 0,
        createdAt: c.createdAt
      })),
      ...conversions.map(c => ({
        type: 'COIN_CONVERSION',
        title: 'Coin Conversion',
        status: 'Completed',
        coinsChange: -(c.CoinsConverted || 0),
        walletChange: c.RupeesAdded || 0,
        createdAt: c.createdAt
      })),
      ...withdrawals.map(w => ({
        type: 'WITHDRAWAL',
        title: `Withdrawal - ${w.PaymentMethod}`,
        status: w.Status,
        coinsChange: 0,
        walletChange: w.Status === 'Rejected' ? 0 : -(w.Amount || 0),
        createdAt: w.createdAt
      })),
      ...dailyBonusClaims.map(d => ({
        type: 'DAILY_BONUS',
        title: 'Daily Bonus',
        status: 'Completed',
        coinsChange: d.RewardType === 'Coins' ? (d.Amount || 0) : 0,
        walletChange: d.RewardType === 'WalletBalance' ? (d.Amount || 0) : 0,
        createdAt: d.createdAt
      })),
      ...sponsorSubmissions.map(s => ({
        type: 'SPONSOR_PROMOTION',
        title: 'Sponsor Promotion',
        status: s.Status,
        coinsChange: 0,
        walletChange: 0,
        createdAt: s.createdAt
      }))
    ]

    if (typeFilter) {
      events = events.filter(item => item.type === typeFilter)
    }

    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const totalEvents = events.length
    const pagedEvents = events.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    return res.json({
      message: "User activity retrieved successfully",
      data: {
        user: user,
        events: pagedEvents,
        summary: {
          totalEvents: totalEvents,
          totalCoinsDelta: events.reduce((sum, e) => sum + (e.coinsChange || 0), 0),
          totalWalletDelta: events.reduce((sum, e) => sum + (e.walletChange || 0), 0)
        },
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalEvents / limitNum) || 1,
          totalEvents: totalEvents,
          limit: limitNum
        }
      }
    })
  } catch (err) {
    console.error('Get User Activity - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== POPUP TEMPLATE (ADMIN) ====================

router.get('/popup-template', verifyAdminToken, async (req, res) => {
  try {
    const settings = await popupTemplateSettingsModel.getSettings()
    if (!settings) {
      return res.json({
        message: "Popup template retrieved successfully",
        data: {
          Title: '',
          Description: '',
          IsActive: false,
          note: "No popup template saved yet"
        }
      })
    }
    return res.json({
      message: "Popup template retrieved successfully",
      data: {
        _id: settings._id,
        Title: settings.Title,
        Description: popupDescriptionFromDoc(settings),
        IsActive: settings.IsActive,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      }
    })
  } catch (err) {
    console.error('Admin Get Popup Template - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.post('/popup-template', verifyAdminToken, parseMultipartTextFieldsOnly, async (req, res) => {
  try {
    let settings = await popupTemplateSettingsModel.findOne()
    const descInput = req.body.Description !== undefined
      ? req.body.Description
      : (req.body.Body !== undefined ? req.body.Body : undefined)

    if (!settings) {
      settings = await popupTemplateSettingsModel.create({
        Title: req.body.Title != null ? String(req.body.Title) : '',
        Description: descInput !== undefined ? String(descInput) : '',
        Body: '',
        IsActive: req.body.IsActive === true || req.body.IsActive === 'true'
      })
    } else {
      if (req.body.Title !== undefined) settings.Title = String(req.body.Title)
      if (descInput !== undefined) {
        settings.Description = String(descInput)
        settings.Body = ''
      }
      if (req.body.IsActive !== undefined) {
        settings.IsActive = req.body.IsActive === true || req.body.IsActive === 'true'
      }
      await settings.save()
    }

    return res.json({
      message: "Popup template saved successfully",
      data: {
        Title: settings.Title,
        Description: popupDescriptionFromDoc(settings),
        IsActive: settings.IsActive
      }
    })
  } catch (err) {
    console.error('Admin Save Popup Template - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

router.put('/popup-template', verifyAdminToken, parseMultipartTextFieldsOnly, async (req, res) => {
  try {
    let settings = await popupTemplateSettingsModel.getSettings()
    const descInput = req.body.Description !== undefined
      ? req.body.Description
      : (req.body.Body !== undefined ? req.body.Body : undefined)

    if (!settings) {
      settings = await popupTemplateSettingsModel.create({
        Title: req.body.Title != null ? String(req.body.Title) : '',
        Description: descInput !== undefined ? String(descInput) : '',
        Body: '',
        IsActive: req.body.IsActive === true || req.body.IsActive === 'true'
      })
      return res.json({
        message: "Popup template created successfully",
        data: {
          Title: settings.Title,
          Description: popupDescriptionFromDoc(settings),
          IsActive: settings.IsActive
        }
      })
    }

    if (req.body.Title !== undefined) settings.Title = String(req.body.Title)
    if (descInput !== undefined) {
      settings.Description = String(descInput)
      settings.Body = ''
    }
    if (req.body.IsActive !== undefined) {
      settings.IsActive = req.body.IsActive === true || req.body.IsActive === 'true'
    }

    await settings.save()

    return res.json({
      message: "Popup template updated successfully",
      data: {
        Title: settings.Title,
        Description: popupDescriptionFromDoc(settings),
        IsActive: settings.IsActive
      }
    })
  } catch (err) {
    console.error('Admin Update Popup Template - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

module.exports = router;
