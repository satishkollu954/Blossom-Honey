// server/Controller/productController.js
const asyncHandler = require("express-async-handler");
const Product = require("../Model/Product");
const mongoose = require("mongoose");
const {
  createUploader,
  extractFileUrls,
} = require("../Middleware/uploadMiddleware");
// =========================================================================
const { cloudinary } = require("../Middleware/newmiddleware");

// Helper: upload buffer to Cloudinary
/*
const uploadToCloudinary = (fileBuffer, folder, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder, // folder path
        public_id: filename, // file name
        resource_type: "image", // ensure it’s treated as image
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
*/

// Generate SKU
function generateSKU(productName) {
  const prefix = productName.slice(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

// CREATE PRODUCT WITH IMAGES
const createProduct = asyncHandler(async (req, res) => {
  console.log("Request body:", req.body);
  console.log("Files:", req.files);

  // --- Parse variants ---
  let variantsData = [];
  if (req.body.variants) {
    try {
      variantsData =
        typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants;
    } catch (err) {
      res.status(400);
      throw new Error("Invalid variants data format");
    }
  }

  // --- Parse tags ---
  let tagsData = [];
  if (req.body.tags) {
    tagsData =
      typeof req.body.tags === "string"
        ? JSON.parse(req.body.tags)
        : req.body.tags;
  }

  const sellerId = req.user._id;
  const isApproved = req.user.role === "admin";

  // --- Generate SKU ---
  let sku;
  do {
    sku = generateSKU(req.body.name);
  } while (await Product.findOne({ sku }));

  // --- Create product WITHOUT images first ---
  const product = new Product({
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    sku,
    variants: variantsData,
    seller: sellerId,
    isApproved,
    shippingCharge: req.body.shippingCharge || 0,
    deliveryTime: req.body.deliveryTime || "3-5 business days",
    tags: tagsData,
  });

  const savedProduct = await product.save();
  const productId = savedProduct._id.toString();

  // --- Upload PRODUCT images ---
  const uploadedProductImages = [];
  if (req.files?.productImages) {
    for (let file of req.files.productImages) {
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/products/${productId}/images`,
        file.originalname.split(".")[0] + "-" + Date.now()
      );
      uploadedProductImages.push(url);
    }
  }

  // --- Upload VARIANT images (flattened) ---
  if (req.files?.variantImages && req.files.variantImages.length > 0) {
    let imageIndex = 0; // tracks position in flat array

    for (let i = 0; i < variantsData.length; i++) {
      const uploadedImages = [];

      // Get number of images this variant has from frontend (optional)
      const numImages = product.variants[i].images?.length || 0;

      // Only upload if images exist
      if (numImages > 0) {
        for (let j = 0; j < numImages; j++) {
          const file = req.files.variantImages[imageIndex];
          if (!file) continue;

          const url = await createUploader(
            file.buffer,
            `BlossomHoney/products/${productId}/variants/${i}`,
            file.originalname.split(".")[0] + "-" + Date.now()
          );
          uploadedImages.push(url);
          imageIndex++;
        }
      }

      // Assign uploaded images (or empty array if none)
      variantsData[i].images = uploadedImages;
    }
  } else {
    // No variant images uploaded, set empty array for each variant
    variantsData.forEach((v) => {
      v.images = [];
    });
  }

  // --- Save image URLs back to product ---
  savedProduct.images = uploadedProductImages;
  savedProduct.variants = variantsData;

  await savedProduct.save();

  res.status(201).json({
    message: "Product created successfully",
    product: savedProduct,
  });
});

const getApprovedProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;

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
    .populate("reviews.user", "name")
    .lean();

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
  const reviewMedia = extractMediaUrls(req.files);

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
      media: reviewMedia, // image/video URLs
    };

    product.reviews.push(review);

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

// @desc    Get all products (Admin/Seller Dashboard)
// @route   GET /api/products/admin
// @access  Private/Seller/Admin
const getAllProductsAdminView = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === "seller") {
    query.seller = req.user._id;
  }

  const products = await Product.find(query)
    .select("name sku isApproved category createdAt")
    .populate("seller", "name email");
  console.log("==> ", products);
  res.json(products);
});

const updateProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.seller.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to update this product");
  }

  // Extract new images/videos
  const updatedImages = extractMediaUrls(req.files?.images || []);
  const updatedVideos = extractMediaUrls(req.files?.videos || []);

  // Update fields
  product.name = req.body.name || product.name;
  product.description = req.body.description || product.description;
  product.category = req.body.category || product.category;
  if (req.body.variants) {
    try {
      product.variants = JSON.parse(req.body.variants);
    } catch (error) {
      res.status(400);
      throw new Error("Invalid variants data format (must be JSON array)");
    }
  }

  if (updatedImages.length > 0) {
    product.images = [...product.images, ...updatedImages];
  }

  if (updatedVideos.length > 0) {
    product.videos = [...product.videos, ...updatedVideos];
  }

  product.shippingCharge =
    req.body.shippingCharge !== undefined
      ? req.body.shippingCharge
      : product.shippingCharge;
  product.deliveryTime = req.body.deliveryTime || product.deliveryTime;

  if (req.body.tags) {
    product.tags =
      typeof req.body.tags === "string"
        ? JSON.parse(req.body.tags)
        : req.body.tags;
  }

  // Require re-approval if updated
  product.isApproved = false;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (
    req.user.role !== "admin" &&
    product.seller.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error("Not authorized to delete this product");
  }

  await product.deleteOne();
  res.json({ message: "Product removed successfully" });
});

const approveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

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
