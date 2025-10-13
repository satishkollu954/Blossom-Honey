// server/Middleware/uploadMiddleware.js
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// --- Cloudinary Configuration ---
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("❌ Cloudinary credentials missing in .env");
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Create an uploader for a specific folder (images/videos)
 * @param {string} folderName - Cloudinary folder name
 * @param {"image"|"video"} resourceType - Resource type (default: image)
 * @returns multer instance
 */
const createUploader = (folderName, resourceType = "image") => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `mern-dryfruits-ecommerce/${folderName}`,
      resource_type: resourceType, // 👈 Allow images or videos
      allowed_formats:
        resourceType === "video"
          ? ["mp4", "mov", "avi", "mkv", "webm"]
          : ["jpg", "jpeg", "png", "webp"],
      public_id: (req, file) => {
        const fileName = file.originalname.split(".")[0].replace(/\s/g, "_");
        return `${folderName}-${Date.now()}-${fileName}`;
      },
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: resourceType === "video" ? 1024 * 1024 * 50 : 1024 * 1024 * 5, // 50MB for video, 5MB for image
    },
    fileFilter: (req, file, cb) => {
      const type = file.mimetype.split("/")[0];
      if (type === resourceType) cb(null, true);
      else cb(new Error(`Only ${resourceType} files are allowed!`), false);
    },
  });
};

// --- Helper: Extract URLs from multer's Cloudinary output ---
const extractFileUrls = (files) => {
  if (Array.isArray(files)) {
    return files.map((file) => file.path || file.secure_url).filter(Boolean);
  }
  return [];
};

module.exports = { createUploader, extractFileUrls };
