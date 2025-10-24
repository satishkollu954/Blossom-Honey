//server/Controller/cartController.js
const asyncHandler = require("express-async-handler");
const Cart = require("../Model/Cart");
const Product = require("../Model/Product");
const Coupon = require("../Model/Coupon");
const Order = require("../Model/Order");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createShipmentWithShiprocket } = require("../utils/shiprocket");
const User = require("../Model/User");
const { markCouponUsed } = require("./couponController");
const sendEmail = require("../utils/sendEmail");

// --- Add to Cart ---
const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const variant = product.variants.id(variantId);
  if (!variant) throw new Error("Variant not found");
  if (variant.stock < quantity) throw new Error("Insufficient stock");

  let cart =
    (await Cart.findOne({ user: userId })) ||
    new Cart({ user: userId, items: [] });

  const existing = cart.items.find(
    (i) =>
      i.product.toString() === productId && i.variantId.toString() === variantId
  );

  if (existing) {
    existing.quantity += quantity;
    existing.subtotal = existing.price * existing.quantity;
  } else {
    cart.items.push({
      product: productId,
      variantId,
      quantity,
      weight: variant.weight,
      price: variant.finalPrice,
      weight: variant.weight,
      subtotal: variant.finalPrice * quantity,
    });
  }

  await cart.save();
  res.json({ message: "Added to cart", cart });
});

// --- Get Cart ---
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product")
    .lean();

  if (!cart || !cart.items.length) {
    return res.json({ items: [], totalAmount: 0 });
  }

  const itemsArray = cart.items.map((item) => {
    const variant = item.product?.variants?.find(
      (v) => v._id.toString() === item.variantId.toString()
    );

    return {
      _id: item._id,
      product: item.product
        ? {
            _id: item.product._id,
            name: item.product.name,
            images: item.product.images,
          }
        : null,
      variant: variant
        ? {
            _id: variant._id,
            weight: variant.weight,
            stock: variant.stock,
            price: variant.price,
            finalPrice: variant.finalPrice,
            type: variant.type,
            packaging: variant.packaging,
          }
        : null,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    };
  });

  res.json({ items: itemsArray, totalAmount: cart.totalAmount });
});

// --- Update Cart Item ---
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new Error("Cart not found");

  const item = cart.items.find(
    (i) =>
      i.product.toString() === productId.toString() &&
      i.variantId.toString() === variantId.toString()
  );
  if (!item) throw new Error("Item not found in cart");

  item.quantity = quantity;
  item.subtotal = item.price * quantity;
  await cart.save();

  res.json({ message: "Cart updated", cart });
});

// --- Remove Cart Item ---
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new Error("Cart not found");

  cart.items = cart.items.filter(
    (i) =>
      !(
        i.product.toString() === productId &&
        i.variantId.toString() === variantId
      )
  );

  await cart.save();
  res.json({ message: "Item removed", cart });
});

// --- Sync Guest Cart on Login ---
const syncGuestCart = asyncHandler(async (req, res) => {
  const { guestCartItems } = req.body;
  let cart =
    (await Cart.findOne({ user: req.user._id })) ||
    new Cart({ user: req.user._id, items: [] });

  for (const item of guestCartItems) {
    const product = await Product.findById(item.productId);
    if (!product) continue;
    const variant = product.variants.id(item.variantId);
    if (!variant || variant.stock <= 0) continue;

    const existing = cart.items.find(
      (i) =>
        i.product.toString() === item.productId &&
        i.variantId.toString() === item.variantId
    );

    if (existing) {
      existing.quantity += item.quantity;
      existing.subtotal = existing.price * existing.quantity;
    } else {
      cart.items.push({
        product: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: variant.finalPrice,
        subtotal: variant.finalPrice * item.quantity,
      });
    }
  }

  await cart.save();
  res.json({ message: "Cart synced", cart });
});

// --- Checkout Cart → Create Order ---

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// --- Checkout & Create Razorpay Order (Online) OR COD ---
const checkout = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { address, paymentType } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const shippingAddress = user.addresses.id(address);
  if (!shippingAddress) throw new Error("Address not found");

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  for (const item of cart.items) {
    const variant = item.product.variants.id(item.variantId);
    if (!variant || variant.stock < item.quantity)
      throw new Error(`${item.product.name} variant out of stock`);
  }

  const orderProducts = cart.items.map((item) => {
    const variant = item.product.variants.id(item.variantId);
    return {
      product: item.product._id,
      variantId: variant._id,
      name: item.product.name,
      variant: {
        weight: variant.weight,
        type: variant.type,
        packaging: variant.packaging,
      },
      price: item.price,
      quantity: item.quantity,
      images: variant.images,
    };
  });

  const order = new Order({
    user: userId,
    products: orderProducts,
    shippingAddress,
    totalAmount: cart.totalAmount,
    paymentType: paymentType || "Online",
    paymentStatus: "Pending",
    coupon: cart.coupon,
    discountAmount: cart.discountAmount,
  });

  if (paymentType === "COD") {
    order.status = "Placed";
    order.paymentStatus = "Pending";
    await order.save();

    // Decrease stock
    for (const item of cart.items) {
      const variant = item.product.variants.id(item.variantId);
      variant.stock -= item.quantity;
      await item.product.save();
    }
    

    // Clear cart
    cart.items = [];
    cart.totalAmount = 0;
    cart.coupon = null;
    cart.discountAmount = 0;
    await cart.save();

    // ---------------- SEND EMAILS ----------------
    const orderSummary = order.products
      .map(
        (item) => `<li>${item.name} × ${item.quantity} – ₹${item.price}</li>`
      )
      .join("");

    await sendEmail({
      to: user.email,
      subject: `Your Order #${order._id} Placed Successfully - Blossom Honey 🍯`,
      html: generateOrderEmail(
        user.name,
        order._id,
        order.products,
        order.totalAmount
      ),
    });

    // Admin email (simpler version)
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Placed #${order._id}`,
      html: generateAdminOrderEmail(user, order),
    });

    return res.json({ message: "COD Order placed successfully", order });
  }

  // For Online payment, just create order and proceed to payment
  await order.save();
  const options = {
    amount: order.totalAmount * 100,
    currency: "INR",
    receipt: order._id.toString(),
    payment_capture: 1,
  };
  const razorpayOrder = await razorpay.orders.create(options);

  res.json({
    message: "Order created, proceed to payment",
    orderId: order._id,
    razorpayOrder,
  });
});

const generateAdminOrderEmail = (user, order) => {
  const orderItems = order.products
    .map(
      (item) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          <img src="${
            item.images[0] || "https://via.placeholder.com/60"
          }" alt="${
        item.name
      }" width="60" style="border-radius:5px; object-fit:cover;" />
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee; font-family:Arial,sans-serif; font-size:14px; color:#555;">
          ${item.name} (${item.variant.weight || ""} ${
        item.variant.type || ""
      } ${item.variant.packaging || ""})
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee; font-family:Arial,sans-serif; font-size:14px; color:#555;">
          ${item.quantity} × ₹${item.price}
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee; font-family:Arial,sans-serif; font-size:14px; color:#555;">
          ₹${item.price * item.quantity}
        </td>
      </tr>
    `
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif; max-width:700px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#fbbf24; color:#fff; padding:20px; text-align:center;">
      <h1 style="margin:0; font-size:24px;">Blossom Honey Admin</h1>
      <p style="margin:5px 0 0; font-size:16px;">New Order Notification</p>
    </div>

    <!-- Body -->
    <div style="padding:20px; color:#555;">
      <p>Hi Admin,</p>
      <p>A new order <strong>#${
        order._id
      }</strong> has been placed by <strong>${user.name}</strong> (${
    user.email
  }).</p>

      <h3 style="margin-top:20px; color:#333; font-size:18px;">Customer Information</h3>
      <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:14px; color:#555;">
        <tr>
          <td style="padding:5px; font-weight:bold;">Name</td>
          <td style="padding:5px;">${user.name}</td>
        </tr>
        <tr>
          <td style="padding:5px; font-weight:bold;">Email</td>
          <td style="padding:5px;">${user.email}</td>
        </tr>
        <tr>
          <td style="padding:5px; font-weight:bold;">Phone</td>
          <td style="padding:5px;">${order.shippingAddress.phone}</td>
        </tr>
      </table>

      <h3 style="margin-top:20px; color:#333; font-size:18px;">Shipping Address</h3>
      <p style="margin:5px 0; font-size:14px; color:#555;">
        ${order.shippingAddress.fullName}<br/>
        ${order.shippingAddress.houseNo}, ${order.shippingAddress.street}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${
    order.shippingAddress.pincode
  }<br/>
        Phone: ${order.shippingAddress.phone}
      </p>

      <h3 style="margin-top:20px; color:#333; font-size:18px;">Order Summary</h3>
      <table style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:10px; text-align:left;">Product</th>
            <th style="padding:10px; text-align:left;">Details</th>
            <th style="padding:10px; text-align:left;">Qty</th>
            <th style="padding:10px; text-align:left;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${orderItems}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:10px; text-align:right; font-weight:bold;">Total Amount</td>
            <td style="padding:10px; font-weight:bold;">₹${
              order.totalAmount
            }</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:10px; text-align:right; font-weight:bold;">Payment Type</td>
            <td style="padding:10px; font-weight:bold;">${
              order.paymentType
            }</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:10px; text-align:right; font-weight:bold;">Payment Status</td>
            <td style="padding:10px; font-weight:bold;">${
              order.paymentStatus
            }</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin-top:20px; font-size:14px;">Please process the order promptly. You can view and manage this order in the admin panel.</p>

      <a href="http://localhost:5174" 
        style="display:inline-block; background:#fbbf24; color:#fff; text-decoration:none; padding:12px 20px; border-radius:6px; font-weight:bold; margin-top:10px;">
        View Order in Admin Panel
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9; padding:15px; text-align:center; font-size:12px; color:#999;">
      &copy; ${new Date().getFullYear()} Blossom Honey. All rights reserved.
    </div>
  </div>
  `;
};

const generateOrderEmail = (userName, orderId, orderProducts, totalAmount) => {
  const orderItems = orderProducts
    .map(
      (item) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          <img src="${
            item.images[0] || "https://via.placeholder.com/60"
          }" alt="${
        item.name
      }" width="60" style="border-radius:5px; object-fit:cover;" />
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee; font-family:Arial,sans-serif; font-size:14px; color:#555;">
          ${item.name} (${item.variant.weight || ""} ${
        item.variant.type || ""
      } ${item.variant.packaging || ""})
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee; font-family:Arial,sans-serif; font-size:14px; color:#555;">
          ${item.quantity} × ₹${item.price}
        </td>
        <td style="padding:10px; border-bottom:1px solid #eee; font-family:Arial,sans-serif; font-size:14px; color:#555;">
          ₹${item.price * item.quantity}
        </td>
      </tr>
    `
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#fbbf24; color:#fff; padding:20px; text-align:center;">
      <h1 style="margin:0; font-size:24px;">Blossom Honey 🍯</h1>
      <p style="margin:5px 0 0; font-size:16px;">Order Confirmation</p>
    </div>

    <!-- Body -->
    <div style="padding:20px; color:#555;">
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Thank you for your order! Your order <strong>#${orderId}</strong> has been placed successfully. We’re excited to get it to you soon.</p>

      <h3 style="margin-top:20px; color:#333; font-size:18px;">Order Summary</h3>
      <table style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:10px; text-align:left;">Product</th>
            <th style="padding:10px; text-align:left;">Details</th>
            <th style="padding:10px; text-align:left;">Qty</th>
            <th style="padding:10px; text-align:left;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${orderItems}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:10px; text-align:right; font-weight:bold;">Total</td>
            <td style="padding:10px; font-weight:bold;">₹${totalAmount}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin-top:20px;">You can track your order status in your account or contact us for any queries.</p>

    

      <p style="margin-top:30px; font-size:12px; color:#999;">If you did not place this order, please contact us immediately.</p>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9; padding:15px; text-align:center; font-size:12px; color:#999;">
      &copy; ${new Date().getFullYear()} Blossom Honey. All rights reserved.
    </div>
  </div>
  `;
};

// --- Verify Online Payment ---
const verifyOnlinePayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  const order = await Order.findById(orderId).populate("user");
  if (!order) throw new Error("Order not found");

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    // Restore stock on failure
    for (const item of order.products) {
      const product = await Product.findById(item.product);
      const variant = product.variants.id(item.variantId);
      variant.stock += item.quantity;
      await product.save();
    }
    res.status(400);
    throw new Error("Payment verification failed");
  }

  // Payment successful
  order.paymentStatus = "Paid";
  order.status = "Placed";
  order.razorpayPaymentId = razorpay_payment_id;
  await order.save();

  const user = order.user;

  const orderSummary = order.products
    .map((item) => `<li>${item.name} × ${item.quantity} – ₹${item.price}</li>`)
    .join("");

  // User email
  await sendEmail({
    to: user.email,
    subject: `Your Order #${order._id} Placed Successfully - Blossom Honey 🍯`,
    html: generateOrderEmail(
      user.name,
      order._id,
      order.products,
      order.totalAmount
    ),
  });

  // Admin email (simpler version)
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `New Order Placed #${order._id}`,
    html: generateAdminOrderEmail(user, order),
  });

  res.json({ message: "Payment successful, order placed", order });
});

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,

  syncGuestCart,
  checkout,
  verifyOnlinePayment,
};
