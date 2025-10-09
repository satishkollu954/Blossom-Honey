const express = require("express");
const router = express.Router();
const contactUsController = require("../Controller/ContactUs");

// 📌 Public Route - Create Message
router.post("/", contactUsController.createContactMessage);

// 📌 Admin Routes - Get All & Delete
router.get("/", contactUsController.getAllMessages);
router.delete("/:id", contactUsController.deleteMessage);

module.exports = router;
