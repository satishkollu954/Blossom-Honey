// server/Middleware/uploadAdvertisement.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "advertisements", // Cloudinary folder
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) =>
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_"),
  },
});

const uploadAdvertisement = multer({ storage });

module.exports = uploadAdvertisement;

