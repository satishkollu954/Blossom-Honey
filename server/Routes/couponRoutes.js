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
const { protect, admin } = require("../Middleware/authMiddleware");

// 🔹 Admin routes
router.post("/", protect, admin, createCoupon);
router.get("/", protect, admin, getAllCoupons);
router.get("/:id", protect, admin, getCouponById);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

// 🔹 User routes
router.post("/apply", protect, applyCouponToCart);
router.post("/remove", protect, removeCouponFromCart);

module.exports = router;
