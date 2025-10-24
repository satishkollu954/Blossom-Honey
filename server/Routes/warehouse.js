// server/routes/warehouse.js
const express = require("express");
const router = express.Router();
const Warehouse = require("../Model/Warehouse");

// Add Warehouse
router.post("/", async (req, res) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();
    res.json({ message: "Warehouse created successfully", warehouse });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Update warehouse by ID
router.put("/:id", async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!warehouse)
      return res.status(404).json({ error: "Warehouse not found" });

    res.json({ message: "Warehouse updated successfully", warehouse });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Delete warehouse by ID
router.delete("/:id", async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse)
      return res.status(404).json({ error: "Warehouse not found" });

    res.json({ message: "Warehouse deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List all warehouses
router.get("/", async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.json(warehouses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
