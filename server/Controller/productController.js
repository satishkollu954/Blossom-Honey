const asyncHandler = require("express-async-handler");
const Product = require("../Model/Product");
const mongoose = require("mongoose");

// --- Helper function to extract image URLs from multer/Cloudinary output ---
const extractImageUrls = (files) => {
  // Check if files exist and is an array (from multer.array)
  if (files && Array.isArray(files)) {
    // Cloudinary storage attaches the 'path' or 'secure_url' to each file object
    return files
      .map((file) => file.path || file.secure_url)
      .filter((url) => url);
  }
  return [];
};

// =========================================================================
// 1. PUBLIC/USER FUNCTIONS (Used in routes/productRoutes.js)
// =========================================================================

// @desc    Fetch all APPROVED products (Public catalog view)
// @route   GET /api/products
// @access  Public
const getApprovedProducts = asyncHandler(async (req, res) => {
  // Basic search and filtering logic can be added here
  const pageSize = 12; // Products per page
  const page = Number(req.query.pageNumber) || 1;

  // Only fetch products that have been approved by an admin
  const query = { isApproved: true };

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize), count });
});

// @desc    Fetch single APPROVED product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error("Product not found or invalid ID");
  }

  const product = await Product.findOne({
    _id: req.params.id,
    isApproved: true,
  })
    .populate("reviews.user", "name") // Populate the name of the reviewer
    .lean(); // Use lean() for performance since we don't plan to modify it

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found or not yet approved");
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private/User
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const reviewImages = extractImageUrls(req.files); // Get URLs from uploaded files

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed by this user");
    }

    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment,
      images: reviewImages, // Save the Cloudinary URLs
    };

    product.reviews.push(review);

    // Calculate new rating metrics
    const numReviews = product.reviews.length;
    const totalRating = product.reviews.reduce(
      (acc, item) => item.rating + acc,
      0
    );

    product.ratings.count = numReviews;
    product.ratings.average = (totalRating / numReviews).toFixed(1);

    await product.save();
    res.status(201).json({ message: "Review added successfully" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// =========================================================================
// 2. ADMIN/SELLER FUNCTIONS (Used in routes/adminProductRoutes.js)
// =========================================================================

// @desc    Get all products (including unapproved) - For Admin/Seller Dashboard
// @route   GET /api/products/admin
// @access  Private/Seller/Admin
const getAllProductsAdminView = asyncHandler(async (req, res) => {
  let query = {};

  // Sellers can only see their own products
  if (req.user.role === "seller") {
    query.seller = req.user._id;
  }

  const products = await Product.find(query)
    .select("name sku isApproved category createdAt") // Select fields needed for dashboard table
    .populate("seller", "name email"); // Show seller info

  res.json(products);
});

// @desc    Create a new product
// @route   POST /api/products/admin
// @access  Private/Seller
const createProduct = asyncHandler(async (req, res) => {
  console.log("Request body:", req.body);
  // ✅ Parse variants safely
  let variantsData = [];
  if (Array.isArray(req.body.variants)) {
    variantsData = req.body.variants;
  } else if (typeof req.body.variants === "string") {
    try {
      variantsData = JSON.parse(req.body.variants);
    } catch (error) {
      res.status(400);
      throw new Error("Invalid variants data format (must be a JSON array)");
    }
  } else {
    res.status(400);
    throw new Error(
      "Invalid variants data type (expected array or JSON string)"
    );
  }

  // ✅ Extract product images
  const productImages = extractImageUrls(req.files);
  const sellerId = req.user?._id || req.body.seller;
  const isApproved = true;
  // isApproved: req.user.role === "admin",
  // ✅ Create new product
  const product = new Product({
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    sku: req.body.sku,
    variants: variantsData,
    images: productImages,
    seller: sellerId,
    isApproved: isApproved,
    shippingCharge: req.body.shippingCharge || 0,
    deliveryTime: req.body.deliveryTime || "3-5 business days",
    tags: req.body.tags
      ? typeof req.body.tags === "string"
        ? JSON.parse(req.body.tags)
        : req.body.tags
      : [],
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update an existing product
// @route   PUT /api/products/admin/:id
// @access  Private/Seller
const updateProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error("Product not found or invalid ID");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Authorization check: Seller can only update their own products
  if (product.seller.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to update this product");
  }

  // --- Handle updates ---
  const updatedImages = extractImageUrls(req.files);

  // Merge new data into product object
  product.name = req.body.name || product.name;
  product.description = req.body.description || product.description;
  product.category = req.body.category || product.category;
  product.sku = req.body.sku || product.sku;

  // Handle complex fields like variants (needs careful parsing)
  if (req.body.variants) {
    try {
      product.variants = JSON.parse(req.body.variants);
    } catch (error) {
      res.status(400);
      throw new Error("Invalid variants data format (must be a JSON array)");
    }
  }

  // Append new images to existing list (or replace entirely based on frontend logic)
  if (updatedImages.length > 0) {
    // Simple append - frontend might send a flag to clear existing images
    product.images = [...product.images, ...updatedImages];
  }

  product.shippingCharge =
    req.body.shippingCharge !== undefined
      ? req.body.shippingCharge
      : product.shippingCharge;
  product.deliveryTime = req.body.deliveryTime || product.deliveryTime;

  if (req.body.tags) {
    product.tags = JSON.parse(req.body.tags);
  }

  // Important: Force re-approval if crucial fields are changed (optional, but good practice)
  product.isApproved = false;

  // The pre('save') hook will run and recalculate finalPrice if variants changed
  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/admin/:id
// @access  Private/Seller or Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Authorization: Only the owner or an Admin can delete
    if (
      req.user.role !== "admin" &&
      product.seller.toString() !== req.user._id.toString()
    ) {
      res.status(401);
      throw new Error("Not authorized to delete this product");
    }

    await product.deleteOne(); // Use deleteOne()
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Admin: Approve a product for public display
// @route   PUT /api/products/admin/approve/:id
// @access  Private/Admin
const approveProduct = asyncHandler(async (req, res) => {
  // Only 'admin' role has access due to the route's middleware
  const product = await Product.findById(req.params.id);

  if (product) {
    product.isApproved = true;
    await product.save();
    res.json({
      message: "Product approved successfully",
      product: {
        _id: product._id,
        name: product.name,
        isApproved: product.isApproved,
      },
    });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

module.exports = {
  getApprovedProducts,
  getProductById,
  createProductReview,
  createProduct,
  updateProduct,
  deleteProduct,
  approveProduct,
  getAllProductsAdminView,
};
