const asyncHandler = require("express-async-handler");
const Cart = require("../Model/Cart");
const Product = require("../Model/Product");
const Coupon = require("../Model/Coupon");
const Order = require("../Model/Order");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createShipmentWithShiprocket } = require("../utils/shiprocket");
const User = require("../Model/User");

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
  const { address, paymentType } = req.body;

  // Fetch user and get shipping address
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const shippingAddress = user.addresses.id(address);
  if (!shippingAddress) throw new Error("Address not found");

  // Fetch cart
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  // Check stock for each variant
  for (const item of cart.items) {
    const variant = item.product.variants.id(item.variantId);
    if (!variant || variant.stock < item.quantity)
      throw new Error(`${item.product.name} variant out of stock`);
  }

  // Prepare order items
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

  // Create order
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

  await order.save();

  // Decrease stock
  for (const item of cart.items) {
    const variant = item.product.variants.id(item.variantId);
    variant.stock -= item.quantity;
    await item.product.save();
  }

  // Handle COD order
  if (paymentType === "COD") {
    order.status = "Placed";
    order.paymentStatus = "Pending";
    order.delivery = {
      partner: "Shiprocket",
      pickupAddress: "Seller Warehouse Address",
      deliveryAddress: order.shippingAddress,
      deliveryStatus: "Pending",
    };

    // Calculate total weight & dimensions for shipment
    let totalWeight = 0;
    let dimensions = { length: 0, breadth: 0, height: 0 };
    for (const item of cart.items) {
      const variant = item.product.variants.id(item.variantId);
      const quantity = item.quantity;

      totalWeight += (variant.weight || 0.5) * quantity; // default 0.5kg

      // Use largest dimensions
      if (variant.length && variant.length > dimensions.length)
        dimensions.length = variant.length;
      if (variant.breadth && variant.breadth > dimensions.breadth)
        dimensions.breadth = variant.breadth;
      if (variant.height && variant.height > dimensions.height)
        dimensions.height = variant.height;
    }

    // await createShipmentWithShiprocket(order, { totalWeight, dimensions });
    await order.save();

    // Clear cart after order is created
    cart.items = [];
    cart.totalAmount = 0;
    cart.coupon = null;
    cart.discountAmount = 0;
    await cart.save();

    return res.json({ message: "COD Order placed successfully", order });
  }

  // Handle Online payment (Razorpay)
  const options = {
    amount: order.totalAmount * 100, // paise
    currency: "INR",
    receipt: order._id.toString(),
    payment_capture: 1,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Clear cart (optional: can wait until payment is verified)
  cart.items = [];
  cart.totalAmount = 0;
  cart.coupon = null;
  cart.discountAmount = 0;
  await cart.save();

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

  console.log("Verifying payment for order:", orderId);
  console.log("Razorpay Order ID:", razorpay_order_id);
  console.log("Razorpay Payment ID:", razorpay_payment_id);
  console.log("Razorpay Signature:", razorpay_signature);
  
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new Error("Cart not found");

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

  // --- Calculate total weight & max dimensions ---
  let totalWeight = 0;
  let dimensions = { length: 0, breadth: 0, height: 0 };

  cart.items.forEach((item) => {
    const variant = item.product.variants.id(item.variantId);
    const quantity = item.quantity;

    totalWeight += (variant.weight || 0.5) * quantity; // default 0.5kg if weight missing

    // For simplicity, use largest dimensions among variants
    if (variant.length && variant.length > dimensions.length)
      dimensions.length = variant.length;
    if (variant.breadth && variant.breadth > dimensions.breadth)
      dimensions.breadth = variant.breadth;
    if (variant.height && variant.height > dimensions.height)
      dimensions.height = variant.height;
  });

  //  await createShipmentWithShiprocket(order, { totalWeight, dimensions });
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
