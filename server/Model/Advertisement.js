// server/Model/Advertisement.js
const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    images: [String], // Cloud URLs
    link: { type: String, trim: true }, // optional redirect link (e.g., product, offer)
    position: {
      type: String,
      enum: ["homepage", "sidebar", "banner", "popup", "footer", "navbar"],
      default: "homepage",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin/seller
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advertisement", advertisementSchema);
