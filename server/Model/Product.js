// server/Model/Product.js
const mongoose = require("mongoose");

// Review Schema
const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    images: [String],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Variant Schema for Dry Fruits and Honey
const variantSchema = new mongoose.Schema({
  weight: {
    type: String,
    required: true,
    description: "e.g., 250g, 1kg, etc.",
  },
  weightInKg: {
    type: Number,
    required: true,
    description: "Weight in kilograms (for Shiprocket integration).",
  },
  dimensions: {
    length: { type: Number, default: 10 },
    breadth: { type: Number, default: 10 },
    height: { type: Number, default: 10 },
  },
  type: String,
  packaging: String,
  price: Number,
  discount: Number,
  finalPrice: Number,
  stock: Number,
  sku: { type: String, required: true, unique: true },
  images: [String],
});

// Product Schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Updated category for food items
    category: {
      type: String,
      enum: ["dry-fruits", "honey", "nuts-seeds", "spices", "other"],
      required: true,
    },

    sku: { type: String, required: true, unique: true, uppercase: true },

    variants: [variantSchema],

    images: [String],
    videos: [{ type: String }], // general product-level videos (e.g., lifestyle shots)
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isApproved: { type: Boolean, default: false },
    shippingCharge: { type: Number, default: 0 },
    deliveryTime: { type: String, default: "3-5 business days" },

    reviews: [reviewSchema],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    tags: [String],
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

// Auto calculate finalPrice for each variant before saving
productSchema.pre("save", function (next) {
  this.variants = this.variants.map((variant) => {
    // Ensure variant is a plain object or has a toObject method if it's already a subdocument
    const variantObj = variant.toObject ? variant.toObject() : variant;

    const discount = variantObj.discount || 0;
    const final = Math.round(
      variantObj.price - (variantObj.price * discount) / 100
    );

    // Return a new object with the calculated finalPrice
    return { ...variantObj, finalPrice: final };
  });
  next();
});

module.exports = mongoose.model("Product", productSchema);
