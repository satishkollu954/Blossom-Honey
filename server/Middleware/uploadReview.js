


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
