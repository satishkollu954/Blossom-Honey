// server/Model/Order.js
const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    weight: String,
    type: String,
    packaging: String,
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Product.variants" },
    name: { type: String, required: true },
    variant: variantSchema,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    images: [String],
    sku: String,
    weightInKg: Number,
    dimensions: {
      length: Number,
      breadth: Number,
      height: Number,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
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
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    paymentType: {
      type: String,
      enum: ["COD", "Online", "RAZORPAY"],
      default: "Online",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    razorpayPaymentId: { type: String, default: null },
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
      shipmentId: { type: Number, default: null },
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
    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["User", "Admin", "System"],
        default: null,
      },
      reason: { type: String, default: null },
      cancelledAt: { type: Date, default: null },
    },
    returnRequest: {
      requested: { type: Boolean, default: false },
      reason: String,
      status: {
        type: String,
        enum: ["Pending", "Processing", "Approved", "Rejected", "Returned"],
        default: "Pending",
      },
    },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    orderNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "Delivered") {
    this.deliveredAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
