// server/Routes/deliveryRoutes.js
const express = require("express");
const router = express.Router();
const { protect, admin } = require("../Middleware/authMiddleware");

const {
  createShipment,
  updateDeliveryStatus,
  trackDelivery,
} = require("../Controller/deliveryController");
const { handleShiprocketWebhook } = require("../utils/shiprocketTracker");

// Admin creates shipment after packing order
router.post("/:orderId/create", protect, admin, createShipment);

// Admin/webhook updates delivery status
router.put("/:orderId/status", protect, admin, updateDeliveryStatus);

// User tracks delivery
router.get("/:orderId/track", protect, trackDelivery);
router.post("/webhook/shiprocket", handleShiprocketWebhook);

module.exports = router;
