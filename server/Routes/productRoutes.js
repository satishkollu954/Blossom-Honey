// server/Routes/productRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../Model/Product"); // Assuming your model is here
const {
  getApprovedProducts,
  getProductById,
  createProductReview,
  getProductsByCategory,
  getProductReviews,
} = require("../Controller/productController"); // Assuming your controller functions are here
const { upload } = require("../Middleware/newmiddleware");
// Assuming these middleware functions exist
const { protect } = require("../Middleware/authMiddleware");

// --- Updated: Import the factory function and create a review-specific uploader ---
const { createUploader } = require("../Middleware/uploadMiddleware");
const { getActiveAdvertisementsForUser } = require("../Controller/advertisementController");
//const reviewUploader = createUploader("reviews"); // Use the 'reviews' subfolder for organization

// @desc    Fetch all APPROVED products (Public catalog view)
// @route   GET /api/products
// @access  Public
// Public routes
router.get("/", getApprovedProducts);
router.get("/product/:id", getProductById);
router.get("/category/:categoryName", getProductsByCategory);

router.get("/active", getActiveAdvertisementsForUser);
// Protected routes
router.post(
  "/:id/reviews",
  protect,
  upload.fields([
    { name: "reviewImages", maxCount: 10 },
    { name: "variantImages", maxCount: 20 },
  ]), // review images
  createProductReview
);
router.get("/:id/reviews", getProductReviews);

module.exports = router;
