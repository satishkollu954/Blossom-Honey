// server/Middleware/uploadProduct.js

const multer = require("multer");

// Use memory storage so files are not stored locally
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif/;
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype) cb(null, true);
  else
    cb(new Error("Only image files (jpeg, jpg, png, webp, avif) are allowed!"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = upload;

