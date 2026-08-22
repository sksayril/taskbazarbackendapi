const CryptoJS = require('crypto-js');

// Encryption key - should be stored in environment variable for production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-change-in-production-min-32-chars';

/**
 * Encrypt a password using AES encryption
 * @param {string} password - Plain text password to encrypt
 * @returns {string} Encrypted password
 */
function encryptPassword(password) {
  try {
    const encrypted = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypt a password using AES decryption
 * @param {string} encryptedPassword - Encrypted password to decrypt
 * @returns {string} Decrypted (original) password
 */
function decryptPassword(encryptedPassword) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    const originalPassword = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!originalPassword) {
      throw new Error('Failed to decrypt password - invalid encrypted data');
    }
    
    return originalPassword;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
}

/**
 * Compare a plain text password with an encrypted password
 * @param {string} plainPassword - Plain text password to compare
 * @param {string} encryptedPassword - Encrypted password to compare against
 * @returns {boolean} True if passwords match, false otherwise
 */
function comparePassword(plainPassword, encryptedPassword) {
  try {
    const decryptedPassword = decryptPassword(encryptedPassword);
    return plainPassword === decryptedPassword;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

module.exports = {
  encryptPassword,
  decryptPassword,
  comparePassword
};
