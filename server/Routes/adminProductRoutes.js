// server/Routes/adminProductRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../Model/Product"); // Assuming your model is here
// Assuming these are your controller functions
const {
  createProduct,
  updateProduct,
  deleteProduct,
  approveProduct,
  getAllProductsAdminView,
  updateVariants,
  deleteVariant,
  addVariant
} = require("../Controller/productController");
// Assuming these middleware functions exist
const { protect, seller, admin } = require("../Middleware/authMiddleware");

//const productUploader = createUploader("products"); // Use the 'products' subfolder
const { upload } = require("../Middleware/newmiddleware");

// @desc    Get all products (including unapproved) - For Admin/Seller Dashboard
// @route   GET /api/products/admin
// @access  Private/Seller/Admin
router.get("/", protect, seller, getAllProductsAdminView);

// @desc    Create a new product
// @route   POST /api/products/admin
// @access  Private/Seller
// Note: 'productImages' is the field name for the file upload in the request body
router.post(
  "/",
  protect,
  seller,
  upload.fields([
    { name: "productImages", maxCount: 10 },
    { name: "variantImages", maxCount: 20 },
  ]),
  createProduct
);

// @desc    Update an existing product
// @route   PUT /api/products/admin/:id
// @access  Private/Seller
router.put(
  "/:id",
  protect,
  seller,
  upload.fields([
    { name: "productImages", maxCount: 10 },
    { name: "variantImages", maxCount: 20 },
  ]), // Use the specific uploader instance
  updateProduct
);

router.put(
  "/:productId/variant/:variantId",
  protect,
  seller,
  upload.fields([{ name: "variantImages", maxCount: 5 }]),
  updateVariants
);

// @desc    Add a new variant to a product
// @route   POST /api/products/admin/:productId/variant
// @access  Private/Seller
router.post(
  "/:productId/variant",
  protect,
  seller,
  upload.fields([{ name: "variantImages", maxCount: 5 }]),
  addVariant
);

router.delete("/:productId/variant/:variantId", protect, seller, deleteVariant);

// @desc    Delete a product
// @route   DELETE /api/products/admin/:id
// @access  Private/Seller or Admin
router.delete("/:id", protect, seller, deleteProduct);

// @desc    Admin: Approve a product for public display
// @route   PUT /api/products/admin/approve/:id
// @access  Private/Admin
router.put("/approve/:id", protect, admin, approveProduct);

module.exports = router;
