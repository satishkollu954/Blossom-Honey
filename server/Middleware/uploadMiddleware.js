// server/Middleware/uploadMiddleware.js
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// --- Cloudinary Configuration (Runs only once) ---
// Load environment variables for Cloudinary configuration
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error(
    "Cloudinary credentials are not fully configured in environment variables."
  );
} else {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Creates a configured multer upload instance for a specific Cloudinary folder.
 * * @param {string} folderName - The subfolder name to use within Cloudinary
 * (e.g., 'products', 'reviews', 'advertisements').
 * @returns {multer.Multer} The multer instance ready to be used in routes.
 */
const createUploader = (folderName) => {
  // Configure the storage engine for Multer with dynamic folder path
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      // Main folder (root) + dynamic subfolder
      folder: `mern-dryfruits-ecommerce/${folderName}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      // Create a unique public ID including the folder name and timestamp
      public_id: (req, file) => {
        const fileName = file.originalname.split(".")[0].replace(/\s/g, "_");
        const timestamp = Date.now();
        return `${folderName}-${fileName}-${timestamp}`;
      },
    },
  });

  // Create the upload instance
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image")) {
        cb(null, true);
      } else {
        // Return error if file is not an image
        cb(new Error("Only image files are allowed!"), false);
      }
    },
  });

  return upload;
};

// Export the factory function
module.exports = createUploader;
