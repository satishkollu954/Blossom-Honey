// server/Routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
} = require("../Controller/authController");

// Signup (user or seller)
router.post("/signup", signup);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Login
router.post("/login", login);

// Forgot password
router.post("/send-otp", forgotPassword);

// Reset password using OTP
router.post("/reset-password", resetPassword);

module.exports = router;
