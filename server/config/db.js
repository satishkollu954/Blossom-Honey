// config/db.js
const mongoose = require("mongoose");
const User = require("../Model/User");
const bcrypt = require("bcryptjs");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    await createAdminSeller();
    console.log(`MongoDB Connected: `);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

const createAdminSeller = async () => {
  // Check for required environment variables
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.log(
      "⚠️ Skipping Admin creation: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file."
    );
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const role = "admin";
  const name = process.env.ADMIN_NAME || "System Admin";

  // 1. Check if a user with the 'admin' role already exists
  const existingAdmin = await User.findOne({ role: "admin" });

  if (existingAdmin) {
    console.log("⚠️ System Admin already exists.");
    return;
  }

  // 2. If the user with that email exists but isn't an admin, warn and skip
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.log(
      `⚠️ User with email ${email} exists but is not an admin. Skipping creation.`
    );
    return;
  }

  try {
    // 3. Create the admin user. The User model's pre('save') hook will hash the password.
    const admin = await User.create({
      name,
      email,
      password,
      role,
      isVerified: true, // Auto-verify the system admin for immediate use
    });

    console.log(`✅ System Admin created: ${admin.email}`);
  } catch (error) {
    // This catches potential errors like validation failure
    console.error("❌ Error creating initial admin:", error.message);
  }
};
module.exports = connectDB;
