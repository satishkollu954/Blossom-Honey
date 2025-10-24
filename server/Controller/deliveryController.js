// server/Controller/deliveryController.js
const asyncHandler = require("express-async-handler");
const Order = require("../Model/Order");
const { createShipmentWithShiprocket } = require("../utils/shiprocket");
const sendEmail = require("../utils/sendEmail");

// ✅ Create Shipment (Admin triggers this when ready to ship)
const createShipment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId).populate("user");
  if (!order) throw new Error("Order not found");

  if (order.delivery?.partner) {
    return res.status(400).json({ message: "Shipment already created" });
  }

  const shipmentData = await createShipmentWithShiprocket(order);

  // ✅ Assign delivery details
  order.status = "Shipped";
  order.delivery.partner = shipmentData.partner || "Shiprocket";
  order.delivery.trackingId = shipmentData.trackingId;
  order.delivery.awbNumber = shipmentData.awbNumber;
  order.delivery.shipmentId = shipmentData.shipmentId;
  order.delivery.estimatedDeliveryDate = shipmentData.estimatedDeliveryDate;
  order.delivery.deliveryStatus = "In Transit";
  await order.save();

  // 📧 Send Shipment Email
  await sendEmail({
    to: order.user.email,
    subject: `Your Order #${order._id} has been shipped 🚚`,
    html: `
      <h2>Hi ${order.user.name},</h2>
      <p>Your order <strong>#${
        order._id
      }</strong> has been shipped via <strong>${
      order.delivery.partner
    }</strong>.</p>
      <p><strong>Tracking ID:</strong> ${order.delivery.awbNumber}</p>
      <p>Expected delivery by: <strong>${new Date(
        order.delivery.estimatedDeliveryDate
      ).toLocaleDateString()}</strong></p>
      <p>Thank you for shopping with Blossom Honey 🍯!</p>
    `,
  });

  res.json({
    message: "Shipment created successfully",
    shipmentData,
    order,
  });
});

// ✅ Update Delivery Status (Webhook or manual update)
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { deliveryStatus } = req.body;
  const order = await Order.findById(orderId).populate("user");
  if (!order) throw new Error("Order not found");

  order.delivery.deliveryStatus = deliveryStatus;

  if (deliveryStatus === "Delivered" && order.status !== "Delivered") {
    order.status = "Delivered";
    order.deliveredAt = new Date();

    await sendEmail({
      to: order.user.email,
      subject: `Your Order #${order._id} has been delivered 🎉`,
      html: `
        <h2>Hi ${order.user.name},</h2>
        <p>Your order <strong>#${order._id}</strong> has been successfully delivered!</p>
        <p>We hope you enjoy your honey 🍯 and thank you for shopping with Blossom Honey.</p>
      `,
    });
  }

  await order.save();
  res.json({ message: "Delivery status updated", order });
});

// ✅ Track Delivery (User)
const trackDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (!order.delivery?.partner || !order.delivery.awbNumber) {
    return res.status(400).json({ message: "Tracking not available" });
  }

  res.json({
    partner: order.delivery.partner,
    trackingId: order.delivery.trackingId,
    awbNumber: order.delivery.awbNumber,
    deliveryStatus: order.delivery.deliveryStatus,
    estimatedDeliveryDate: order.delivery.estimatedDeliveryDate,
  });
});

module.exports = {
  createShipment,
  updateDeliveryStatus,
  trackDelivery,
};
