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
    subject: "Welcome to Blossom Honey 🍯 – Account Created Successfully",
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #fff8e7; padding: 30px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="background-color: #fbbf24; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">Welcome to Blossom Honey 🍯</h1>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">
          We’re delighted to welcome you to the Blossom Honey family! 🌼<br />
          Your account has been successfully created. You can now explore our
          premium collection of <strong>organic honey, dry fruits, nuts, and spices</strong>.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://yourfrontenddomain.com/login" 
             style="background-color: #fbbf24; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
             Explore Now
          </a>
        </div>

        <p style="font-size: 14px; color: #555;">
          If you didn’t create this account, please ignore this email or contact our support team immediately.
        </p>

        <p style="margin-top: 30px; font-size: 14px; color: #777;">
          Best wishes, <br />
          <strong>The Blossom Honey Team 🍯</strong><br />
          <a href="https://yourfrontenddomain.com" style="color: #fbbf24; text-decoration: none;">www.blossomhoney.com</a>
        </p>
      </div>

      <div style="background-color: #fef3c7; text-align: center; padding: 15px; font-size: 12px; color: #777;">
        © ${new Date().getFullYear()} Blossom Honey. All rights reserved.
      </div>
    </div>
  </div>
  `,
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

  await sendEmail({
    to: email,
    subject: "Your Blossom Honey OTP Code 🍯",
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #fff8e7; padding: 30px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="background-color: #fbbf24; padding: 20px; text-align: center;">
        <h2 style="color: #fff; margin: 0;">Email Verification Code</h2>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">
          Please use the verification code below to complete your registration with Blossom Honey.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background-color: #fff8e7; padding: 15px 30px; border-radius: 8px; border: 2px dashed #fbbf24; font-size: 24px; letter-spacing: 3px; font-weight: bold;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 14px; color: #555;">
          This code is valid for <strong>10 minutes</strong>. Please do not share it with anyone for your account’s safety.
        </p>

        <p style="margin-top: 30px; font-size: 14px; color: #777;">
          Regards,<br />
          <strong>The Blossom Honey Team 🍯</strong><br />
          <a href="http://localhost:5174" style="color: #fbbf24;">www.blossomhoney.com</a>
        </p>
      </div>

      <div style="background-color: #fef3c7; text-align: center; padding: 15px; font-size: 12px; color: #777;">
        © ${new Date().getFullYear()} Blossom Honey. All rights reserved.
      </div>
    </div>
  </div>
  `,
  });

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
    subject: "Password Reset OTP - Blossom Honey 🍯",
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #fff8e7; padding: 30px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="background-color: #fbbf24; padding: 20px; text-align: center;">
        <h2 style="color: #fff; margin: 0;">Reset Your Password</h2>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">
          We received a request to reset your Blossom Honey password.<br />
          Use the OTP below to continue with your password reset:
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background-color: #fff8e7; padding: 15px 30px; border-radius: 8px; border: 2px dashed #fbbf24; font-size: 24px; letter-spacing: 3px; font-weight: bold;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 14px; color: #555;">
          This OTP is valid for <strong>10 minutes</strong>.<br />
          If you didn’t request a password reset, please ignore this email.
        </p>

        <p style="margin-top: 30px; font-size: 14px; color: #777;">
          With love, <br />
          <strong>The Blossom Honey Team 🍯</strong><br />
          <a href="http://localhost:5174" style="color: #fbbf24;">www.blossomhoney.com</a>
        </p>
      </div>

      <div style="background-color: #fef3c7; text-align: center; padding: 15px; font-size: 12px; color: #777;">
        © ${new Date().getFullYear()} Blossom Honey. All rights reserved.
      </div>
    </div>
  </div>
  `,
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

  await sendEmail({
    to: email,
    subject: "Password Reset Successful – Blossom Honey 🍯",
    html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #fff8e1; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto; border: 1px solid #f0d879;">
      <h2 style="color: #16a34a; text-align: center;">Password Reset Successful</h2>
      <p style="font-size: 16px; color: #333;">Hi ${email.split("@")[0]},</p>
      <p style="font-size: 15px; color: #555;">
        Your <b>Blossom Honey</b> password has been successfully updated. You can now sign in using your new password.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${
          process.env.FRONTEND_URL || "https://blossomhoney.in"
        }/login" 
           style="background-color: #fbbf24; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Sign In
        </a>
      </div>
      <p style="font-size: 14px; color: #777; text-align:center;">
        If you did not perform this action, please contact our support immediately.
      </p>
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
      <p style="font-size: 13px; text-align: center; color: #999;">
        © ${new Date().getFullYear()} Blossom Honey. All rights reserved.
      </p>
    </div>
  `,
  });

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
