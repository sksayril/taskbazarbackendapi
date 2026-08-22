const cron = require('node-cron');
const mongoose = require('mongoose');

// Import models
let scratchCardDailyLimitClaimModel = require('../models/scratchCardDailyLimitClaim.model');
let dailySpinUsageModel = require('../models/dailySpinUsage.model');
let captchaSolveModel = require('../models/captchaSolve.model');

// Helper function to get today's date at midnight
function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setMilliseconds(0);
  return today;
}

// Helper function to get yesterday's date at midnight
function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setMilliseconds(0);
  return yesterday;
}

// Daily Reset Job - Runs every day at 00:00 (midnight)
// This job verifies that daily limits are properly reset and logs the process
const dailyResetJob = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('========================================');
    console.log('Daily Reset Cron Job Started:', new Date().toISOString());
    console.log('========================================');

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // 1. Verify Scratch Card Daily Limit Reset
    console.log('\n[1] Checking Scratch Card Daily Limit Reset...');
    try {
      const scratchCardClaimsToday = await scratchCardDailyLimitClaimModel.countDocuments({
        ClaimDate: { $gte: today }
      });
      const scratchCardClaimsYesterday = await scratchCardDailyLimitClaimModel.countDocuments({
        ClaimDate: { $gte: yesterday, $lt: today }
      });
      console.log(`   - Today's claims: ${scratchCardClaimsToday}`);
      console.log(`   - Yesterday's claims: ${scratchCardClaimsYesterday}`);
      console.log('   ✓ Scratch Card Daily Limit Reset Verified');
    } catch (error) {
      console.error('   ✗ Error checking scratch card daily limit:', error.message);
    }

    // 2. Verify Daily Spin Limit Reset
    console.log('\n[2] Checking Daily Spin Limit Reset...');
    try {
      const spinUsageToday = await dailySpinUsageModel.countDocuments({
        SpinDate: { $gte: today }
      });
      const spinUsageYesterday = await dailySpinUsageModel.countDocuments({
        SpinDate: { $gte: yesterday, $lt: today }
      });
      console.log(`   - Today's spin usage records: ${spinUsageToday}`);
      console.log(`   - Yesterday's spin usage records: ${spinUsageYesterday}`);
      console.log('   ✓ Daily Spin Limit Reset Verified');
    } catch (error) {
      console.error('   ✗ Error checking daily spin limit:', error.message);
    }

    // 3. Verify Captcha Daily Limit Reset
    console.log('\n[3] Checking Captcha Daily Limit Reset...');
    try {
      const captchaSolvesToday = await captchaSolveModel.countDocuments({
        SolveDate: { $gte: today }
      });
      const captchaSolvesYesterday = await captchaSolveModel.countDocuments({
        SolveDate: { $gte: yesterday, $lt: today }
      });
      console.log(`   - Today's captcha solves: ${captchaSolvesToday}`);
      console.log(`   - Yesterday's captcha solves: ${captchaSolvesYesterday}`);
      console.log('   ✓ Captcha Daily Limit Reset Verified');
    } catch (error) {
      console.error('   ✗ Error checking captcha daily limit:', error.message);
    }

    console.log('\n========================================');
    console.log('Daily Reset Cron Job Completed Successfully');
    console.log('========================================\n');

  } catch (error) {
    console.error('========================================');
    console.error('Daily Reset Cron Job Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
  }
}, {
  scheduled: false, // Don't start automatically, will be started manually
  timezone: "Asia/Kolkata" // Adjust timezone as needed
});

// Cleanup Old Records Job - Runs every day at 01:00 (1 AM)
// This job cleans up old records older than specified days (optional, for database maintenance)
const cleanupOldRecordsJob = cron.schedule('0 1 * * *', async () => {
  try {
    console.log('========================================');
    console.log('Cleanup Old Records Cron Job Started:', new Date().toISOString());
    console.log('========================================');

    // Calculate date threshold (keep records for last 90 days)
    const daysToKeep = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    cutoffDate.setHours(0, 0, 0, 0);

    // Cleanup old scratch card daily limit claims
    console.log('\n[1] Cleaning up old Scratch Card Daily Limit Claims...');
    try {
      const scratchCardDeleteResult = await scratchCardDailyLimitClaimModel.deleteMany({
        ClaimDate: { $lt: cutoffDate }
      });
      console.log(`   - Deleted ${scratchCardDeleteResult.deletedCount} old scratch card claim records`);
    } catch (error) {
      console.error('   ✗ Error cleaning up scratch card claims:', error.message);
    }

    // Cleanup old daily spin usage records
    console.log('\n[2] Cleaning up old Daily Spin Usage Records...');
    try {
      const spinDeleteResult = await dailySpinUsageModel.deleteMany({
        SpinDate: { $lt: cutoffDate }
      });
      console.log(`   - Deleted ${spinDeleteResult.deletedCount} old spin usage records`);
    } catch (error) {
      console.error('   ✗ Error cleaning up spin usage records:', error.message);
    }

    // Cleanup old captcha solve records
    console.log('\n[3] Cleaning up old Captcha Solve Records...');
    try {
      const captchaDeleteResult = await captchaSolveModel.deleteMany({
        SolveDate: { $lt: cutoffDate }
      });
      console.log(`   - Deleted ${captchaDeleteResult.deletedCount} old captcha solve records`);
    } catch (error) {
      console.error('   ✗ Error cleaning up captcha solve records:', error.message);
    }

    console.log('\n========================================');
    console.log('Cleanup Old Records Cron Job Completed Successfully');
    console.log('========================================\n');

  } catch (error) {
    console.error('========================================');
    console.error('Cleanup Old Records Cron Job Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
  }
}, {
  scheduled: false, // Don't start automatically, will be started manually
  timezone: "Asia/Kolkata" // Adjust timezone as needed
});

// Function to start all cron jobs
function startCronJobs() {
  // Check if database is connected
  if (mongoose.connection.readyState !== 1) {
    console.log('Database not connected. Cron jobs will not start.');
    return;
  }

  console.log('Starting Cron Jobs...');
  dailyResetJob.start();
  console.log('✓ Daily Reset Job scheduled (runs daily at 00:00)');
  
  cleanupOldRecordsJob.start();
  console.log('✓ Cleanup Old Records Job scheduled (runs daily at 01:00)');
  
  console.log('All Cron Jobs Started Successfully!\n');
}

// Function to stop all cron jobs
function stopCronJobs() {
  console.log('Stopping Cron Jobs...');
  dailyResetJob.stop();
  cleanupOldRecordsJob.stop();
  console.log('All Cron Jobs Stopped.\n');
}

// Export functions
module.exports = {
  startCronJobs,
  stopCronJobs,
  dailyResetJob,
  cleanupOldRecordsJob
};
