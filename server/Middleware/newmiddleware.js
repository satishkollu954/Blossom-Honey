const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Multer memory storage
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
});

const extractFileUrls = (files) => {
  if (Array.isArray(files))
    return files.map((f) => f.secure_url || f.url).filter(Boolean);
  return [];
};

module.exports = { upload, cloudinary, extractFileUrls };
