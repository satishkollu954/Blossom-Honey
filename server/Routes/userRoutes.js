const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");
const { admin } = require("../Middleware/authMiddleware");
const {
  getProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateProfile,
  getAllUsers,
  getUserById,
} = require("../Controller/userController");

// Profile
router.get("/profile", protect, getProfile);
// Update profile
router.put("/profile", protect, updateProfile);

// Address management
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:id", protect, updateAddress);
router.delete("/addresses/:id", protect, deleteAddress);

// ✅ Get all users (Admin only)
router.get("/", admin, getAllUsers);

// ✅ Get specific user by ID (Admin only)
router.get("/users/:id", admin, getUserById);

module.exports = router;
