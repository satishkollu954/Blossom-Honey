//utils/getUserFromPayment
const Payment = require("../Models/Payment");
const Order = require("../Models/Order");
const User = require("../Models/User");

const getUserFromPayment = async (razorpay_payment_id) => {
  const payment = await Payment.findOne({ razorpay_payment_id });
  if (!payment) throw new Error("Payment not found");

  const order = await Order.findOne({ payment: payment._id });
  if (!order) throw new Error("Order not found");

  const user = await User.findById(order.user);
  if (!user) throw new Error("User not found");

  return user;
};

module.exports = getUserFromPayment;
