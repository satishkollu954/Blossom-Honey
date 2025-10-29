// server/Controller/advertisementController.js
const asyncHandler = require("express-async-handler");
const Advertisement = require("../Model/Advertisement");
const { createUploader } = require("../Middleware/uploadMiddleware"); // your reusable uploader

// --- CREATE Advertisement ---
const createAdvertisement = asyncHandler(async (req, res) => {
  const { title, description, link, position, startDate, endDate } = req.body;
  const userId = req.user?._id;

  if (!title) {
    res.status(400);
    throw new Error("Title is required");
  }

  const advertisement = new Advertisement({
    title,
    description,
    link,
    position,
    startDate,
    endDate,
    createdBy: userId,
  });

  const savedAd = await advertisement.save();
  const adId = savedAd._id.toString();

  // --- Upload images to Cloud (same as Product upload logic) ---
  const uploadedImages = [];
  if (
    req.files?.advertisementImages &&
    req.files.advertisementImages.length > 0
  ) {
    for (const file of req.files.advertisementImages) {
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/advertisements/${adId}`,
        file.originalname.split(".")[0] + "-" + Date.now()
      );
      uploadedImages.push(url);
    }
  }

  savedAd.images = uploadedImages;
  await savedAd.save();

  res.status(201).json({
    message: "Advertisement created successfully",
    advertisement: savedAd,
  });
});

// --- GET All Advertisements ---
const getAllAdvertisements = asyncHandler(async (req, res) => {
  const { activeOnly, position } = req.query;
  const filter = {};

  if (activeOnly === "true") filter.isActive = true;
  if (position) filter.position = position;

  const ads = await Advertisement.find(filter).sort({ createdAt: -1 });
  res.json(ads);
});

// --- GET Advertisement by ID ---
const getAdvertisementById = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) {
    res.status(404);
    throw new Error("Advertisement not found");
  }
  res.json(ad);
});

// --- GET Active Advertisements for Users ---
const getActiveAdvertisementsForUser = asyncHandler(async (req, res) => {
  const { position } = req.query;
  //console.log("Position query param:", position);
  // optional filter: homepage, banner, etc.
  const today = new Date();

  const filter = {
    isActive: true,
    $or: [
      { startDate: { $lte: today }, endDate: { $gte: today } }, // between start and end
      { startDate: { $exists: false } }, // no start date
      { endDate: { $exists: false } }, // no end date
    ],
  };

  if (position) filter.position = position;

  const ads = await Advertisement.find(filter)
    .sort({ createdAt: -1 })
    .select("title description images link position");
  // console.log("Fetched advertisements:", ads);
  res.status(200).json(ads);
});

// --- UPDATE Advertisement ---
const updateAdvertisement = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) {
    res.status(404);
    throw new Error("Advertisement not found");
  }

  const { title, description, link, position, startDate, endDate, isActive } =
    req.body;

  ad.title = title || ad.title;
  ad.description = description || ad.description;
  ad.link = link || ad.link;
  ad.position = position || ad.position;
  ad.startDate = startDate || ad.startDate;
  ad.endDate = endDate || ad.endDate;
  if (isActive !== undefined) ad.isActive = isActive;

  // --- Upload new images if any ---
  if (
    req.files?.advertisementImages &&
    req.files.advertisementImages.length > 0
  ) {
    const uploadedImages = [];
    for (const file of req.files.advertisementImages) {
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/advertisements/${ad._id}`,
        file.originalname.split(".")[0] + "-" + Date.now()
      );
      uploadedImages.push(url);
    }
    ad.images.push(...uploadedImages); // append new ones
  }

  await ad.save();
  res.json({
    message: "Advertisement updated successfully",
    advertisement: ad,
  });
});

// --- DELETE Advertisement ---
const deleteAdvertisement = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) {
    res.status(404);
    throw new Error("Advertisement not found");
  }

  await ad.deleteOne();
  res.json({ message: "Advertisement deleted successfully" });
});

module.exports = {
  createAdvertisement,
  getAllAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
  getActiveAdvertisementsForUser,
};
