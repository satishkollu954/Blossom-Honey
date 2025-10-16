const asyncHandler = require("express-async-handler");
const Coupon = require("../Model/Coupon");

// --- Create Coupon ---
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    minPurchase,
    expiryDate,
    isActive,
  } = req.body;

  // Check if coupon already exists
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
  });

  res.status(201).json({ message: "Coupon created successfully", coupon });
});

// --- Get All Coupons ---
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

// --- Get Single Coupon by ID ---
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
  const {
    code,
    discountType,
    discountValue,
    minPurchase,
    expiryDate,
    isActive,
  } = req.body;

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }

  // Update fields
  if (code) coupon.code = code.toUpperCase();
  if (discountType) coupon.discountType = discountType;
  if (discountValue) coupon.discountValue = discountValue;
  if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
  if (expiryDate) coupon.expiryDate = expiryDate;
  if (isActive !== undefined) coupon.isActive = isActive;

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

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};
