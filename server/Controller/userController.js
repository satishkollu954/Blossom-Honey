const asyncHandler = require("express-async-handler");
const User = require("../Model/User");

// ---------------- GET PROFILE ----------------
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    addresses: user.addresses || [],
  });
});

// ---------------- UPDATE PROFILE ----------------
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, email } = req.body;

  // Update only provided fields
  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res.json({
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      addresses: user.addresses || [],
    },
  });
});

// ---------------- GET ALL ADDRESSES ----------------
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user.addresses || []);
});

// ---------------- ADD NEW ADDRESS ----------------
const addAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    houseNo,
    street,
    city,
    state,
    postalCode,
    country,
    landmark,
    isDefault,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const newAddress = {
    fullName,
    phone,
    houseNo,
    street,
    city,
    state,
    postalCode,
    country: country || "India",
    landmark,
    isDefault: isDefault || false,
  };

  // If new address is default, remove default from others
  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(newAddress);
  await user.save();

  res.json({
    message: "Address added successfully",
    addresses: user.addresses,
  });
});

// ---------------- UPDATE ADDRESS ----------------
const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params; // Address ID
  const updatedData = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const address = user.addresses.id(id);
  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  // If updated to default, remove default from others
  if (updatedData.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  Object.assign(address, updatedData);
  await user.save();

  res.json({
    message: "Address updated successfully",
    addresses: user.addresses,
  });
});

// ---------------- DELETE ADDRESS ----------------
const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const address = user.addresses.id(id);
  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  address.deleteOne();
  await user.save();

  res.json({
    message: "Address deleted successfully",
    addresses: user.addresses,
  });
});

// ✅ Fetch all users (with addresses)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password -resetPasswordToken -resetPasswordExpire") // exclude sensitive fields
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

// ✅ Fetch user by ID (with addresses)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -resetPasswordToken -resetPasswordExpire"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user,
  });
});

module.exports = {
  getProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateProfile,
  getAllUsers,
  getUserById,
};
