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
  recommendCourier,
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
// const cancelOrder = asyncHandler(async (req, res) => {
//   const userId = req.user._id;
//   const orderId = req.params.id;

//   const order = await Order.findOne({ _id: orderId, user: userId }).populate(
//     "user"
//   );

//   if (!order) {
//     res.status(404);
//     throw new Error("Order not found");
//   }

//   if (
//     ["Shipped", "Delivered", "Cancelled", "Returned"].includes(order.status)
//   ) {
//     res.status(400);
//     throw new Error(
//       `Order cannot be cancelled. Current status: ${order.status}`
//     );
//   }
//   console.log("Order delivery info:", order.delivery.shipmentId);
//   // ✅ Cancel in Shiprocket if shipment exists
//   if (order.delivery?.shipmentId) {
//     try {
//       await cancelShiprocketOrder([order.delivery.shipmentId]);
//     } catch (err) {
//       console.error("Shiprocket cancel failed:", err.message);
//       // Optional: you can still continue cancelling locally even if Shiprocket fails
//     }
//   }

//   // ✅ Refund for online payments
//   if (order.paymentType === "Online" && order.razorpayPaymentId) {
//     const razorpay = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID,
//       key_secret: process.env.RAZORPAY_SECRET,
//     });

//     try {
//       const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
//         amount: order.totalAmount * 100,
//       });
//       order.paymentStatus = "Refunded";
//       order.refundId = refund.id;
//     } catch (err) {
//       console.error("Refund failed:", err);
//       res.status(500);
//       throw new Error("Refund failed. Please contact support.");
//     }
//   } else {
//     order.paymentStatus = order.paymentType === "COD" ? "Pending" : "Refunded";
//   }

//   order.status = "Cancelled";

//   // ✅ Restock product variants
//   for (const item of order.products) {
//     const product = await Product.findById(item.product);
//     if (!product) continue;

//     const variant = product.variants.id(item.variantId);
//     if (variant) {
//       variant.stock += item.quantity;
//       await product.save();
//     }
//   }

//   await order.save();

//   // ✅ Send cancellation email
//   await sendEmail({
//     to: order.user.email,
//     subject: `Order #${order._id} Cancelled - Blossom Honey 🍯`,
//     html: `
//       <div style="font-family: Arial, sans-serif; background-color: #fff8e7; padding: 30px;">
//         <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px;">
//           <div style="background-color: #fbbf24; padding: 20px; text-align: center;">
//             <h2 style="color: #fff; margin: 0;">Order Cancelled 🍯</h2>
//           </div>
//           <div style="padding: 30px;">
//             <p>Hi <strong>${order.user.name}</strong>,</p>
//             <p>Your order <strong>#${
//               order._id
//             }</strong> has been successfully cancelled.</p>
//             <ul>
//               ${order.products
//                 .map(
//                   (item) =>
//                     `<li>${item.name} × ${item.quantity} – ₹${item.price}</li>`
//                 )
//                 .join("")}
//             </ul>
//             <p><strong>Refund:</strong> ₹${
//               order.paymentStatus === "Refunded" ? order.totalAmount : 0
//             }</p>
//             <p>Thanks for shopping with Blossom Honey!</p>
//           </div>
//         </div>
//       </div>
//     `,
//   });

//   res.json({ message: "Order cancelled successfully", order });
// });

// ✅ Cancel order (works for both user & admin)
const cancelOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { reason } = req.body || {};

  // Detect who canceled
  const userId = req.user?._id;
  const isAdmin = !!req.sellerId; // assuming adminAuth sets req.sellerId

  // 1️⃣ Fetch order + user
  const order = await Order.findById(orderId).populate("user");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // 2️⃣ If user, ensure they own the order
  if (!isAdmin && order.user._id.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Unauthorized to cancel this order");
  }

  // 3️⃣ Prevent cancellation of completed/returned orders
  if (["Delivered", "Cancelled", "Returned"].includes(order.status)) {
    res.status(400);
    throw new Error(
      `Order cannot be cancelled. Current status: ${order.status}`
    );
  }

  console.log("🚚 Order delivery info:", order.delivery.shipmentId);

  // 4️⃣ Cancel in Shiprocket (if exists)
  if (order.delivery?.shipmentId) {
    try {
      await shiprocket.cancelShiprocketOrder([order.delivery.shipmentId]);
      order.delivery.deliveryStatus = "Cancelled";
      console.log("✅ Shiprocket order cancelled");
    } catch (err) {
      console.error("⚠️ Shiprocket cancel failed:", err.message);
      // Continue locally even if Shiprocket fails
    }
  }

  // 5️⃣ Refund (only for online payments)
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
      order.paymentStatus = "RefundPending";
    }
  } else {
    order.paymentStatus = order.paymentType === "COD" ? "Pending" : "Refunded";
  }

  // 6️⃣ Restock products
  for (const item of order.products) {
    const product = await Product.findById(item.product);
    if (!product) continue;
    const variant = product.variants.id(item.variantId);
    if (variant) {
      variant.stock += item.quantity;
      await product.save();
    }
  }

  // 7️⃣ Update order status
  order.status = "Cancelled";
  order.cancellation = {
    cancelledBy: isAdmin ? "Admin" : "User",
    reason: reason || (isAdmin ? "Cancelled by Admin" : "Cancelled by User"),
    cancelledAt: new Date(),
  };

  await order.save();

  // 8️⃣ Send Email Notification
  const subject = isAdmin
    ? `Order #${order._id} Cancelled by Admin - Blossom Honey 🍯`
    : `Order #${order._id} Cancelled Successfully - Blossom Honey 🍯`;

  const message = isAdmin
    ? `<p>Your order <strong>#${order._id}</strong> has been cancelled by the admin.</p>`
    : `<p>Your order <strong>#${order._id}</strong> has been successfully cancelled.</p>`;

  await sendEmail({
    to: order.user.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #fff8e7; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px;">
          <div style="background-color: #f87171; padding: 20px; text-align: center;">
            <h2 style="color: #fff; margin: 0;">Order Cancelled 🍯</h2>
          </div>
          <div style="padding: 30px;">
            <p>Hi <strong>${order.user.name}</strong>,</p>
            ${message}
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
            <p>Thank you for shopping with Blossom Honey!</p>
          </div>
        </div>
      </div>
    `,
  });

  // 9️⃣ Response
  res.json({
    success: true,
    message: isAdmin
      ? "Order cancelled successfully by Admin"
      : "Order cancelled successfully",
    order,
  });
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

  // 1️⃣ Fetch order with user info
  const order = await Order.findById(orderId).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  console.log(`Updating order ${orderId} to status: ${status}`);
  order.status = status;

  // 2️⃣ If delivered → mark payment paid for COD
  if (status === "Delivered") {
    order.deliveredAt = deliveredAt || new Date();
    if (order.paymentType === "COD") order.paymentStatus = "Paid";
  }

  // 3️⃣ Handle shipment creation when marking as 'Shipped'
  if (status === "Shipped" && !order.delivery.partner) {
    const warehouse = await Warehouse.findOne();
    if (!warehouse) {
      res.status(400);
      throw new Error("No warehouse found for shipment");
    }

    await createShipmentWithShiprocket(order._id, warehouse._id);

    // try {
    //   console.log("🚚 Creating shipment on Shiprocket for order:", order._id);
    //   await createShipmentWithShiprocket(order._id, warehouse._id);

    //   // Re-fetch updated order (shipment info now saved)
    //   const updatedOrder = await Order.findById(order._id);
    //   console.log("✅ Shipment created:", updatedOrder.delivery);
    //   if (
    //     updatedOrder.delivery?.shipmentId &&
    //     !updatedOrder.delivery?.awbNumber
    //   ) {
    //     console.log(
    //       "📦 Assigning AWB for shipment:",
    //       updatedOrder.delivery.shipmentId
    //     );

    //     // ✅ Try to get best courier
    //     const bestCourier = await recommendCourier(
    //       order._id
    //     );
    //     console.log("🚚 Best Courier recommendation:", bestCourier);
    //     const selectedCourierId = bestCourier?.courier_company_id;

    //     if (!selectedCourierId) {
    //       console.warn("⚠️ No courier recommendation found from Shiprocket");
    //       throw new Error("No courier company available for assignment");
    //     }
    //     console.log("🚚 Selected courier ID:", selectedCourierId);
    //     console.log("selectedCourierId name ", bestCourier?.courier_name);
    //     // ✅ Try to assign AWB with safe payload
    //     // Using Delhivery as default courier
    //     const awbResponse = await assignAWB(
    //       updatedOrder.delivery.shipmentId,
    //       selectedCourierId
    //     );

    //     // ✅ Extract AWB + courier safely
    //     const awbNumber =
    //       awbResponse?.response?.data?.awb_code || awbResponse?.awb_code;
    //     const courierName =
    //       awbResponse?.response?.data?.courier_name ||
    //       awbResponse?.courier_name;

    //     if (!awbNumber) {
    //       console.error("🚫 AWB assignment failed — No AWB code returned");
    //       throw new Error("AWB assignment failed — missing AWB code");
    //     }

    //     updatedOrder.delivery.awbNumber = awbNumber;
    //     updatedOrder.delivery.courierName = courierName || "Unknown Courier";
    //     await updatedOrder.save();

    //     console.log(
    //       `✅ AWB assigned successfully: ${awbNumber} (${courierName})`
    //     );
    //   } else {
    //     console.log("ℹ️ AWB already assigned, skipping auto-assign step.");
    //   }
    // } catch (err) {
    //   console.error("🚨 Shiprocket Error:", err.response?.data || err.message);

    //   return res.status(500).json({
    //     success: false,
    //     message: "Failed to create shipment or assign AWB",
    //     error: err.response?.data || err.message,
    //   });
    // }
  }

  // 4️⃣ Save updated order (non-shiprocket flow)
  await order.save();

  // 5️⃣ Send email in separate try/catch to avoid blocking
  try {
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
    console.log(`📧 Email sent to ${order.user.email} for status: ${status}`);
  } catch (emailErr) {
    console.error("📧 Email sending failed:", emailErr.message);
  }

  // 6️⃣ Respond
  res.json({
    success: true,
    message: `Order updated to ${status} successfully`,
    order,
  });
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
