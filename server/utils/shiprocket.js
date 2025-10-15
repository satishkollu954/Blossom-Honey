const axios = require("axios");

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let TOKEN = null;

// ✅ Get Auth Token
async function getShiprocketToken() {
  if (TOKEN) return TOKEN;

  const res = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
    email: SHIPROCKET_EMAIL,
    password: SHIPROCKET_PASSWORD,
  });

  TOKEN = res.data.token;
  return TOKEN;
}

// ✅ Create Shipment
async function createShipmentWithShiprocket(order) {
  const token = await getShiprocketToken();

  const shipmentData = {
    order_id: order._id.toString(),
    order_date: new Date().toISOString(),
    pickup_location: "Main Warehouse",
    channel_id: "",
    billing_customer_name: order.user.name || "Customer",
    billing_last_name: "",
    billing_address: order.shippingAddress.address,
    billing_city: order.shippingAddress.city,
    billing_pincode: order.shippingAddress.pincode,
    billing_state: order.shippingAddress.state,
    billing_country: "India",
    billing_email: order.user.email,
    billing_phone: order.user.phone || "9999999999",
    shipping_is_billing: true,
    order_items: order.products.map((p) => ({
      name: p.name,
      sku: p.product.toString(),
      units: p.quantity,
      selling_price: p.price,
    })),
    payment_method: order.paymentType === "COD" ? "COD" : "Prepaid",
    sub_total: order.totalAmount,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 1,
  };

  const response = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    shipmentData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = response.data;

  // Save tracking details
  order.delivery.partner = "Shiprocket";
  order.delivery.trackingId = data.shipment_id;
  order.delivery.awbNumber = data.awb_code;
  order.delivery.deliveryStatus = "Pickup Scheduled";
  order.delivery.estimatedDeliveryDate = data.estimated_delivery_date;
  await order.save();

  return data;
}

module.exports = { createShipmentWithShiprocket };
