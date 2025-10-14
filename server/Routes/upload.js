// server/Routes/upload.js
const express = require("express");
const router = express.Router();
const { createUploader } = require("../Middleware/uploadMiddleware");
const { createProductReview } = require("../Controller/productController");
const { protect } = require("../Middleware/authMiddleware");

// Create specific upload instances for products, reviews, and advertisements
const productUploader = createUploader();
const reviewUploader = createUploader("reviews");
const advertisementUploader = createUploader("advertisements");

// Utility: format uploaded files
const formatFiles = (files) =>
  files.map((file) => ({
    url: file.path || file.secure_url,
    public_id: file.filename || file.public_id,
    type: file.mimetype.startsWith("video") ? "video" : "image",
  }));

// =======================================================
// 1️⃣ Upload Product Images & Videos
// =======================================================
router.post(
  "/upload/products",
  productUploader.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const images = formatFiles(req.files?.images || []);
      const videos = formatFiles(req.files?.videos || []);

      if (images.length === 0 && videos.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      res.json({
        message: "Product media uploaded successfully",
        images,
        videos,
      });
    } catch (err) {
      console.error("Product upload error:", err);
      res.status(500).json({
        message: "Product upload failed",
        error: err.message,
      });
    }
  }
);

// =======================================================
// 2️⃣ Upload Review Images & Videos (and create review)
// =======================================================
router.post(
  "/reviews/:productId",
  protect,
  reviewUploader.fields([
    { name: "images", maxCount: 5 },
    { name: "videos", maxCount: 2 },
  ]),
  async (req, res) => {
    try {
      const images = formatFiles(req.files?.images || []);
      const videos = formatFiles(req.files?.videos || []);

      if (images.length === 0 && videos.length === 0) {
        return res.status(400).json({ message: "No media uploaded" });
      }

      // Attach uploaded media URLs for controller
      req.files = [...(req.files?.images || []), ...(req.files?.videos || [])];
      await createProductReview(req, res);
    } catch (err) {
      console.error("Review upload error:", err);
      res.status(500).json({
        message: "Review upload failed",
        error: err.message,
      });
    }
  }
);

// =======================================================
// 3️⃣ Upload Advertisement Images & Videos
// =======================================================
router.post(
  "/upload/advertisements",
  advertisementUploader.fields([
    { name: "images", maxCount: 5 },
    { name: "videos", maxCount: 2 },
  ]),
  async (req, res) => {
    try {
      const images = formatFiles(req.files?.images || []);
      const videos = formatFiles(req.files?.videos || []);

      if (images.length === 0 && videos.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      res.json({
        message: "Advertisement media uploaded successfully",
        images,
        videos,
      });
    } catch (err) {
      console.error("Advertisement upload error:", err);
      res.status(500).json({
        message: "Advertisement upload failed",
        error: err.message,
      });
    }
  }
);

module.exports = router;
