// server/Middleware/uploadReview.js
/*
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Storage for review uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const productId = req.params.productId || "temp";
    const uploadPath = path.join(
      __dirname,
      `../uploads/products/${productId}/reviews/Images`
    );

    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

// ✅ Define fileFilter (allow only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"));
  }
};

// Export multer upload
const uploadReview = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // max 20MB
});

module.exports = uploadReview;
*/

// server/Middleware/uploadReview.js
const multer = require("multer");

// Store files in memory buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype) cb(null, true);
  else cb(new Error("Only image files are allowed!"));
};

const uploadReview = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = uploadReview;
