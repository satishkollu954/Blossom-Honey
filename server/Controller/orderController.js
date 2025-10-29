// server/Controller/orderController.js
const asyncHandler = require("express-async-handler");
const Order = require("../Model/Order");
const User = require("../Model/User");
const Product = require("../Model/Product");
const Warehouse = require("../Model/Warehouse");
const sendEmail = require("../utils/sendEmail");
const {
  createShipmentWithShiprocket,
  cancelShiprocketOrder,
  assignAWB,
} = require("../utils/shiprocket");
const Razorpay = require("razorpay");

// ---------------------- USER CONTROLLERS ---------------------- //

// ✅ Get all orders of logged-in user
const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await Order.find({ user: userId })
    .populate("products.product", "name category images variants")
    .sort({ createdAt: -1 });

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

  order.returnRequest = {
    requested: true,
    reason,
    status: "Pending",
  };

  await order.save();
  res.json({ message: "Return request submitted", order });
});

// ✅ Cancel order by user
const cancelOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orderId = req.params.id;

  const order = await Order.findOne({ _id: orderId, user: userId }).populate(
    "user"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    ["Shipped", "Delivered", "Cancelled", "Returned"].includes(order.status)
  ) {
    res.status(400);
    throw new Error(
      `Order cannot be cancelled. Current status: ${order.status}`
    );
  }
  console.log("Order delivery info:", order.delivery.shipmentId);
  // ✅ Cancel in Shiprocket if shipment exists
  if (order.delivery?.shipmentId) {
    try {
      await cancelShiprocketOrder([order.delivery.shipmentId]);
    } catch (err) {
      console.error("Shiprocket cancel failed:", err.message);
      // Optional: you can still continue cancelling locally even if Shiprocket fails
    }
  }

  // ✅ Refund for online payments
  if (order.paymentType === "Online" && order.razorpayPaymentId) {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    try {
      const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: order.totalAmount * 100,
      });
      order.paymentStatus = "Refunded";
      order.refundId = refund.id;
    } catch (err) {
      console.error("Refund failed:", err);
      res.status(500);
      throw new Error("Refund failed. Please contact support.");
    }
  } else {
    order.paymentStatus = order.paymentType === "COD" ? "Pending" : "Refunded";
  }

  order.status = "Cancelled";

  // ✅ Restock product variants
  for (const item of order.products) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    const variant = product.variants.id(item.variantId);
    if (variant) {
      variant.stock += item.quantity;
      await product.save();
    }
  }

  await order.save();

  // ✅ Send cancellation email
  await sendEmail({
    to: order.user.email,
    subject: `Order #${order._id} Cancelled - Blossom Honey 🍯`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #fff8e7; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px;">
          <div style="background-color: #fbbf24; padding: 20px; text-align: center;">
            <h2 style="color: #fff; margin: 0;">Order Cancelled 🍯</h2>
          </div>
          <div style="padding: 30px;">
            <p>Hi <strong>${order.user.name}</strong>,</p>
            <p>Your order <strong>#${
              order._id
            }</strong> has been successfully cancelled.</p>
            <ul>
              ${order.products
                .map(
                  (item) =>
                    `<li>${item.name} × ${item.quantity} – ₹${item.price}</li>`
                )
                .join("")}
            </ul>
            <p><strong>Refund:</strong> ₹${
              order.paymentStatus === "Refunded" ? order.totalAmount : 0
            }</p>
            <p>Thanks for shopping with Blossom Honey!</p>
          </div>
        </div>
      </div>
    `,
  });

  res.json({ message: "Order cancelled successfully", order });
});

// ---------------------- ADMIN CONTROLLERS ---------------------- //

// ✅ Get all orders
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("products.product", "name category images variants")
    .sort({ createdAt: -1 });

  res.json(orders || []);
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
  const { status, deliveredAt } = req.body;

  const order = await Order.findById(orderId).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;

  if (status === "Delivered") {
    order.deliveredAt = deliveredAt || new Date();
    if (order.paymentType === "COD") order.paymentStatus = "Paid";
  }

  if (status === "Shipped" && !order.delivery.partner) {
    const warehouse = await Warehouse.findOne();
    if (!warehouse) {
      res.status(400);
      throw new Error("No warehouse found for shipment");
    }

    try {
      await createShipmentWithShiprocket(order._id, warehouse._id);

      // 2️⃣ Assign AWB only after shipment created
      const updatedOrder = await Order.findById(order._id);
      if (
        updatedOrder.delivery?.shipmentId &&
        !updatedOrder.delivery?.awbNumber
      ) {
        console.log(
          "📦 Assigning AWB for shipment:",
          updatedOrder.delivery.shipmentId
        );

        const courierId = warehouse?.preferredCourierId || null; // optional
        try {
          const awbResponse = await assignAWB(
            updatedOrder.delivery.shipmentId,
            courierId
          );

          // ✅ Update order after successful AWB assignment
          updatedOrder.delivery.awbNumber =
            awbResponse.response?.data?.awb_code ||
            awbResponse.awb_code ||
            updatedOrder.delivery.awbNumber;
          updatedOrder.delivery.deliveryStatus = "AWB Assigned";
          await updatedOrder.save();

          console.log("✅ AWB successfully assigned:", awbResponse);
        } catch (awbErr) {
          // 🔍 Log full Shiprocket error response
          console.error(
            "❌ Shiprocket AWB Error:",
            awbErr.response?.data || awbErr.message
          );
        }
      }
    } catch (err) {
      console.error("Shiprocket Error:", err.message);
    }
  }

  await order.save();

  await sendEmail({
    to: order.user.email,
    subject: `Order ${status} - Blossom Honey`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background: #fffaf4; padding: 30px;">
        <h3 style="text-align:center; color:#d97706;">Order Status: ${status}</h3>
        <p>Hi ${order.user.name}, your order #${order._id
      .toString()
      .slice(-6)} is now <strong>${status}</strong>.</p>
        <p>Thank you for shopping with Blossom Honey 🍯</p>
      </div>
    `,
  });

  res.json({ message: "Order updated and email sent", order });
});

// ✅ Handle return approval/rejection
const handleReturnRequest = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

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
  cancelOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  handleReturnRequest,
};
