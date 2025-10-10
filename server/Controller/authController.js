// server/Controller/authController.js
const asyncHandler = require("express-async-handler");
const User = require("../Model/User");
const OtpVerification = require("../Model/OtpVerification");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT token
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Helper: generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ---------------- SIGNUP ----------------
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    throw new Error("Please provide name, email, and password");

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  // Create user but set isVerified=false
  const isVerified = true;
  const user = await User.create({ name, email, password, isVerified });

  //   // Generate OTP
  //   const otp = generateOTP();
  //   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  //   await OtpVerification.create({ email, otp, expiresAt });

  // Send OTP via email
  await sendEmail({
    to: email,
    subject: "Your Account created successfully - Blossom Honey",
    html: `Thank you for registering with Blossom Honey. Your account has been successfully created.`,
  });

  res.json({
    message: "User registered successfully",
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// ---------------- VERIFY OTP ----------------
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const record = await OtpVerification.findOne({ email, otp });
  if (!record) throw new Error("Invalid OTP");

  if (record.expiresAt < new Date()) {
    await OtpVerification.deleteOne({ _id: record._id });
    throw new Error("OTP expired");
  }

  // Mark user as verified
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  user.isVerified = true;
  await user.save();

  // Delete OTP after successful verification
  await OtpVerification.deleteOne({ _id: record._id });

  res.json({
    message: "Email verified successfully",
    token: generateToken(user._id),
  });
});

// ---------------- LOGIN ----------------
const login = asyncHandler(async (req, res) => {
  console.log("Login attempt:", req.body);
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid email or password");

  if (!user.isVerified) throw new Error("Email not verified");

  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new Error("Invalid email or password");

  res.json({
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// ---------------- FORGOT PASSWORD ----------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await OtpVerification.create({ email, otp, expiresAt });

  // Send OTP
  await sendEmail({
    to: email,
    subject: "Reset Password OTP - FitFusion",
    html: `<p>Your OTP for password reset is: <b>${otp}</b></p><p>Valid for 10 minutes</p>`,
  });
  res.json({ message: "OTP sent to your email" });
});

// ---------------- RESET PASSWORD ----------------
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  const record = await OtpVerification.findOne({ email });
  if (!record) throw new Error("Invalid OTP");
  if (record.expiresAt < new Date()) {
    await OtpVerification.deleteOne({ _id: record._id });
    throw new Error("OTP expired");
  }
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  user.password = newPassword; // will be hashed via pre('save')
  await user.save();

  await OtpVerification.deleteOne({ _id: record._id });

  res.json({ message: "Password reset successful" });
});

module.exports = {
  signup,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
};
