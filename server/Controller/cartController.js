const asyncHandler = require("express-async-handler");
const Cart = require("../Model/Cart");
const Product = require("../Model/Product");
const Coupon = require("../Model/Coupon");
const Order = require("../Model/Order");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createShipmentWithShiprocket } = require("../utils/shiprocket");

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
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "items.variantId"
  );
  res.json(cart || { items: [] });
});

// --- Update Cart Item ---
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new Error("Cart not found");

  const item = cart.items.find(
    (i) =>
      i.product.toString() === productId && i.variantId.toString() === variantId
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

// --- Apply Coupon ---
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
  if (!coupon) throw new Error("Invalid coupon");
  if (coupon.expiryDate && coupon.expiryDate < new Date())
    throw new Error("Coupon expired");

  const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  if (subtotal < coupon.minPurchase)
    throw new Error(`Minimum purchase ₹${coupon.minPurchase} required`);

  let discount =
    coupon.discountType === "percentage"
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;

  cart.coupon = coupon._id;
  cart.discountAmount = discount;
  cart.totalAmount = subtotal - discount;
  await cart.save();

  res.json({ message: "Coupon applied", cart });
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
  const { address, paymentType } = req.body; // address = full address object

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  // Check stock
  for (const item of cart.items) {
    const variant = item.product.variants.id(item.variantId);
    if (!variant || variant.stock < item.quantity)
      throw new Error(`${item.product.name} variant out of stock`);
  }

  // Prepare order products
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

  // --- Create Order in DB first ---
  const order = new Order({
    user: userId,
    products: orderProducts,
    shippingAddress: address,
    totalAmount: cart.totalAmount,
    paymentType: paymentType || "Online",
    paymentStatus: paymentType === "COD" ? "Pending" : "Pending", // online: pending until verified
    coupon: cart.coupon,
    discountAmount: cart.discountAmount,
  });

  await order.save();

  // --- Decrease stock temporarily ---
  for (const item of cart.items) {
    const variant = item.product.variants.id(item.variantId);
    variant.stock -= item.quantity;
    await item.product.save();
  }

  // --- Clear cart ---
  cart.items = [];
  cart.coupon = null;
  cart.discountAmount = 0;
  cart.totalAmount = 0;
  await cart.save();

  if (paymentType === "COD") {
    // COD: order placed immediately
    order.paymentStatus = "Pending";
    order.status = "Placed";
    await order.save();
    order.delivery = {
      partner: "Shiprocket",
      pickupAddress: "Seller Warehouse Address",
      deliveryAddress: order.shippingAddress,
      deliveryStatus: "Pending",
    };
    await createShipmentWithShiprocket(order);
    return res.json({ message: "COD Order placed successfully", order });
  }

  // --- Online Payment: Create Razorpay Order ---
  const options = {
    amount: order.totalAmount * 100, // in paise
    currency: "INR",
    receipt: order._id.toString(),
    payment_capture: 1,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Send razorpay order details to frontend for payment
  res.json({
    message: "Order created, proceed to payment",
    orderId: order._id,
    razorpayOrder,
  });
});

// --- Verify Online Payment ---
const verifyOnlinePayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  // Validate signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    // On failure, restore stock
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
  order.status = "Placed"; // can keep processing/shipped flow
  await order.save();
  await createShipmentWithShiprocket(order);
  res.json({ message: "Payment successful, order placed", order });
});

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  syncGuestCart,
  checkout,
  verifyOnlinePayment,
};
