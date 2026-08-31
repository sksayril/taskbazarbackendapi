const mongoose = require('mongoose');
const userModel = require('../models/user.model');

// Helper to generate a 7-character refer code
function generate7CharReferCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  code += letters.charAt(Math.floor(Math.random() * letters.length));
  code += digits.charAt(Math.floor(Math.random() * digits.length));
  
  return code;
}

/**
 * Migration function to update all existing users' ReferCode to be exactly 7 characters,
 * and update any ReferredBy references accordingly.
 */
async function fixAllUserReferCodes() {
  console.log('=== Starting ReferCode 7-Character Migration ===');
  
  const allUsers = await userModel.find({}).lean();
  console.log(`Found total ${allUsers.length} users in database.`);

  const assignedCodes = new Set();
  
  // First pass: collect all existing valid 7-character ReferCodes
  for (const user of allUsers) {
    if (user.ReferCode && typeof user.ReferCode === 'string' && user.ReferCode.trim().length === 7) {
      assignedCodes.add(user.ReferCode.trim().toUpperCase());
    }
  }

  let updatedCount = 0;
  // Map of oldCode -> newCode to update ReferredBy fields
  const codeMapping = {};

  // Helper to get a unique 7-char code for a user
  function getUnique7CharCode(oldCode) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Try extending 6-char old code by appending 1 character
    if (oldCode && typeof oldCode === 'string' && oldCode.trim().length === 6) {
      const base = oldCode.trim().toUpperCase();
      for (let i = 0; i < chars.length; i++) {
        const candidate = base + chars.charAt(i);
        if (!assignedCodes.has(candidate)) {
          return candidate;
        }
      }
    }
    
    // Fallback: generate fresh 7-char code
    let newCode = generate7CharReferCode();
    while (assignedCodes.has(newCode)) {
      newCode = generate7CharReferCode();
    }
    return newCode;
  }

  // Second pass: update users whose ReferCode is not 7 characters
  for (const user of allUsers) {
    const currentCode = user.ReferCode ? user.ReferCode.trim().toUpperCase() : null;
    
    if (!currentCode || currentCode.length !== 7) {
      const newCode = getUnique7CharCode(currentCode);
      assignedCodes.add(newCode);

      if (currentCode) {
        codeMapping[currentCode] = newCode;
      }

      // Bypass Mongoose pre-save/pre-update hooks by using collection directly
      await userModel.collection.updateOne(
        { _id: user._id },
        { $set: { ReferCode: newCode } }
      );

      console.log(`User ${user.UserName || user._id}: updated ReferCode from "${currentCode}" to "${newCode}"`);
      updatedCount++;
    }
  }

  // Third pass: update any ReferredBy references that were mapped to new codes
  let updatedReferredByCount = 0;
  for (const [oldCode, newCode] of Object.entries(codeMapping)) {
    const res = await userModel.collection.updateMany(
      { ReferredBy: oldCode },
      { $set: { ReferredBy: newCode } }
    );
    if (res.modifiedCount > 0) {
      console.log(`Updated ${res.modifiedCount} users having ReferredBy="${oldCode}" to "${newCode}"`);
      updatedReferredByCount += res.modifiedCount;
    }
  }

  console.log(`=== ReferCode Migration Complete ===`);
  console.log(`Total users checked: ${allUsers.length}`);
  console.log(`Users with updated ReferCode: ${updatedCount}`);
  console.log(`ReferredBy references updated: ${updatedReferredByCount}`);

  return {
    totalUsers: allUsers.length,
    updatedUsersCount: updatedCount,
    updatedReferredByCount: updatedReferredByCount
  };
}

module.exports = {
  generate7CharReferCode,
  fixAllUserReferCodes
};

// Allow running standalone via node utilities/fixReferCodes.js
if (require.main === module) {
  require('dotenv').config();
  require('./database');
  mongoose.connection.once('open', async () => {
    try {
      await fixAllUserReferCodes();
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  });
}
