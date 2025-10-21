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
      subject: "Thank You for Contacting Blossomhoney",
      html: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #f59e0b;">Hello ${name},</h2>
      <p>Thank you for reaching out to <strong>Blossomhoney</strong>. We have successfully received your message and our support team will get back to you as soon as possible.</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      
      <p><strong>Your message:</strong></p>
      <blockquote style="background: #f9f9f9; border-left: 4px solid #f59e0b; padding: 10px; margin: 0;">
        ${message}
      </blockquote>

      <p>If your inquiry is urgent, please reply to this email or contact us at <a href="mailto:support@Bloosomhoney.com">support@Bloosomhoney.com</a>.</p>

      <p>Best regards,<br>
      <strong>Bloosomhoney Team</strong></p>

      <footer style="font-size: 12px; color: #999; margin-top: 20px;">
        Blossomhoney | Your health, our priority.<br>
        www.Blossomhoney.com
      </footer>
    </div>
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
