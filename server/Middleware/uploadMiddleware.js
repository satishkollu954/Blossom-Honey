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

module.exports = { createUploader, extractFileUrls };
 

 