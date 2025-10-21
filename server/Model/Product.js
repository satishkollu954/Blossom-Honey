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
  // Replaces 'size' with 'weight' or quantity (e.g., 250g, 500g, 1kg for dry fruits, or 250ml, 500ml for honey)
  weight: {
    type: String,
    enum: [
      "100g",
      "250g",
      "500g",
      "750g",
      "1kg",
      "2kg",
      "250ml",
      "500ml",
      "1L",
    ],
    required: true,
    description: "The quantity or weight of the product variant.",
  },
  // New field for specific type, flavor, or grade (e.g., 'Raw', 'Organic', 'Acacia', 'Roasted & Salted')
  type: {
    type: String,
    required: true,
    enum: [
      // 🐝 Honey Types
      "Raw", // Unprocessed, straight from the hive
      "Organic", // Certified organic
      "Wild", // Forest or wild-collected honey
      "Natural", // No additives or preservatives
      "Flavored", // Infused with flavors like lemon or ginger
      "Pure", // 100% natural, no blending

      // 🌰 Dry Fruits Types
      "Organic",
      "Roasted",
      "Salted",
      "Unsalted",
      "Plain",
      "Flavored",
      "Premium Grade",
      "Regular Grade",
    ],
    description:
      "The processing or quality type of the product (e.g., Raw, Organic, Wild, Roasted, Salted).",
  },

  // Packaging type is important for food items
  packaging: {
    type: String,
    enum: ["Jar", "Pouch", "Bottle", "Tin", "Box"],
    default: "Pouch",
    description: "The physical packaging of the variant.",
  },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number },
  stock: { type: Number, required: true },

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
