//utils/razorpayRefund
const razorpay = require("../config/razorpay");
const Payment = require("../Models/Payment");
const Order = require("../Models/Order");
const sendEmail = require("./sendEmail");

/**
 * Refund a payment via Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount in rupees (₹)
 * @returns {Promise<Object>} - Razorpay refund response
 */
const refundViaRazorpay = async (paymentId, amount) => {
  try {
    const refundAmount = amount * 100; // convert ₹ to paise

    // Step 1: Create refund via Razorpay
    const refund = await razorpay.payments.refund(paymentId, {
      amount: refundAmount,
      speed: "normal",
      notes: {
        reason: "Return pickup confirmed",
      },
    });

    console.log("Refund successful:", refund);

    // Step 2: Update payment record in DB
    const paymentDoc = await Payment.findOne({
      razorpay_payment_id: paymentId,
    });
    if (!paymentDoc) {
      console.warn("⚠️ Payment record not found for:", paymentId);
      return refund;
    }

    paymentDoc.status = "Refunded";
    paymentDoc.refunds.push({
      refundId: refund.id,
      amount,
      status: refund.status,
      createdAt: new Date(),
      reason: "Product return confirmed",
    });
    await paymentDoc.save();

    // Step 3: Get order + user info for email
    const order = await Order.findOne({ payment: paymentDoc._id }).populate(
      "user products.product"
    );
    if (!order) {
      console.warn("⚠️ Order not found for payment ID:", paymentId);
      return refund;
    }

    const orderId = order._id.toString().slice(-6).toUpperCase(); // last 6 chars
    const productNames = order.products.map((p) => p.product.name).join(", ");

    // Step 4: Send email to User
    await sendEmail(
      order.user.email,
      "🎉 Your Refund Has Been Successfully Processed",
      `
  <div style="max-width:600px;margin:0 auto;padding:20px;font-family:'Segoe UI',Arial,sans-serif;background-color:#f4f7fb;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#28a745,#34ce57);padding:25px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:24px;">Refund Completed</h1>
        <p style="margin:5px 0 0;font-size:14px;">Your money is on its way back to you 💰</p>
      </div>

      <!-- Body -->
      <div style="padding:25px;color:#333;">
        <p>Hi <strong>${order.user.name}</strong>,</p>
        <p>We’re happy to let you know that your refund has been successfully processed for the following order:</p>
        
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;"><strong>Order ID:</strong></td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${
              order._id
            }</td>
          </tr>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;"><strong>Refund Amount:</strong></td>
            <td style="padding:8px;border-bottom:1px solid #eee;">₹${
              order.totalAmount
            }</td>
          </tr>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;"><strong>Payment Mode:</strong></td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${
              order.paymentType
            }</td>
          </tr>
          <tr>
            <td style="padding:8px;"><strong>Products:</strong></td>
            <td style="padding:8px;">${productNames}</td>
          </tr>
        </table>

        <p><em>💡 Note: It may take 3–5 business days for the refund to reflect in your account, depending on your bank or card issuer.</em></p>
        
        <div style="text-align:center;margin:30px 0;">
          <a href="https://yourwebsite.com/orders/${
            order._id
          }" style="background:#28a745;color:#fff;text-decoration:none;padding:12px 25px;border-radius:6px;font-size:16px;">View My Order</a>
        </div>

        <p>Thanks again for shopping with us. If you have any questions, just reply to this email—we’re happy to help.</p>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:12px;color:#888;margin-top:20px;">
      © ${new Date().getFullYear()} Your Store Name. This is an automated message, please do not reply directly.
    </p>
  </div>
  `
    );

    // Step 5: Notify Admin
    await sendEmail({
      to: "admin@example.com", // replace with process.env.ADMIN_EMAIL
      subject: `🔔 Refund Processed – Order #${orderId}`,
      html: `
  <div style="max-width:600px;margin:0 auto;padding:20px;font-family:'Segoe UI',Arial,sans-serif;background-color:#f9f9f9;">
    <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #eee;">
      <h2 style="color:#28a745;margin-top:0;">Refund Notification</h2>
      <p>A refund has just been processed via <strong>Razorpay</strong>.</p>
      
      <table style="width:100%;border-collapse:collapse;margin:15px 0;">
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;"><strong>User:</strong></td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${
            order.user.name
          } (${order.user.email})</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;"><strong>Order ID:</strong></td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${orderId}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;"><strong>Refunded Amount:</strong></td>
          <td style="padding:8px;border-bottom:1px solid #eee;">₹${amount}</td>
        </tr>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;"><strong>Refund ID:</strong></td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${
            refund.id
          }</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>Status:</strong></td>
          <td style="padding:8px;">${refund.status}</td>
        </tr>
      </table>
      
      <p><strong>Products:</strong> ${productNames}</p>
    </div>
    <p style="text-align:center;font-size:12px;color:#999;margin-top:20px;">
      System generated notification – ${new Date().toLocaleString()}
    </p>
  </div>
  `,
    });

    return refund;
  } catch (err) {
    console.error("❌ Refund failed:", err);
    throw new Error("Refund via Razorpay failed");
  }
};

module.exports = { refundViaRazorpay };
