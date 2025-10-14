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
const createUploader = (
  foldername,
  productId,
  subFolder,
  resourceType = "image"
) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `BlossomHoney/${foldername}/${productId}/${subFolder}`,
      resource_type: resourceType,
      allowed_formats:
        resourceType === "video"
          ? ["mp4", "mov", "avi", "mkv", "webm"]
          : ["jpg", "jpeg", "png", "webp"],
      public_id: (req, file) =>
        `${file.originalname.split(".")[0]}-${Date.now()}`,
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: resourceType === "video" ? 50 * 1024 * 1024 : 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const type = file.mimetype.split("/")[0];
      if (type === resourceType) cb(null, true);
      else cb(new Error(`Only ${resourceType} files are allowed!`), false);
    },
  });
};

// Helper to extract Cloudinary URLs
const extractFileUrls = (files) => {
  if (Array.isArray(files))
    return files.map((f) => f.path || f.secure_url).filter(Boolean);
  return [];
};

module.exports = { createUploader, extractFileUrls };
 

 