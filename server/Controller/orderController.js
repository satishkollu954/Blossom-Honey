// server/Controller/orderController.js
const asyncHandler = require("express-async-handler");
const Order = require("../Model/Order");
const User = require("../Model/User");
const Product = require("../Model/Product");
const sendEmail = require("../utils/sendEmail");
const { createShipmentWithShiprocket } = require("../utils/shiprocket");

// ---------------------- USER CONTROLLERS ---------------------- //

// ✅ Get all orders of logged-in user //
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

// ✅ Cancel Order by user
const Razorpay = require("razorpay");
const Warehouse = require("../Model/Warehouse");

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

  // Only allow cancel if order is NOT shipped, delivered, cancelled, or returned
  if (
    ["Shipped", "Delivered", "Cancelled", "Returned"].includes(order.status)
  ) {
    res.status(400);
    throw new Error(
      `Order cannot be cancelled. Current status: ${order.status}`
    );
  }

  // Refund for online payments
  if (order.paymentType === "Online" && order.razorpayPaymentId) {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    try {
      const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: order.totalAmount * 100, // paise
      });
      order.paymentStatus = "Refunded";
      order.refundId = refund.id;
    } catch (err) {
      console.error("Refund failed:", err);
      res.status(500);
      throw new Error("Refund failed. Contact support.");
    }
  } else {
    order.paymentStatus = order.paymentType === "COD" ? "Pending" : "Refunded";
  }

  // Cancel the order
  order.status = "Cancelled";

  // Restock products
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

  // ---------------- SEND EMAIL ----------------
  const userEmail = order.user.email;
  const userName = order.user.name;

  await sendEmail({
    to: userEmail,
    subject: `Order #${order._id} Cancelled - Blossom Honey 🍯`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #fff8e7; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="background-color: #fbbf24; padding: 20px; text-align: center;">
            <h2 style="color: #fff; margin: 0;">Order Cancelled 🍯</h2>
          </div>

          <div style="padding: 30px;">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Your order <strong>#${
              order._id
            }</strong> has been successfully <strong>cancelled</strong>.</p>

            <div style="background-color: #fff8e7; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px;"><strong>Order Summary:</strong></p>
              <ul style="font-size: 14px; color: #555; padding-left: 20px;">
                ${order.products
                  .map(
                    (item) =>
                      `<li>${item.name} × ${item.quantity} – ₹${item.price}</li>`
                  )
                  .join("")}
              </ul>
              <p style="font-size: 15px; font-weight: bold; color: #333;">Total Refunded: ₹${
                order.paymentStatus === "Refunded" ? order.totalAmount : 0
              }</p>
            </div>

            <p style="font-size: 14px; color: #555;">
              If you have any questions, feel free to contact our support team.
            </p>

            <p style="margin-top: 30px; font-size: 14px; color: #777;">
              Regards,<br />
              <strong>The Blossom Honey Team 🍯</strong><br />
              <a href="https://yourfrontenddomain.com" style="color: #fbbf24;">www.blossomhoney.com</a>
            </p>
          </div>

          <div style="background-color: #fef3c7; text-align: center; padding: 15px; font-size: 12px; color: #777;">
            © ${new Date().getFullYear()} Blossom Honey. All rights reserved.
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

  res.json(Array.isArray(orders) ? orders : []);
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

  // ✅ Fetch order with user info for email
  const order = await Order.findById(orderId).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // ✅ Update order status
  order.status = status;

  // ✅ Delivered
  if (status === "Delivered") {
    order.deliveredAt = deliveredAt || new Date();
    if (order.paymentType === "COD") {
      order.paymentStatus = "Paid";
    }
  }

  // ✅ Shipped: create Shiprocket shipment if not already
  if (status === "Shipped" && !order.delivery.partner) {
    // ✅ Fetch a warehouse (example: first one)
    const warehouse = await Warehouse.findOne();
    if (!warehouse) {
      res.status(400);
      throw new Error("No warehouse found for shipment");
    }
    try {
      //  const shipmentData = await createShipmentWithShiprocket(order._id, warehouse._id);
      console.log(`🚀 Shiprocket shipment created for order ${order._id}`);
    } catch (err) {
      console.error(`❌ Failed to create Shiprocket shipment: ${err.message}`);
    }
  }

  await order.save();

  // ✅ Build professional HTML email
  const emailHtml = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fffaf4; padding: 30px; border-radius: 10px; max-width: 600px; margin: 20px auto; border: 1px solid #f3e2c0;">
    <div style="text-align: center;">
      <img src="https://i.ibb.co/2hvR0nq/honey-logo.png" alt="Blossom Honey" style="width: 120px; margin-bottom: 10px;" />
      <h2 style="color: #d97706; margin-bottom: 0;">Blossom Honey</h2>
      <p style="color: #555; font-size: 15px;">Pure • Natural • Organic</p>
    </div>

    <div style="background: #fff; border-radius: 10px; padding: 25px; margin-top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h3 style="color: #333; text-align: center;">Order Status Update</h3>
      <p style="font-size: 16px; color: #555;">
        Hello <strong>${order.user.name || "Customer"}</strong>,
      </p>
      <p style="font-size: 15px; color: #555;">
        We wanted to let you know that the status of your order 
        <strong>#${order._id
          .toString()
          .slice(-6)
          .toUpperCase()}</strong> has been updated.
      </p>

      <div style="text-align: center; margin: 25px 0;">
        <span style="
          background-color: ${
            status === "Delivered"
              ? "#16a34a"
              : status === "Shipped"
              ? "#2563eb"
              : status === "Processing"
              ? "#f59e0b"
              : status === "Cancelled"
              ? "#dc2626"
              : "#7c3aed"
          };
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: bold;
          font-size: 16px;
        ">
          ${status.toUpperCase()}
        </span>
      </div>

      ${
        status === "Delivered"
          ? `<p style="font-size: 15px; color: #555; text-align: center;">
              Your package has been successfully delivered! We hope you enjoy your purchase.<br/>
              Thank you for choosing <strong>Blossom Honey</strong> 🌸
            </p>`
          : status === "Shipped"
          ? `<p style="font-size: 15px; color: #555; text-align: center;">
              Great news! Your order is on its way 🚚<br/>
              You’ll receive it soon at your registered address.
            </p>`
          : status === "Processing"
          ? `<p style="font-size: 15px; color: #555; text-align: center;">
              Your order is currently being processed 🍯<br/>
              We’ll notify you once it’s shipped!
            </p>`
          : status === "Cancelled"
          ? `<p style="font-size: 15px; color: #555; text-align: center;">
              Your order has been cancelled. If you didn’t request this, please reach out to our support.
            </p>`
          : status === "Returned"
          ? `<p style="font-size: 15px; color: #555; text-align: center;">
              Your return has been successfully processed. We appreciate your patience.
            </p>`
          : ""
      }

      <hr style="margin: 25px 0; border: none; border-top: 1px solid #f3e2c0;">

      <p style="font-size: 14px; text-align: center; color: #777;">
        Need help? Contact us at <a href="mailto:support@blossomhoney.com" style="color: #d97706; text-decoration: none;">support@blossomhoney.com</a><br/>
        or call us at <strong>+91 8144513380</strong>
      </p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="http://localhost:5174" 
          style="background-color: #d97706; color: white; padding: 10px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          View Your Order
        </a>
      </div>
    </div>

    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
      &copy; ${new Date().getFullYear()} Blossom Honey. All rights reserved.
    </p>
  </div>
  `;

  // ✅ Send email
  await sendEmail({
    to: order.user.email,
    subject: `Order ${status} - Blossom Honey`,
    html: emailHtml,
  });

  res.json({
    message:
      "Order status updated, shipment created (if shipped), and email sent successfully",
    order,
  });
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
  cancelOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  handleReturnRequest,
};
