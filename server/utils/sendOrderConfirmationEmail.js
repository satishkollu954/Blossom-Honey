const nodemailer = require("nodemailer");
require("dotenv").config();
const sendOrderConfirmationEmail = async (to, orderDetails) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.raagvitech.com", // or your actual SMTP server
    port: 587, // or 465 for SSL
    secure: false, // true for port 465
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const html = `
    <h2>Order Confirmation</h2>
    <p>Thank you for your order!</p>
    <p><strong>Order ID:</strong> ${orderDetails._id}</p>
    <p><strong>Amount:</strong> ₹${orderDetails.totalAmount}</p>
    <p><strong>Status:</strong> ${orderDetails.orderStatus}</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Order Confirmation",
    html,
  });
};

module.exports = sendOrderConfirmationEmail;
