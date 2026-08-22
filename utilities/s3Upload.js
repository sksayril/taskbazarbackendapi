const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAWN5REC3JHIVJWX4G',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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',
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'streaming-bucket-123';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Upload file to AWS S3
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {String} fileName - Name of the file
 * @param {String} folder - Folder path in S3 (optional)
 * @param {String} mimeType - MIME type of the file (optional, will be detected from filename if not provided)
 * @returns {Promise<String>} - Public URL of uploaded file
 */
const uploadToS3 = async (fileBuffer, fileName, folder = 'screenshots', mimeType = null) => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const key = `${folder}/${uniqueFileName}`;

    // Detect content type from filename or use provided mimeType
    let contentType = mimeType || 'image/jpeg';
    if (!mimeType) {
      const fileExtension = fileName.toLowerCase().split('.').pop();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp'
      };
      contentType = mimeTypes[fileExtension] || 'image/jpeg';
    }

    // Upload parameters
    // Note: ACL removed - bucket should be configured with public access via bucket policy
    // If bucket has ACLs disabled, use bucket policy instead for public access
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    };

    // Upload to S3
    const result = await s3.upload(params).promise();

    // Return the public URL
    // Format: https://bucket-name.s3.region.amazonaws.com/folder/filename
    const publicUrl = result.Location;
    
    return publicUrl;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Upload base64 image to S3
 * @param {String} base64String - Base64 encoded image string
 * @param {String} fileName - Name of the file
 * @param {String} folder - Folder path in S3 (optional)
 * @returns {Promise<String>} - Public URL of uploaded file
 */
const uploadBase64ToS3 = async (base64String, fileName, folder = 'screenshots') => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    // Determine content type from base64 string or default to jpeg
    let contentType = 'image/jpeg';
    if (base64String.includes('data:image/png')) {
      contentType = 'image/png';
    } else if (base64String.includes('data:image/jpeg') || base64String.includes('data:image/jpg')) {
      contentType = 'image/jpeg';
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${fileName}`;
    const key = `${folder}/${uniqueFileName}`;

    // Upload parameters
    // Note: ACL removed - bucket should be configured with public access via bucket policy
    // If bucket has ACLs disabled, use bucket policy instead for public access
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    };

    // Upload to S3
    const result = await s3.upload(params).promise();

    return result.Location;
  } catch (error) {
    console.error('S3 Base64 Upload Error:', error);
    throw new Error(`Failed to upload base64 image to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {String} fileUrl - Full URL of the file to delete
 * @returns {Promise<Boolean>} - Success status
 */
const deleteFromS3 = async (fileUrl) => {
  try {
    // Extract key from URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/folder/filename
    const urlParts = fileUrl.split('.com/');
    if (urlParts.length < 2) {
      throw new Error('Invalid S3 URL format');
    }
    const key = urlParts[1];

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

module.exports = {
  uploadToS3,
  uploadBase64ToS3,
  deleteFromS3
};
