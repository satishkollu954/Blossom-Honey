// server/models/Warehouse.js
const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    pickupTime: { type: String, required: true }, // e.g., "10:00-18:00"
    pickupLocationName: { type: String, required: true }, // must match Shiprocket dashboard

    // 🆔 Optional but helpful: store Shiprocket warehouse ID
    shiprocketWarehouseId: { type: String },

    // 🧭 Optional: mark a preferred/default warehouse
    isDefault: { type: Boolean, default: false },

    // 🚚 Optional: assign a preferred courier partner for AWB assignment
    preferredCourierId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Warehouse", warehouseSchema);
