const express = require("express");
const router = express.Router();
const { protect, admin } = require("../Middleware/authMiddleware"); // your auth middlewares
const {
  getUserOrders,
  getUserOrder,
  requestReturn,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  handleReturnRequest,
  cancelOrder,
} = require("../Controller/orderController");

// ---------------------- USER ROUTES ---------------------- //
router.get("/", protect, getUserOrders); // Get all orders for user
router.get("/:id", protect, getUserOrder); // Get single order for user
router.post("/:id/return", protect, requestReturn); // Request return
router.post("/:id/cancel", protect, cancelOrder); // Cancel order

// ---------------------- ADMIN ROUTES ---------------------- //
router.get("/admin/all", protect, admin, getAllOrders); // Get all orders
router.get("/admin/:id", protect, admin, getOrderById); // Get single order
router.put("/admin/:id/status", protect, admin, updateOrderStatus); // Update status
router.put("/admin/:id/return", protect, admin, handleReturnRequest); // Handle return

module.exports = router;
