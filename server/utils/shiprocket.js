const axios = require("axios");
const Order = require("../Model/Order");
const Warehouse = require("../Model/Warehouse");

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

class Shiprocket {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.maxRetries = 3;
  }

  // 🔄 Retry helper
  async retryRequest(fn, attempt = 1) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= this.maxRetries) throw err;
      const delay = 500 * attempt; // exponential backoff
      console.warn(`⚠️ Retry attempt ${attempt} after ${delay}ms`);
      await new Promise((res) => setTimeout(res, delay));
      return this.retryRequest(fn, attempt + 1);
    }
  }

  // ✅ Get or refresh token
  async getShiprocketToken() {
    const now = new Date();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry)
      return this.token;

    return this.retryRequest(async () => {
      const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        { email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }
      );
      this.token = res.data.token;
      this.tokenExpiry = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h
      console.log("✅ Shiprocket token refreshed");
      return this.token;
    });
  }

  // ✅ Build shipping address string
  buildAddress(addr) {
    return `${addr.houseNo || ""}, ${addr.street || ""}, ${addr.city || ""}, ${
      addr.state || ""
    }, ${addr.postalCode || ""}`
      .replace(/,\s*,/g, ",")
      .replace(/^, |, $/g, "")
      .trim();
  }

  // ✅ Create shipment with warehouse
  async createShipmentWithShiprocket(orderId, warehouseId, options = {}) {
    const order = await Order.findById(orderId).populate("user");
    if (!order) throw new Error("Order not found");

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new Error("Warehouse not found");

    const {
      totalWeight = 1,
      dimensions = { length: 10, breadth: 10, height: 10 },
    } = options;

    const token = await this.getShiprocketToken();

    const shipmentData = {
      order_id: order._id.toString(),
      order_date: new Date().toISOString(),
      pickup_location: warehouse.name,
      channel_id: "",
      billing_customer_name: order.user.name || "Customer",
      billing_last_name: "",
      billing_address: this.buildAddress(order.shippingAddress),
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.postalCode,
      billing_state: order.shippingAddress.state,
      billing_country: "India",
      billing_email: order.user.email,
      billing_phone: order.shippingAddress.phone || "9999999999",
      shipping_is_billing: true,
      order_items: order.products.map((p) => ({
        name: p.name,
        sku: p.product.toString(),
        units: p.quantity,
        selling_price: p.price,
      })),
      payment_method: order.paymentType === "COD" ? "COD" : "Prepaid",
      sub_total: order.totalAmount,
      weight: totalWeight,
      length: dimensions.length,
      breadth: dimensions.breadth,
      height: dimensions.height,

      // ✅ Pickup details from warehouse
      pickup_customer_name: warehouse.contact,
      pickup_email: "", // optional
      pickup_phone: warehouse.phone,
      pickup_address: warehouse.address,
      pickup_city: warehouse.city,
      pickup_state: warehouse.state,
      pickup_country: "India",
      pickup_pincode: warehouse.pincode,
      pickup_time: warehouse.pickupTime, // e.g., "10:00-18:00"
    };

    const data = await this.retryRequest(async () => {
      const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
        shipmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    });

    // Save tracking info in order
    order.delivery.partner = "Shiprocket";
    order.delivery.trackingId = data.shipment_id;
    order.delivery.awbNumber = data.awb_code;
    order.delivery.deliveryStatus = "Pickup Scheduled";
    order.delivery.pickupAddress = warehouse.address;
    order.delivery.deliveryAddress = this.buildAddress(order.shippingAddress);
    order.delivery.estimatedDeliveryDate = data.estimated_delivery_date;
    await order.save();

    return data;
  }
}

// Export instance
const shiprocket = new Shiprocket();
module.exports = {
  createShipmentWithShiprocket:
    shiprocket.createShipmentWithShiprocket.bind(shiprocket),
};
