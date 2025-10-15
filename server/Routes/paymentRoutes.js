const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");
const { createRazorpayOrder, verifyPayment } = require("../Controller/paymentController");

router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyPayment);

module.exports = router;
