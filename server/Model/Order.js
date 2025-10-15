// models/Order.js
const mongoose = require("mongoose");

// Single item in an order for Honey/Dry Fruits
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // reference to the specific variant
    },
    name: { type: String, required: true }, // product name
    variant: {
      weight: String,
      type: String,
      packaging: String,
    },
    price: { type: Number, required: true }, // final price at purchase
    quantity: { type: Number, required: true },
    images: [String], // optional: variant images
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    products: [orderItemSchema],

    shippingAddress: {
      fullName: String,
      phone: String,
      houseNo: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "India" },
      landmark: String,
    },

    totalAmount: { type: Number, required: true },

    paymentType: { type: String, enum: ["COD", "Online"], default: "Online" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

    status: {
      type: String,
      enum: [
        "Placed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Placed",
    },

    delivery: {
      partner: { type: String, default: null },
      trackingId: { type: String, default: null },
      awbNumber: { type: String, default: null },
      pickupAddress: { type: String, default: null },
      deliveryAddress: { type: String, default: null },
      deliveryStatus: {
        type: String,
        enum: [
          "Pending",
          "Pickup Scheduled",
          "In Transit",
          "Delivered",
          "Cancelled",
        ],
        default: "Pending",
      },
      estimatedDeliveryDate: { type: Date },
    },

    deliveredAt: { type: Date },

    returnRequest: {
      requested: { type: Boolean, default: false },
      reason: String,
      status: {
        type: String,
        enum: ["Pending", "Processing", "Approved", "Rejected", "Returned"],
        default: "Pending",
      },
    },

    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }, // optional coupon applied
    discountAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
