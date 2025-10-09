// server/Routes/productRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../Model/Product"); // Assuming your model is here
const {
  getApprovedProducts,
  getProductById,
  createProductReview,
} = require("../Controller/productController"); // Assuming your controller functions are here

// Assuming these middleware functions exist
const { protect } = require("../Middleware/authMiddleware");

// --- Updated: Import the factory function and create a review-specific uploader ---
const createUploader = require("../Middleware/uploadMiddleware");
const reviewUploader = createUploader("reviews"); // Use the 'reviews' subfolder for organization

// @desc    Fetch all APPROVED products (Public catalog view)
// @route   GET /api/products
// @access  Public
// Public routes
router.get("/", getApprovedProducts);
router.get("/:id", getProductById);

// Protected routes
router.post(
  "/:id/reviews",
  protect,
  createUploader("reviews").array("reviewImages", 5), // review images
  createProductReview
);

module.exports = router;
