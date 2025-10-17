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
<<<<<<< HEAD
const { protect, adminAuth } = require("../Middleware/authMiddleware");
=======
const { protect, admin } = require("../Middleware/authMiddleware");
>>>>>>> a3d23f74861d6af8ddf59773036ed4a1cdaa2142

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
