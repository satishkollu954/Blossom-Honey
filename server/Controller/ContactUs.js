const ContactUs = require("../Model/ContactUs");
const sendEmail = require("../utils/sendEmail");

// 📌 Create Contact Message
exports.createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    console.log(req.body);
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Save message to DB
    const newMessage = await ContactUs.create({
      name,
      email,
      subject,
      message,
    });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "Thank You for Contacting FitFusion",
      html: `
        <h3>Hi ${name},</h3>
        <p>Thank you for getting in touch with us. We have received your message and our team will respond shortly.</p>
        <p><strong>Your message:</strong></p>
        <blockquote>${message}</blockquote>
        <p>Best regards,<br>FitFusion Team</p>
      `,
    });

    res.status(201).json({
      message:
        "Your message has been received and a confirmation email has been sent!",
      data: newMessage,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to send message", error: err.message });
  }
};

// 📌 Get All Messages (Admin Only)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ContactUs.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch messages", error: err.message });
  }
};

// 📌 Delete a Message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ContactUs.findById(id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await ContactUs.findByIdAndDelete(id);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete message", error: err.message });
  }
};
