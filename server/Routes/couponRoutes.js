const express = require("express");
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  applyCouponToCart,
  removeCouponFromCart,
} = require("../Controller/couponController");
const { protect, adminAuth } = require("../Middleware/authMiddleware");

// 🔹 Admin routes
router.post("/", adminAuth, createCoupon);
router.get("/", adminAuth, getAllCoupons);
router.get("/:id", adminAuth, getCouponById);
router.put("/:id", adminAuth, updateCoupon);
router.delete("/:id", adminAuth, deleteCoupon);

// 🔹 User routes
router.post("/apply", protect, applyCouponToCart);
router.post("/remove", protect, removeCouponFromCart);

module.exports = router;
