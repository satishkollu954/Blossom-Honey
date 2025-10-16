//server/Middlware/uploadMiddleware.js

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
 * Dynamic Cloudinary storage
 * @param {string} productId
 * @param {string} subFolder - "images" or "variants"
 * @param {"image"|"video"} resourceType
 */
const createUploader = (fileBuffer, folder, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder, // folder path
        public_id: filename, // file name
        resource_type: "image", // ensure it’s treated as image
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });

// Helper to extract Cloudinary URLs
const extractFileUrls = (files) => {
  if (Array.isArray(files))
    return files.map((f) => f.path || f.secure_url).filter(Boolean);
  return [];
};

const deleteCloudinaryFolder = async (folderPath) => {
  try {
    // Delete all resources inside the folder
    await cloudinary.api.delete_resources_by_prefix(folderPath);

    // Then delete the empty folder itself
    await cloudinary.api.delete_folder(folderPath);

    console.log(`✅ Cloudinary folder deleted: ${folderPath}`);
  } catch (error) {
    console.error(`❌ Error deleting Cloudinary folder ${folderPath}:`, error.message);
  }
};

module.exports = { createUploader, extractFileUrls, deleteCloudinaryFolder };
//module.exports = { createUploader, extractFileUrls };
