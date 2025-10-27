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
    if (this.token && this.tokenExpiry && now < this.tokenExpiry) return this.token;

    console.log("Refreshing Shiprocket token...");
    return this.retryRequest(async () => {
      const res = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD,
      });
      this.token = res.data.token;
      this.tokenExpiry = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      console.log("✅ Shiprocket token refreshed");
      return this.token;
    });
  }

  buildAddress(addr) {
    return `${addr.houseNo || ""}, ${addr.street || ""}, ${addr.city || ""}, ${addr.state || ""}, ${
      addr.postalCode || ""
    }`
      .replace(/,\s*,/g, ",")
      .replace(/^, |, $/g, "")
      .trim();
  }

  async createShipmentWithShiprocket(orderId, warehouseId) {
    const order = await Order.findById(orderId).populate("user");
    if (!order) throw new Error("Order not found");

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new Error("Warehouse not found");

    // ✅ Calculate total weight and largest box dimensions
    let totalWeight = 0;
    let maxLength = 0, maxBreadth = 0, maxHeight = 0;

    const orderItems = order.products.map((item) => {
      totalWeight += (item.weightInKg || 0.5) * item.quantity;
      maxLength = Math.max(maxLength, item.dimensions?.length || 10);
      maxBreadth = Math.max(maxBreadth, item.dimensions?.breadth || 10);
      maxHeight = Math.max(maxHeight, item.dimensions?.height || 10);

      return {
        name: item.name,
        sku: item.sku || item.product.toString(),
        units: item.quantity,
        selling_price: item.price,
      };
    });

  if(totalWeight <= 0) totalWeight = 0.5; // minimum 500g
    const dimensions = {
      length: maxLength || 10,
      breadth: maxBreadth || 10,
      height: maxHeight || 10,
    };
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
      sub_total: order.totalAmount,
      weight: totalWeight,
      length: dimensions.length,
      breadth: dimensions.breadth,
      height: dimensions.height,
    };
    console.log("Creating shipment with data:", shipmentData);
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
    console.log("✅ Shipment created:", data);
    // ✅ Save delivery info to order
    order.delivery = {
      partner: "Shiprocket",
      trackingId: data.shipment_id,
      awbNumber: data.awb_code,
      shipmentId: data.shipment_id,
      deliveryStatus: "Pickup Scheduled",
      pickupAddress: warehouse.address,
      deliveryAddress: this.buildAddress(order.shippingAddress),
      estimatedDeliveryDate: data.estimated_delivery_date,
    };
   await order.save();
    return data;
  }
}
const shiprocket = new Shiprocket();
module.exports = {
  createShipmentWithShiprocket: shiprocket.createShipmentWithShiprocket.bind(shiprocket),
};
