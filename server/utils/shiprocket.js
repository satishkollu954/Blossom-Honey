// server/utils/shiprocket.js
const axios = require("axios");
const Order = require("../Model/Order");
const Warehouse = require("../Model/Warehouse");
const Product = require("../Model/Product");

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

class Shiprocket {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.maxRetries = 3;
  }

  async retryRequest(fn, attempt = 1) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= this.maxRetries) throw err;
      const delay = 500 * attempt;
      console.warn(`⚠️ Retry attempt ${attempt} after ${delay}ms`);
      await new Promise((res) => setTimeout(res, delay));
      return this.retryRequest(fn, attempt + 1);
    }
  }

  async getShiprocketToken() {
    const now = new Date();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry)
      return this.token;

    console.log("Refreshing Shiprocket token...");
    return this.retryRequest(async () => {
      const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          email: SHIPROCKET_EMAIL,
          password: SHIPROCKET_PASSWORD,
        }
      );
      this.token = res.data.token;
      this.tokenExpiry = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      console.log("✅ Shiprocket token refreshed");
      return this.token;
    });
  }

  buildAddress(addr) {
    return `${addr.houseNo || ""}, ${addr.street || ""}, ${addr.city || ""}, ${
      addr.state || ""
    }, ${addr.postalCode || ""}`
      .replace(/,\s*,/g, ",")
      .replace(/^, |, $/g, "")
      .trim();
  }

  async createShipmentWithShiprocket(orderId, warehouseId) {
    const order = await Order.findById(orderId).populate("user").populate({
      path: "products.product",
      model: "Product",
      select: "name variants",
    });

    if (!order) throw new Error("Order not found");

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new Error("Warehouse not found");

    let totalPrice = 0;
    const orderItems = [];
    const productList = [];

    // ✅ Loop through order products
    for (const item of order.products) {
      const product = item.product;
      const variant = product?.variants?.find(
        (v) =>
          v.sku === item.sku || v._id.toString() === item.variantId?.toString()
      );

      const qty = item.quantity || 1;

      // ✅ Get variant dimensions
      const dimensions = variant?.dimensions || {
        length: 10,
        breadth: 10,
        height: 10,
      };

      const weightInKg = Number(variant?.weightInKg || 0.5);

      totalPrice += (variant?.finalPrice || item.price || 0) * qty;

      // ✅ Push for final calculation
      productList.push({
        length: dimensions.length,
        breadth: dimensions.breadth,
        height: dimensions.height,
        quantity: qty,
        weight: weightInKg,
      });

      orderItems.push({
        name: product?.name || "Product",
        sku: variant?.sku || item.sku || product?._id.toString(),
        units: qty,
        selling_price: variant?.finalPrice || item.price || 0,
      });
    }

    // ✅ Use your cube-based calculation for combined dimensions
    const { totalWeight, dimensions } = await this.calculatePackageDimensions(
      productList
    );

    // ✅ Safety fallback
    const length = dimensions.length || 10;
    const breadth = dimensions.breadth || 10;
    const height = dimensions.height || 10;

    // ✅ Calculate volumetric weight
    const volumetricWeight = (length * breadth * height) / 5000;
    const appliedWeight = Math.max(totalWeight, volumetricWeight);

    console.log("📦 Package Calculation:", {
      totalWeight,
      length,
      breadth,
      height,
      volumetricWeight,
      appliedWeight,
      totalPrice,
    });

    // ✅ Get Shiprocket token
    const token = await this.getShiprocketToken();
    const orderDate = new Date().toISOString().slice(0, 16).replace("T", " ");

    const shipmentData = {
      order_id: order._id.toString(),
      order_date: orderDate,
      pickup_location: warehouse.pickupLocationName,
      comment: "Order from Blossom Honey",

      billing_customer_name: order.user.name || "Customer",
      billing_last_name: "NA",
      billing_address: this.buildAddress(order.shippingAddress),
      billing_city: order.shippingAddress.city,
      billing_pincode: parseInt(order.shippingAddress.postalCode) || 0,
      billing_state: order.shippingAddress.state,
      billing_country: "India",
      billing_email: order.user.email,
      billing_phone: order.shippingAddress.phone?.toString() || "9999999999",

      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.paymentType === "COD" ? "COD" : "Prepaid",
      shipping_charges: order.shippingCharge || 0,
      sub_total: totalPrice,

      // ✅ Pass calculated weight and dimensions
      weight: totalWeight,
      length,
      breadth,
      height,
    };

    console.log("📦 Creating shipment payload:", shipmentData);

    // ✅ Create shipment on Shiprocket
    const data = await this.retryRequest(async () => {
      const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
        shipmentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    });

    console.log("✅ Shipment created successfully:", data);

    if (!data.shipment_id) {
      throw new Error("Failed to create shipment — no shipment_id returned");
    }

    // ✅ Update delivery info
    order.delivery = {
      partner: "Shiprocket",
      trackingId: data.shipment_id,
      awbNumber: data.awb_code || null,
      shipmentId: data.shipment_id,
      deliveryStatus: "Pickup Scheduled",
      pickupAddress: warehouse.address,
      deliveryAddress: this.buildAddress(order.shippingAddress),
      estimatedDeliveryDate: data.estimated_delivery_date,
    };

    await order.save();
    console.log("🚚 Order delivery updated:", order.delivery);

    return data;
  }

  async calculatePackageDimensions(products) {
    let totalWeight = 0;
    let maxLength = 0;
    let maxBreadth = 0;
    let totalHeight = 0;

    products.forEach((p) => {
      const {
        length = 10,
        breadth = 10,
        height = 10,
        quantity = 1,
        weight = 0.5,
      } = p;

      // ✅ Total weight increases with quantity
      totalWeight += weight * quantity;

      // ✅ Choose the largest base area (for multi-products)
      maxLength = Math.max(maxLength, length);
      maxBreadth = Math.max(maxBreadth, breadth);

      // ✅ Stack vertically (height adds up)
      totalHeight += height * quantity;
    });

    // ✅ Safety fallbacks
    if (maxLength <= 0) maxLength = 10;
    if (maxBreadth <= 0) maxBreadth = 10;
    if (totalHeight <= 0) totalHeight = 10;
    if (totalWeight <= 0) totalWeight = 0.5;

    return {
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      dimensions: {
        length: Math.round(maxLength),
        breadth: Math.round(maxBreadth),
        height: Math.round(totalHeight),
      },
    };
  }

  async cancelShiprocketOrder(orderIds) {
    if (!Array.isArray(orderIds)) orderIds = [orderIds]; // Ensure it's always an array

    const token = await this.getShiprocketToken();

    const data = {
      ids: orderIds,
    };

    try {
      const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/cancel",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Shiprocket order(s) cancelled:", res.data);
      return res.data;
    } catch (error) {
      console.error(
        "❌ Shiprocket cancellation failed:",
        error.response?.data || error.message
      );
      throw new Error("Shiprocket order cancellation failed");
    }
  }

  // ================== ASSIGN AWB ==================
  async assignAWB(shipmentId, courierId) {
    console.log(
      `📦 Assigning AWB for shipment ${shipmentId} with courier ${courierId}`
    );

    const token = await this.getShiprocketToken();

    // ✅ Validate required fields
    if (!shipmentId || !courierId) {
      throw new Error(
        "Missing required Shiprocket fields: shipment_id or courier_id"
      );
    }

    // ✅ Build the payload according to Shiprocket documentation
    const payload = {
      shipment_id: shipmentId,
      courier_id: courierId,
    };

    console.log("📦 Assign AWB Payload Sent to Shiprocket:", payload);

    try {
      const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ AWB assigned successfully:", res.data);
      return res.data;
    } catch (error) {
      const errData = error.response?.data || error.message;
      console.error("🚨 AWB assignment failed:", errData);
      throw new Error(
        typeof errData === "object" ? JSON.stringify(errData, null, 2) : errData
      );
    }
  }

  // ================== TRACK SHIPMENT ==================
  async trackShipment(shipmentId) {
    const token = await this.getShiprocketToken();

    const res = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("🚚 Tracking details:", res.data);
    return res.data;
  }
  // Add inside your Shiprocket class in shiprocket.js

  async recommendCourier(orderId) {
    const token = await this.getShiprocketToken();

    console.log(`🔍 Fetching courier recommendations for order ${orderId}...`);

    // ✅ Use order_id instead of shipment_id
    const res = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability?order_id=${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const available = res.data?.data?.available_courier_companies || [];

    if (available.length === 0) {
      throw new Error("No courier companies available for this shipment");
    }

    // ✅ Filter couriers: rating > 3.5 and rate > 0
    const filtered = available.filter(
      (c) => (c.rating || 0) > 3.5 && c.rate > 0
    );

    // ✅ If no courier has rating > 3.5, fallback to all
    const couriersToConsider = filtered.length > 0 ? filtered : available;

    // ✅ Sort by lowest rate (ascending)
    couriersToConsider.sort((a, b) => a.rate - b.rate);

    // ✅ Pick the best one (lowest cost + rating > 4 if available)
    const bestCourier = couriersToConsider[0];

    console.log("🚚 Best courier selected:");
    console.log({
      name: bestCourier.courier_name,
      rate: bestCourier.rate,
      rating: bestCourier.rating,
      courier_company_id: bestCourier.courier_company_id,
    });

    return bestCourier;
  }
}
const shiprocket = new Shiprocket();
module.exports = {
  createShipmentWithShiprocket:
    shiprocket.createShipmentWithShiprocket.bind(shiprocket),
  cancelShiprocketOrder: shiprocket.cancelShiprocketOrder.bind(shiprocket),
  assignAWB: shiprocket.assignAWB.bind(shiprocket),
  trackShipment: shiprocket.trackShipment.bind(shiprocket),
  recommendCourier: shiprocket.recommendCourier.bind(shiprocket),
};
