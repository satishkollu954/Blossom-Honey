const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,

  syncGuestCart,
  checkout,
  verifyOnlinePayment,
} = require("../Controller/cartController");

router.post("/add", protect, addToCart);
router.get("/", protect, getCart);
router.put("/update", protect, updateCartItem);
router.delete("/remove/:productId/:variantId", protect, removeCartItem);
//router.post("/apply-coupon", protect, applyCoupon);
//router.post("/sync", protect, syncGuestCart);
// Checkout + create Razorpay order / COD
router.post("/checkout", protect, checkout);

// Verify Razorpay Payment
router.post("/payment/verify", protect, verifyOnlinePayment);

module.exports = router;
