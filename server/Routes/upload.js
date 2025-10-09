// server/Routes/upload.js
const express = require("express");
const router = express.Router();
const createUploader = require("../Middleware/uploadMiddleware");
const { createProductReview } = require("../Controller/productController");
const { protect } = require("../Middleware/authMiddleware");

// Create specific upload instances for products, reviews, advertisements
const productUploader = createUploader("products");
const reviewUploader = createUploader("reviews");
const advertisementUploader = createUploader("advertisements");

// ------------------------
// Upload Product Images
// ------------------------
router.post(
  "/upload/products",
  productUploader.array("file", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Return uploaded file URLs and public IDs
      const files = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));

      res.json({
        message: "Product images uploaded successfully",
        files,
      });
    } catch (err) {
      console.error("Product upload error:", err);
      res
        .status(500)
        .json({ message: "Product upload failed", error: err.message });
    }
  }
);

// ------------------------
// Upload Review Images
// ------------------------
router.post(
  "/reviews/:productId",
  protect,
  reviewUploader.array("images", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }

      // Attach uploaded image URLs to request body for the controller
      req.body.images = req.files.map((file) => file.path);

      // Call controller to save review
      await createProductReview(req, res);
    } catch (err) {
      console.error("Review upload error:", err);
      res
        .status(500)
        .json({ message: "Review upload failed", error: err.message });
    }
  }
);

// ------------------------
// Upload Advertisement Images
// ------------------------
router.post(
  "/upload/advertisements",
  advertisementUploader.array("file", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const files = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));

      res.json({
        message: "Advertisement images uploaded successfully",
        files,
      });
    } catch (err) {
      console.error("Advertisement upload error:", err);
      res
        .status(500)
        .json({ message: "Advertisement upload failed", error: err.message });
    }
  }
);

module.exports = router;
