const asyncHandler = require("express-async-handler");
const Coupon = require("../Model/Coupon");
const Cart = require("../Model/Cart");
const mongoose = require("mongoose");

// -------------------------------
// 🔹 ADMIN CONTROLLERS
// -------------------------------

// --- Create Coupon ---
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    minPurchase,
    expiryDate,
    isActive,
    maxUses,
    oncePerUser,
    applicableCategories,
  } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    res.status(400);
    throw new Error("Coupon code already exists");
  }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    minPurchase,
    expiryDate,
    isActive,
    maxUses,
    oncePerUser,
    applicableCategories,
  });

  res.status(201).json({ message: "Coupon created successfully", coupon });
});

// --- Get All Coupons ---
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

// --- Get Coupon by ID ---
const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  res.json(coupon);
});

// --- Update Coupon ---
const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }

  Object.assign(coupon, updates);
  await coupon.save();
  res.json({ message: "Coupon updated successfully", coupon });
});

// --- Delete Coupon ---
const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  await coupon.deleteOne();
  res.json({ message: "Coupon deleted successfully" });
});

// -------------------------------
// 🔹 USER CONTROLLERS
// -------------------------------

// --- Apply Coupon to Cart ---
const applyCouponToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { code } = req.body;

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) throw new Error("Cart not found");

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
  if (!coupon) throw new Error("Invalid or expired coupon");

  // Check expiry
  if (new Date() > coupon.expiryDate) throw new Error("Coupon expired");

  // Check min purchase
  if (cart.totalAmount < coupon.minPurchase)
    throw new Error(`Minimum purchase of ₹${coupon.minPurchase} required`);

  // Check max uses
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
    throw new Error("Coupon usage limit reached");
  console.log("userid", userId);
  console.log(
    "===",
    coupon.usedBy.some((u) => u.toString() === userId.toString())
  );
  // Check once per user
  if (
    coupon.oncePerUser &&
    coupon.usedBy.some((u) => u.toString() === userId.toString())
  ) {
    console.log("userid", userId);
    throw new Error("You have already used this coupon");
  }

  // Optional: category-based restriction
  if (
    coupon.applicableCategories?.length &&
    !cart.items.some((i) =>
      coupon.applicableCategories.includes(i.product.category)
    )
  ) {
    throw new Error("Coupon not applicable for items in your cart");
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = (cart.totalAmount * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  if (discountAmount > cart.totalAmount) discountAmount = cart.totalAmount;

  cart.coupon = coupon._id;
  cart.discountAmount = discountAmount;
  cart.totalAmount = cart.totalAmount - discountAmount;
  await cart.save();

  res.json({
    message: "Coupon applied successfully",
    discountAmount,
    finalAmount: cart.totalAmount,
    coupon,
  });
});

// --- Remove Coupon from Cart ---
const removeCouponFromCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new Error("Cart not found");

  cart.totalAmount += cart.discountAmount || 0;
  cart.coupon = null;
  cart.discountAmount = 0;

  await cart.save();
  res.json({ message: "Coupon removed", cart });
});

// --- Mark Coupon as Used after Successful Order ---
const markCouponUsed = async (userId, couponId) => {
  if (!couponId || !mongoose.isValidObjectId(couponId)) return;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) return;

  coupon.usedCount += 1;
  if (coupon.oncePerUser && !coupon.usedBy.includes(userId)) {
    coupon.usedBy.push(userId);
  }
  await coupon.save();
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  applyCouponToCart,
  removeCouponFromCart,
  markCouponUsed,
};
