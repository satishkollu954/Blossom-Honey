// server/Routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const {
  addReview,
  getProductReviews,
} = require("../Controller/reviewController");
const { protect } = require("../Middleware/authMiddleware");
const createUploader = require("../Middleware/uploadMiddleware");

// Optional: Use Cloudinary uploader for review images
const reviewUploader = createUploader("reviews");

// @desc    Add a review for a product
// @route   POST /api/reviews/:productId
// @access  Private/User
router.post(
  "/:productId",
  protect,
  reviewUploader.array("reviewImages", 5), // optional images
  async (req, res, next) => {
    try {
      // Attach uploaded images to req.body
      if (req.files && req.files.length > 0) {
        req.body.images = req.files.map((file) => file.path || file.secure_url);
      }
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Review upload failed" });
    }
  },
  addReview
);

// @desc    Get all reviews of a product
// @route   GET /api/reviews/:productId
// @access  Public
router.get("/:productId", getProductReviews);

module.exports = router;
