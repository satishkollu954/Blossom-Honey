const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} folder - Folder path in Cloudinary
 * @param {string} filename - Name of the file
 * @param {"image"|"video"} resourceType - Type of file (default "image")
 * @returns {Promise<string>} - Returns secure URL
 */
const createUploader = (fileBuffer, folder, filename, resourceType = "image") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: resourceType,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });

/**
 * Extract file URLs from multer files array
 */
const extractFileUrls = (files) => {
  if (!files) return [];
  return files.map((f) => f.path || f.secure_url).filter(Boolean);
};

/**
 * Delete entire folder from Cloudinary
 */
const deleteCloudinaryFolder = async (folderPath) => {
  try {
    await cloudinary.api.delete_resources_by_prefix(folderPath);
    await cloudinary.api.delete_folder(folderPath);
    console.log(`✅ Cloudinary folder deleted: ${folderPath}`);
  } catch (error) {
    console.error(`❌ Error deleting Cloudinary folder ${folderPath}:`, error.message);
  }
};

module.exports = { createUploader, extractFileUrls, deleteCloudinaryFolder };
