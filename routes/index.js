var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

let userModel = require('../models/user.model')
let offerwallCallbackModel = require('../models/offerwallCallback.model')

// Referral Link Redirect API - Public endpoint (no auth required)
router.get('/refer/:referCode', async (req, res) => {
  try {
    const { referCode } = req.params
    
    if (!referCode || referCode.trim().length === 0) {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Referral Link</title></head>
          <body>
            <h1>Invalid Referral Link</h1>
            <p>The referral code is missing or invalid.</p>
          </body>
        </html>
      `)
    }

    // Validate refer code exists in database
    const user = await userModel.findOne({ ReferCode: referCode.trim().toUpperCase() })
    
    if (!user) {
      return res.status(404).send(`
        <html>
          <head><title>Referral Code Not Found</title></head>
          <body>
            <h1>Referral Code Not Found</h1>
            <p>The referral code "${referCode}" does not exist.</p>
            <p><a href="https://play.google.com/store/apps/details?id=com.profitkaro">Download ProfitKaro App</a></p>
          </body>
        </html>
      `)
    }

    // Android Intent URL format for deep linking
    // This will try to open the app first, then fallback to Play Store
    const appPackage = 'com.profitkaro'
    const referCodeUpper = referCode.trim().toUpperCase()
    
    // Play Store URL with referrer parameter (properly formatted for install referrer)
    // Format: referrer=code=ABC123 (this is what Flutter app expects)
    // The Flutter app can parse both: direct code "ABC123" or "code=ABC123"
    const referrerParam = `code=${referCodeUpper}`
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${appPackage}&referrer=${encodeURIComponent(referrerParam)}`
    
    // Alternative format with utm_source (also supported by Flutter)
    // const referrerParam = `utm_source=referral&code=${referCodeUpper}`
    // const playStoreUrl = `https://play.google.com/store/apps/details?id=${appPackage}&referrer=${encodeURIComponent(referrerParam)}`
    
    // Intent URL with multiple parameter formats for better compatibility
    // Format: intent://[host]/[path]?[parameters]#Intent;scheme=[scheme];package=[package];S.[key]=[value];end
    const intentUrl = `intent://refer?code=${referCodeUpper}&refer=${referCodeUpper}#Intent;scheme=profitkaro;package=${appPackage};S.referCode=${referCodeUpper};S.code=${referCodeUpper};S.refer=${referCodeUpper};end`
    
    // Custom scheme fallback (multiple formats for better compatibility)
    const customScheme1 = `profitkaro://refer?code=${referCodeUpper}&refer=${referCodeUpper}`
    const customScheme2 = `profitkaro://refer?referCode=${referCodeUpper}`

    // Return HTML page with JavaScript to handle redirect
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redirecting to ProfitKaro...</title>
          <meta name="description" content="Opening ProfitKaro app with referral code ${referCodeUpper}">
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 20px;
              max-width: 400px;
            }
            .spinner {
              border: 4px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 4px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            a {
              color: white;
              text-decoration: underline;
              margin-top: 20px;
              display: inline-block;
              padding: 10px 20px;
              background: rgba(255,255,255,0.2);
              border-radius: 5px;
            }
            a:hover {
              background: rgba(255,255,255,0.3);
            }
            .code-display {
              font-size: 24px;
              font-weight: bold;
              margin: 15px 0;
              padding: 10px;
              background: rgba(255,255,255,0.1);
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Redirecting to ProfitKaro...</h1>
            <div class="spinner"></div>
            <p>Opening app with referral code:</p>
            <div class="code-display">${referCodeUpper}</div>
            <p id="status">Attempting to open app...</p>
            <p id="fallback" style="display:none;">
              <a href="${playStoreUrl}" id="playStoreLink">Click here if app doesn't open automatically</a>
            </p>
          </div>
          <script>
            let appOpened = false;
            let fallbackShown = false;
            
            // Function to show fallback link
            function showFallback() {
              if (!fallbackShown) {
                fallbackShown = true;
                document.getElementById('fallback').style.display = 'block';
                document.getElementById('status').textContent = 'App not found. Redirecting to Play Store...';
              }
            }
            
            // Function to try opening the app
            function tryOpenApp() {
              // Method 1: Try Intent URL (Android - most reliable)
              try {
                window.location.href = '${intentUrl}';
                appOpened = true;
              } catch(e) {
                console.log('Intent URL failed:', e);
              }
              
              // Method 2: Try custom scheme after short delay
              setTimeout(function() {
                if (!appOpened) {
                  try {
                    window.location.href = '${customScheme1}';
                    appOpened = true;
                  } catch(e) {
                    console.log('Custom scheme 1 failed:', e);
                  }
                }
              }, 300);
              
              // Method 3: Try alternative custom scheme
              setTimeout(function() {
                if (!appOpened) {
                  try {
                    window.location.href = '${customScheme2}';
                    appOpened = true;
                  } catch(e) {
                    console.log('Custom scheme 2 failed:', e);
                  }
                }
              }, 600);
              
              // Method 4: Fallback to Play Store after 1.5 seconds
              setTimeout(function() {
                if (!appOpened) {
                  showFallback();
                  // Redirect to Play Store after showing fallback
                  setTimeout(function() {
                    window.location.href = '${playStoreUrl}';
                  }, 500);
                }
              }, 1500);
            }
            
            // Detect device type
            const isAndroid = /Android/i.test(navigator.userAgent);
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            
            // Handle page visibility change (app opened = page hidden)
            document.addEventListener('visibilitychange', function() {
              if (document.hidden) {
                appOpened = true;
              }
            });
            
            // Handle blur event (user switched to app)
            window.addEventListener('blur', function() {
              appOpened = true;
            });
            
            if (isAndroid) {
              // Android: Try to open app
              tryOpenApp();
            } else if (isIOS) {
              // iOS: Try custom scheme, then App Store
              try {
                window.location.href = '${customScheme1}';
                setTimeout(function() {
                  if (!appOpened) {
                    showFallback();
                    window.location.href = 'https://apps.apple.com/app/profitkaro';
                  }
                }, 1500);
              } catch(e) {
                showFallback();
                window.location.href = 'https://apps.apple.com/app/profitkaro';
              }
            } else {
              // Desktop: Redirect to Play Store
              document.getElementById('status').textContent = 'Redirecting to Play Store...';
              setTimeout(function() {
                window.location.href = '${playStoreUrl}';
              }, 1000);
            }
          </script>
        </body>
      </html>
    `)

  } catch (err) {
    console.error('Referral Redirect Error:', err)
    return res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>An error occurred while processing your referral link.</p>
          <p><a href="https://play.google.com/store/apps/details?id=com.profitkaro">Download ProfitKaro App</a></p>
        </body>
      </html>
    `)
  }
})

// Alternative: Query parameter version (e.g., /refer?code=VYD62W)
router.get('/refer', async (req, res) => {
  try {
    const referCode = req.query.code || req.query.refer
    
    if (!referCode || referCode.trim().length === 0) {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Referral Link</title></head>
          <body>
            <h1>Invalid Referral Link</h1>
            <p>Please provide a referral code. Example: /refer?code=VYD62W</p>
          </body>
        </html>
      `)
    }

    // Redirect to the path-based version
    return res.redirect(`/refer/${referCode.trim().toUpperCase()}`)

  } catch (err) {
    console.error('Referral Redirect Error:', err)
    return res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>An error occurred while processing your referral link.</p>
        </body>
      </html>
    `)
  }
})

/* GET home page. */
// router.get('/', function(req, res, next) {
 
// });
router.post('/signUp',async (req, res)=>{
  try{
  let {Email,Password} =  req.body
  let checkUser = await userModel.find({Email:Email})
  if(checkUser.length >0){
    return res.json({
      message:"User Alredy Exist"
    })
  }
  else{
    let User_data = await userModel.create({Email:Email,Password:Password})
    return res.json({
      message:"User Cerated Successfull",
      data:User_data
    })
  }

  }catch(err){
return res.status(500)
  }
})

// Public Offerwall Callback API - No authentication required
// This endpoint receives callbacks from offerwall providers when users complete offers
router.post('/callback/offerwall', async (req, res) => {
  try {
    // Accept data from both query parameters and request body
    const callbackData = {
      ...req.query,
      ...req.body
    }

    // Log the callback for debugging
    console.log('Offerwall Callback Received:', {
      timestamp: new Date().toISOString(),
      data: callbackData,
      headers: req.headers
    })

    // Extract common callback parameters (different providers use different field names)
    const provider = callbackData.provider || callbackData.Provider || callbackData.network || callbackData.Network || 'Unknown'
    const transactionId = callbackData.transaction_id || callbackData.transactionId || callbackData.TransactionId || callbackData.tid || callbackData.id || null
    const offerId = callbackData.offer_id || callbackData.offerId || callbackData.OfferId || callbackData.oid || null
    const offerName = callbackData.offer_name || callbackData.offerName || callbackData.OfferName || callbackData.name || null
    
    // User identification (can be mobile number, user ID, or custom parameter)
    const userIdentifier = callbackData.user_id || callbackData.userId || callbackData.UserId || 
                          callbackData.mobile || callbackData.MobileNumber || callbackData.mobile_number ||
                          callbackData.subid || callbackData.sub_id || callbackData.custom || null
    
    // Reward information
    const rewardAmount = parseFloat(callbackData.reward || callbackData.rewardAmount || callbackData.amount || 
                                   callbackData.payout || callbackData.payout_amount || callbackData.payoutAmount || 0)
    const rewardType = callbackData.rewardType || callbackData.reward_type || 'Coins' // Default to Coins
    
    // Status from provider
    const status = callbackData.status || callbackData.Status || callbackData.state || 'Pending'
    const isApproved = status === 'approved' || status === 'Approved' || status === '1' || 
                       callbackData.approved === '1' || callbackData.approved === true ||
                       callbackData.success === '1' || callbackData.success === true

    // Check for duplicate transaction
    let existingCallback = null
    if (transactionId && provider) {
      existingCallback = await offerwallCallbackModel.findOne({
        TransactionId: transactionId,
        Provider: provider
      })
    }

    if (existingCallback) {
      console.log('Duplicate callback detected:', { transactionId, provider })
      return res.status(200).send('OK') // Return OK even for duplicates to prevent retries
    }

    // Try to find user if identifier provided
    let user = null
    let userId = null
    
    if (userIdentifier) {
      // Try to find by mobile number
      user = await userModel.findOne({ MobileNumber: userIdentifier.trim() })
      
      // If not found by mobile, try by _id if it's a valid ObjectId
      if (!user && mongoose.Types.ObjectId.isValid(userIdentifier)) {
        user = await userModel.findById(userIdentifier)
      }
      
      if (user) {
        userId = user._id
      }
    }

    // Create callback record
    const callbackRecord = await offerwallCallbackModel.create({
      Provider: provider,
      UserIdentifier: userIdentifier,
      TransactionId: transactionId,
      OfferId: offerId,
      OfferName: offerName,
      RewardAmount: rewardAmount,
      RewardType: rewardType === 'WalletBalance' ? 'WalletBalance' : 'Coins',
      Status: isApproved ? 'Processed' : 'Pending',
      RawData: callbackData,
      UserId: userId,
      ProcessedAt: isApproved ? new Date() : null
    })

    // If user found and callback is approved, process reward
    if (user && isApproved && rewardAmount > 0) {
      try {
        if (rewardType === 'WalletBalance' || callbackData.rewardType === 'WalletBalance') {
          user.WalletBalance = (user.WalletBalance || 0) + rewardAmount
        } else {
          user.Coins = (user.Coins || 0) + rewardAmount
        }
        await user.save()
        
        // Update callback record
        callbackRecord.Status = 'Processed'
        callbackRecord.ProcessedAt = new Date()
        await callbackRecord.save()
        
        console.log('Reward processed successfully:', {
          userId: user._id,
          mobileNumber: user.MobileNumber,
          rewardAmount,
          rewardType: rewardType === 'WalletBalance' ? 'WalletBalance' : 'Coins'
        })
      } catch (rewardError) {
        console.error('Error processing reward:', rewardError)
        callbackRecord.Status = 'Failed'
        callbackRecord.ErrorMessage = rewardError.message
        await callbackRecord.save()
      }
    } else if (!user && userIdentifier) {
      // User not found but identifier provided
      callbackRecord.Status = 'Pending'
      callbackRecord.ErrorMessage = 'User not found with provided identifier'
      await callbackRecord.save()
      console.log('User not found for callback:', { userIdentifier, transactionId })
    }

    // Return success response (most offerwall providers expect "OK" or "1")
    // Some providers also accept JSON responses
    const responseFormat = callbackData.response_format || callbackData.format || 'text'
    
    if (responseFormat === 'json') {
      return res.status(200).json({
        status: 'success',
        message: 'Callback received',
        transactionId: transactionId
      })
    } else {
      // Default: return "OK" or "1" as text
      return res.status(200).send('OK')
    }

  } catch (err) {
    console.error('Offerwall Callback Error:', err)
    console.error('Callback Error Stack:', err.stack)
    
    // Still return OK to prevent offerwall providers from retrying
    // Log the error for manual review
    try {
      await offerwallCallbackModel.create({
        Provider: req.query.provider || req.body.provider || 'Unknown',
        Status: 'Failed',
        RawData: { query: req.query, body: req.body },
        ErrorMessage: err.message
      })
    } catch (logError) {
      console.error('Error logging failed callback:', logError)
    }
    
    return res.status(200).send('OK')
  }
})

// Alternative callback endpoint (GET method for some providers)
// Some offerwall providers send callbacks via GET with query parameters
router.get('/callback/offerwall', async (req, res) => {
  // Reuse the same logic as POST handler
  try {
    // Accept data from both query parameters and request body
    const callbackData = {
      ...req.query,
      ...req.body
    }

    // Log the callback for debugging
    console.log('Offerwall Callback Received (GET):', {
      timestamp: new Date().toISOString(),
      data: callbackData,
      headers: req.headers
    })

    // Extract common callback parameters (different providers use different field names)
    const provider = callbackData.provider || callbackData.Provider || callbackData.network || callbackData.Network || 'Unknown'
    const transactionId = callbackData.transaction_id || callbackData.transactionId || callbackData.TransactionId || callbackData.tid || callbackData.id || null
    const offerId = callbackData.offer_id || callbackData.offerId || callbackData.OfferId || callbackData.oid || null
    const offerName = callbackData.offer_name || callbackData.offerName || callbackData.OfferName || callbackData.name || null
    
    // User identification (can be mobile number, user ID, or custom parameter)
    const userIdentifier = callbackData.user_id || callbackData.userId || callbackData.UserId || 
                          callbackData.mobile || callbackData.MobileNumber || callbackData.mobile_number ||
                          callbackData.subid || callbackData.sub_id || callbackData.custom || null
    
    // Reward information
    const rewardAmount = parseFloat(callbackData.reward || callbackData.rewardAmount || callbackData.amount || 
                                   callbackData.payout || callbackData.payout_amount || callbackData.payoutAmount || 0)
    const rewardType = callbackData.rewardType || callbackData.reward_type || 'Coins' // Default to Coins
    
    // Status from provider
    const status = callbackData.status || callbackData.Status || callbackData.state || 'Pending'
    const isApproved = status === 'approved' || status === 'Approved' || status === '1' || 
                       callbackData.approved === '1' || callbackData.approved === true ||
                       callbackData.success === '1' || callbackData.success === true

    // Check for duplicate transaction
    let existingCallback = null
    if (transactionId && provider) {
      existingCallback = await offerwallCallbackModel.findOne({
        TransactionId: transactionId,
        Provider: provider
      })
    }

    if (existingCallback) {
      console.log('Duplicate callback detected:', { transactionId, provider })
      return res.status(200).send('OK') // Return OK even for duplicates to prevent retries
    }

    // Try to find user if identifier provided
    let user = null
    let userId = null
    
    if (userIdentifier) {
      // Try to find by mobile number
      user = await userModel.findOne({ MobileNumber: userIdentifier.trim() })
      
      // If not found by mobile, try by _id if it's a valid ObjectId
      if (!user && mongoose.Types.ObjectId.isValid(userIdentifier)) {
        user = await userModel.findById(userIdentifier)
      }
      
      if (user) {
        userId = user._id
      }
    }

    // Create callback record
    const callbackRecord = await offerwallCallbackModel.create({
      Provider: provider,
      UserIdentifier: userIdentifier,
      TransactionId: transactionId,
      OfferId: offerId,
      OfferName: offerName,
      RewardAmount: rewardAmount,
      RewardType: rewardType === 'WalletBalance' ? 'WalletBalance' : 'Coins',
      Status: isApproved ? 'Processed' : 'Pending',
      RawData: callbackData,
      UserId: userId,
      ProcessedAt: isApproved ? new Date() : null
    })

    // If user found and callback is approved, process reward
    if (user && isApproved && rewardAmount > 0) {
      try {
        if (rewardType === 'WalletBalance' || callbackData.rewardType === 'WalletBalance') {
          user.WalletBalance = (user.WalletBalance || 0) + rewardAmount
        } else {
          user.Coins = (user.Coins || 0) + rewardAmount
        }
        await user.save()
        
        // Update callback record
        callbackRecord.Status = 'Processed'
        callbackRecord.ProcessedAt = new Date()
        await callbackRecord.save()
        
        console.log('Reward processed successfully:', {
          userId: user._id,
          mobileNumber: user.MobileNumber,
          rewardAmount,
          rewardType: rewardType === 'WalletBalance' ? 'WalletBalance' : 'Coins'
        })
      } catch (rewardError) {
        console.error('Error processing reward:', rewardError)
        callbackRecord.Status = 'Failed'
        callbackRecord.ErrorMessage = rewardError.message
        await callbackRecord.save()
      }
    } else if (!user && userIdentifier) {
      // User not found but identifier provided
      callbackRecord.Status = 'Pending'
      callbackRecord.ErrorMessage = 'User not found with provided identifier'
      await callbackRecord.save()
      console.log('User not found for callback:', { userIdentifier, transactionId })
    }

    // Return success response (most offerwall providers expect "OK" or "1")
    // Some providers also accept JSON responses
    const responseFormat = callbackData.response_format || callbackData.format || 'text'
    
    if (responseFormat === 'json') {
      return res.status(200).json({
        status: 'success',
        message: 'Callback received',
        transactionId: transactionId
      })
    } else {
      // Default: return "OK" or "1" as text
      return res.status(200).send('OK')
    }

  } catch (err) {
    console.error('Offerwall Callback Error (GET):', err)
    console.error('Callback Error Stack:', err.stack)
    
    // Still return OK to prevent offerwall providers from retrying
    // Log the error for manual review
    try {
      await offerwallCallbackModel.create({
        Provider: req.query.provider || req.body.provider || 'Unknown',
        Status: 'Failed',
        RawData: { query: req.query, body: req.body },
        ErrorMessage: err.message
      })
    } catch (logError) {
      console.error('Error logging failed callback:', logError)
    }
    
    return res.status(200).send('OK')
  }
})

module.exports = router;
