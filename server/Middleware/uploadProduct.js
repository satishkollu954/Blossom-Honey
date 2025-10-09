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

/*
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const productId = req.body.productId || req.query.productId || "temp";
    const uploadPath = path.join(
      __dirname,
      `../uploads/products/${productId}/Images`
    );

    // If productId is 'temp', ensure we use temp folder
    const finalPath =
      productId === "temp"
        ? path.join(__dirname, "../uploads/products/temp/Images")
        : uploadPath;

    fs.mkdirSync(finalPath, { recursive: true });
    cb(null, finalPath);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = upload;
*/
