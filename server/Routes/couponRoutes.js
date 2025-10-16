const express = require("express");
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} = require("../Controller/couponController");
const { protect, admin } = require("../Middleware/authMiddleware"); // if you have admin auth

// Admin-only routes
router.post("/", protect, admin, createCoupon);
router.get("/", protect, admin, getAllCoupons);
router.get("/:id", protect, admin, getCouponById);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

module.exports = router;
