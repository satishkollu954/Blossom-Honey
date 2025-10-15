const Razorpay = require("razorpay");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Order = require("../Model/Order");
const Cart = require("../Model/Cart");

//console.log("KEY_ID:", process.env.RAZORPAY_KEY_ID);
//console.log("SECRET:", process.env.RAZORPAY_SECRET);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ✅ Create Razorpay Order
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const options = {
    amount: order.totalAmount * 100, // in paise
    currency: "INR",
    receipt: order._id.toString(),
    payment_capture: 1, // auto-capture
  };

  const razorpayOrder = await razorpay.orders.create(options);
  res.json({ order: razorpayOrder });
});

// ✅ Verify Payment
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    order.paymentStatus = "Paid";
    await order.save();
    res.json({ message: "Payment verified successfully", order });
  } else {
    res.status(400);
    throw new Error("Payment verification failed");
  }
});

module.exports = { createRazorpayOrder, verifyPayment };
