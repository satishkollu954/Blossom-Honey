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
router.post("/", admin, createCoupon);
router.get("/", admin, getAllCoupons);
router.get("/:id", admin, getCouponById);
router.put("/:id", admin, updateCoupon);
router.delete("/:id", admin, deleteCoupon);

// 🔹 User routes
router.post("/apply", protect, applyCouponToCart);
router.post("/remove", protect, removeCouponFromCart);

module.exports = router;
