const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true },

    minPurchase: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },

    isActive: { type: Boolean, default: true },

    // ✅ New fields below

    // Limit how many times the coupon can be used in total
    maxUses: { type: Number, default: 0 }, // 0 = unlimited

    // Track how many times used globally
    usedCount: { type: Number, default: 0 },

    // ✅ Restrict to once per user
    oncePerUser: { type: Boolean, default: false },

    // Store which users have already used it
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Optional: restrict coupon to specific users
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Optional: restrict coupon to categories (e.g., only "honey" or "dry-fruits")
    applicableCategories: [String],
  },
  { timestamps: true }
);

// ✅ Auto-disable expired coupons
couponSchema.pre("save", function (next) {
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.isActive = false;
  }
  next();
});

module.exports = mongoose.model("Coupon", couponSchema);
