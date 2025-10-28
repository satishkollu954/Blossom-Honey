// server/utils/shiprocketTracker.js
const cron = require("node-cron");
const axios = require("axios");
const Order = require("../Model/Order");

class ShiprocketTracker {
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
      const delay = 500 * attempt;
      console.warn(`⚠️ Retry attempt ${attempt} after ${delay}ms`);
      await new Promise(res => setTimeout(res, delay));
      return this.retryRequest(fn, attempt + 1);
    }
  }

  // 🔑 Get or refresh Shiprocket token
  async getShiprocketToken() {
    const now = new Date();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry) return this.token;

    return this.retryRequest(async () => {
      const res = await axios.post(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        { email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }
      );
      this.token = res.data.token;
      this.tokenExpiry = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      console.log("✅ Shiprocket token refreshed");
      return this.token;
    });
  }

  // 🚚 Update delivery status for a single order
  async updateDeliveryStatus(order) {
    if (!order.delivery.awbNumber) return;

    try {
      const token = await this.getShiprocketToken();
      const trackingData = await this.retryRequest(async () => {
        const res = await axios.get(
          `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${order.delivery.awbNumber}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data.tracking_data;
      });

      if (trackingData && trackingData.shipment_status) {
        const prevStatus = order.delivery.deliveryStatus;
        order.delivery.deliveryStatus = trackingData.shipment_status;

        if (trackingData.shipment_status === "Delivered" && order.status !== "Delivered") {
          order.status = "Delivered";
          order.deliveredAt = new Date();
        }

        await order.save();
        console.log(`✅ Order ${order._id}: ${prevStatus} → ${trackingData.shipment_status}`);
      }
    } catch (err) {
      console.error(`❌ Error updating order ${order._id}:`, err.message);
    }
  }

  // ⏱️ Cron job: run every 3 hours
  startDeliveryTrackingJob() {
    console.log("🚀 Starting Shiprocket delivery tracking cron job...");
    cron.schedule("0 */3 * * *", async () => {
      console.log("🚀 Running delivery status update job...");
      try {
        const orders = await Order.find({
          "delivery.partner": "Shiprocket",
          "delivery.deliveryStatus": { $ne: "Delivered" },
          "delivery.awbNumber": { $exists: true, $ne: "" },
        });

        if (!orders.length) {
          console.log("ℹ️ No orders to update at this time.");
          return;
        }

        const limit = 5;
        for (let i = 0; i < orders.length; i += limit) {
          await Promise.all(orders.slice(i, i + limit).map(o => this.updateDeliveryStatus(o)));
        }

        console.log("✅ Delivery status update job completed.");
      } catch (err) {
        console.error("❌ Cron job error:", err.message);
      }
    });
  }

  // 🌐 Webhook handler
  async handleShiprocketWebhook(req, res) {
    try {
      const { awb, status, shipment_id, shipment_status } = req.body;
      if (!awb || !status) return res.status(400).json({ message: "Invalid webhook data" });

      const order = await Order.findOne({ "delivery.awbNumber": awb });
      if (!order) return res.status(404).json({ message: "Order not found" });

      const prevStatus = order.delivery.deliveryStatus;
      order.delivery.deliveryStatus = status || shipment_status || prevStatus;

      if (order.delivery.deliveryStatus === "Delivered" && order.status !== "Delivered") {
        order.status = "Delivered";
        order.deliveredAt = new Date();
      }

      await order.save();
      console.log(`🌐 Webhook: Order ${order._id} updated: ${prevStatus} → ${order.delivery.deliveryStatus}`);

      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (err) {
      console.error("❌ Webhook error:", err.message);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

// Export instance
const tracker = new ShiprocketTracker();
module.exports = {
  startDeliveryTrackingJob: tracker.startDeliveryTrackingJob.bind(tracker),
  handleShiprocketWebhook: tracker.handleShiprocketWebhook.bind(tracker),
};
