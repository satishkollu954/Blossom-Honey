// server/Routes/advertisementRoutes.js
const express = require("express");
const router = express.Router();
const {
  createAdvertisement,
  getAllAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
  getActiveAdvertisementsForUser,
} = require("../Controller/advertisementController");
const { protect, admin } = require("../Middleware/authMiddleware");
const multer = require("multer");

// Memory storage for direct buffer upload
const storage = multer.memoryStorage();
const { upload } = require("../Middleware/newmiddleware");

router.get("/active", getActiveAdvertisementsForUser);
// ✅ Routes
router.post(
  "/",
  protect,
  admin,
  upload.fields([{ name: "advertisementImages", maxCount: 10 }]),
  createAdvertisement
);
router.get("/", protect, admin, getAllAdvertisements);
router.get("/:id", protect, admin, getAdvertisementById);

// ✅ USER Route (public)

router.put(
  "/:id",
  protect,
  admin,
  upload.fields([{ name: "advertisementImages", maxCount: 10 }]),
  updateAdvertisement
);
router.delete("/:id", protect, admin, deleteAdvertisement);

module.exports = router;
