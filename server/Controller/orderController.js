const asyncHandler = require("express-async-handler");
const Order = require("../Model/Order");
const User = require("../Model/User");
const Product = require("../Model/Product");

// ---------------------- USER CONTROLLERS ---------------------- //

// ✅ Get all orders of logged-in user
const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await Order.find({ user: userId })
    .populate("products.product", "name category images variants")
    .sort({ createdAt: -1 });

  // Transform data so that frontend gets images directly
  const formattedOrders = orders.map((order) => ({
    ...order._doc,
    products: order.products.map((item) => ({
      ...item._doc,
      name: item.product?.name || "Unnamed Product",
      images: item.product?.images?.length
        ? item.product.images
        : item.product?.variants?.[0]?.images || [],
    })),
  }));

  res.json(formattedOrders);
});

// ✅ Get single order of user
const getUserOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;

  const order = await Order.findOne({ _id: orderId, user: userId }).populate(
    "products.product",
    "name category images variants"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.json(order);
});

// ✅ Request return
const requestReturn = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;
  const { reason } = req.body;

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.returnRequest.requested) {
    res.status(400);
    throw new Error("Return already requested");
  }

  order.returnRequest.requested = true;
  order.returnRequest.reason = reason;
  order.returnRequest.status = "Pending";

  await order.save();
  res.json({ message: "Return request submitted", order });
});

// ---------------------- ADMIN CONTROLLERS ---------------------- //

// ✅ Get all orders
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("products.product", "name category images variants")
    .sort({ createdAt: -1 });

  res.json(orders);
});

// ✅ Get single order by admin
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("products.product", "name category images variants");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.json(order);
});

// ✅ Update order status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { status, deliveredAt } = req.body; // status: Processing, Shipped, Delivered, Cancelled, Returned

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;
  if (status === "Delivered") order.deliveredAt = deliveredAt || new Date();

  await order.save();
  res.json({ message: "Order status updated", order });
});

// ✅ Approve/Reject Return Request
const handleReturnRequest = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body; // Approved / Rejected

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!order.returnRequest.requested) {
    res.status(400);
    throw new Error("No return request found");
  }

  order.returnRequest.status = status;
  if (status === "Approved") order.status = "Returned";

  await order.save();
  res.json({ message: "Return request updated", order });
});

module.exports = {
  getUserOrders,
  getUserOrder,
  requestReturn,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  handleReturnRequest,
};
