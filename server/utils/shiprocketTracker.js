const cron = require("node-cron");
const axios = require("axios");
const Order = require("../Model/Order");

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
let TOKEN = null;

// 🔑 Get Auth Token
async function getShiprocketToken() {
  if (TOKEN) return TOKEN;
  const res = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    }
  );
  TOKEN = res.data.token;
  return TOKEN;
}

// 🚚 Update Delivery Status for Each Order
async function updateDeliveryStatus(order) {
  try {
    const token = await getShiprocketToken();

    const res = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${order.delivery.awbNumber}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const trackingData = res.data.tracking_data;

    if (trackingData && trackingData.shipment_status) {
      order.delivery.deliveryStatus = trackingData.shipment_status;
      await order.save();
      console.log(
        `✅ Updated order ${order._id} to ${trackingData.shipment_status}`
      );
    }
  } catch (error) {
    console.error(`❌ Error updating order ${order._id}:`, error.message);
  }
}

// ⏱️ Schedule CRON every 3 hours
function startDeliveryTrackingJob() {
  console.log("🚀 Starting delivery tracking cron job...");
  cron.schedule("0 */3 * * *", async () => {
    console.log("🚀 Running delivery status update job...");
    const orders = await Order.find({
      "delivery.partner": "Shiprocket",
      "delivery.deliveryStatus": { $ne: "Delivered" },
    });

    for (const order of orders) {
      if (order.delivery.awbNumber) {
        await updateDeliveryStatus(order);
      }
    }
  });
}

module.exports = { startDeliveryTrackingJob };
