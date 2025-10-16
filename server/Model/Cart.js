// server/Model/Cart.js
const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, default: 1, min: 1 },
  weight: { type: String, required: true },
  price: { type: Number, required: true },
  weight: { type: String, required: true },
  subtotal: { type: Number, required: true },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto update total and discount
cartSchema.pre("save", function (next) {
  // Remove out-of-stock variants automatically
  this.items = this.items.filter((item) => item.quantity > 0);

  const subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.totalAmount = subtotal - this.discountAmount;
  if (this.totalAmount < 0) this.totalAmount = 0;
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
