const asyncHandler = require("express-async-handler");
const Cart = require("../Model/Cart");
const Product = require("../Model/Product");
const Order = require("../Model/Order");
const User = require("../Model/User");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// ✅ Razorpay initialization
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ======================================================
// ADD TO CART
// ======================================================
const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const userId = req.user._id;

  if (!productId || !variantId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Invalid product or quantity");
  }

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const variant = product.variants.id(variantId);
  if (!variant) throw new Error("Variant not found");
  if (variant.stock < quantity) throw new Error("Insufficient stock");

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [], totalAmount: 0 });
  }

  const existing = cart.items.find(
    (i) =>
      i.product.toString() === productId && i.variantId.toString() === variantId
  );

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > variant.stock) {
      throw new Error("Exceeds available stock");
    }
    existing.quantity = newQty;
    existing.subtotal = existing.price * newQty;
  } else {
    cart.items.push({
      product: productId,
      variantId,
      quantity,
      weight: variant.weight,
      price: variant.finalPrice,
      subtotal: variant.finalPrice * quantity,
    });
  }

  // ✅ Recalculate total
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.subtotal, 0);

  await cart.save();
  res.json({ message: "Item added to cart", cart });
});

// ======================================================
// GET CART
// ======================================================
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

// ======================================================
// UPDATE CART ITEM
// ======================================================
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;

  if (!productId || !variantId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Invalid input");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new Error("Cart not found");

  const item = cart.items.find(
    (i) =>
      i.product.toString() === productId.toString() &&
      i.variantId.toString() === variantId.toString()
  );
  if (!item) throw new Error("Item not found in cart");

  const product = await Product.findById(productId);
  const variant = product.variants.id(variantId);
  if (!variant || variant.stock < quantity) {
    throw new Error("Insufficient stock");
  }

  item.quantity = quantity;
  item.subtotal = item.price * quantity;
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.subtotal, 0);

  await cart.save();
  res.json({ message: "Cart updated", cart });
});

// ======================================================
// REMOVE CART ITEM
// ======================================================
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

  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.subtotal, 0);
  await cart.save();

  res.json({ message: "Item removed", cart });
});

// ======================================================
// CHECKOUT (COD or Online Payment)
// ======================================================
const checkout = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { address, paymentType } = req.body;

  if (!address || !paymentType) {
    res.status(400);
    throw new Error("Missing address or payment type");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const shippingAddress = user.addresses.id(address);
  if (!shippingAddress) throw new Error("Address not found");

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  // ✅ Check stock
  for (const item of cart.items) {
    const variant = item.product.variants.id(item.variantId);
    if (!variant || variant.stock < item.quantity) {
      throw new Error(`${item.product.name} variant out of stock`);
    }
  }

  // ✅ Prepare order structure
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

  // ✅ Calculate shipping charge based on min purchase
  const MIN_PURCHASE_AMOUNT = Number(process.env.MIN_PURCHASE_AMOUNT) || 0;
  let shippingCharge = 0;

  if (cart.totalAmount < MIN_PURCHASE_AMOUNT) {
    shippingCharge = 50; // Apply ₹50 shipping charge
  }

  // ✅ Final total amount including shipping
  const finalAmount = cart.totalAmount + shippingCharge;

  const order = new Order({
    user: userId,
    products: orderProducts,
    shippingAddress,
    totalAmount: finalAmount,
    paymentType: paymentType,
    paymentStatus: "Pending",
    coupon: cart.coupon || null,
    discountAmount: cart.discountAmount || 0,
    shippingCharge: shippingCharge,
  });

  // ---- COD ----
  if (paymentType === "COD") {
    order.status = "Placed";
    order.paymentStatus = "Pending";
    await order.save();

    // ✅ Decrease stock safely
    for (const item of cart.items) {
      const variant = item.product.variants.id(item.variantId);
      variant.stock -= item.quantity;
      await item.product.save();
    }

    // ✅ Clear cart
    cart.items = [];
    cart.totalAmount = 0;
    cart.coupon = null;
    cart.discountAmount = 0;
    await cart.save();

    // ✅ Send confirmation email
    await sendEmail({
      to: user.email,
      subject: `Order #${order._id} Placed Successfully - Blossom Honey 🍯`,
      html: `<p>Hi ${user.name}, your COD order <b>#${order._id}</b> has been placed successfully!</p>`,
    });

    return res.json({ message: "COD Order placed successfully", order });
  }

  // ---- Online Payment ----
  await order.save();
  const options = {
    amount: Math.round(order.totalAmount * 100), // in paise
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

// ======================================================
// VERIFY ONLINE PAYMENT
// ======================================================
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
    res.status(400);
    throw new Error("Payment verification failed");
  }

  // ✅ Update payment + stock
  order.paymentStatus = "Paid";
  order.status = "Placed";
  order.razorpayPaymentId = razorpay_payment_id;
  await order.save();

  for (const item of order.products) {
    const product = await Product.findById(item.product);
    const variant = product.variants.id(item.variantId);
    if (variant) {
      variant.stock -= item.quantity;
      await product.save();
    }
  }

  // ✅ Clear cart
  await Cart.findOneAndUpdate(
    { user: order.user._id },
    { $set: { items: [], totalAmount: 0, coupon: null, discountAmount: 0 } }
  );

  // ✅ Send confirmation email
  await sendEmail({
    to: order.user.email,
    subject: `Payment Successful - Order #${order._id}`,
    html: `<p>Hi ${order.user.name}, your payment was successful and your order <b>#${order._id}</b> has been placed!</p>`,
  });

  res.json({ message: "Payment verified successfully", order });
});

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  checkout,
  verifyOnlinePayment,
};
