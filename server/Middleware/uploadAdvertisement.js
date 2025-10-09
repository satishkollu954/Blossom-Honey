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

/*
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const advertisementId =
      req.body.advertisementId || req.query.advertisementId || "temp";
    const uploadPath = path.join(
      __dirname,
      `../uploads/advertisements/${advertisementId}/images`
    );

    // If advertisementId is 'temp', ensure we use temp folder
    const finalPath =
      advertisementId === "temp"
        ? path.join(__dirname, "../uploads/advertisements/temp/images")
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
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"));
};

const uploadAdvertisement = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = uploadAdvertisement;
*/
