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

const { deleteCloudinaryFolder } = require("../Middleware/uploadMiddleware");

// Generate SKU
function generateSKU(productName) {
  const prefix = productName.slice(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

// CREATE PRODUCT WITH IMAGES
const createProduct = asyncHandler(async (req, res) => {
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

  let tagsData = [];
  if (req.body.tags) {
    tagsData =
      typeof req.body.tags === "string"
        ? JSON.parse(req.body.tags)
        : req.body.tags;
  }

  const sellerId = req.user._id;
  const isApproved = req.user.role === "admin";

  // Generate SKU
  let sku;
  do {
    sku = generateSKU(req.body.name);
  } while (await Product.findOne({ sku }));

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

  // --- Upload PRODUCT media (images/videos) ---
  const uploadedProductMedia = [];
  if (req.files?.productImages) {
    for (let file of req.files.productImages) {
      const type = file.mimetype.startsWith("video/") ? "video" : "image";
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/products/${productId}/${type}s`,
        file.originalname.split(".")[0] + "-" + Date.now(),
        type
      );
      uploadedProductMedia.push(url);
    }
  }

  savedProduct.images = uploadedProductMedia; // store product media
  savedProduct.variants = variantsData;
  await savedProduct.save();

  res.status(201).json({
    message: "Product created successfully",
    product: savedProduct,
  });
});

const getApprovedProducts = asyncHandler(async (req, res) => {
  // const pageSize = 12;
  // const page = Number(req.query.pageNumber) || 1;

  const query = { isApproved: true };

  // const count = await Product.countDocuments(query);
  const products = await Product.find(query);

  //res.json({ products, page, pages: Math.ceil(count / pageSize), count });
  res.json({ products });
});

const getProductById = asyncHandler(async (req, res) => {
  //  console.log("Fetching product by ID:", req.params.id);
  const product = await Product.findOne({
    _id: req.params.id,
    isApproved: true,
  });
  // console.log("Fetched  single product :", product);
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found or not yet approved");
  }
});

const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) throw new Error("Product not found");

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    res.status(400).json({ message: "Product already reviewed by this user" });
  }

  const reviewIndex = product.reviews.length;

  const reviewImages = [];
  if (req.files?.reviewImages) {
    for (const file of req.files.reviewImages) {
      // Detect type: image or video
      const type = file.mimetype.startsWith("video/") ? "video" : "image";
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/products/${product._id}/reviews/${type}s`,
        file.originalname.split(".")[0] + "-" + Date.now(),
        type
      );
      reviewImages.push(url);
    }
  }
  const username = await User.findById(req.user._id).name;
  console.log("Username for review:", username);
  const review = {
    user: req.user._id,
    username: username,
    rating: Number(rating),
    comment,
    images: reviewImages, // store uploaded URLs
  };

  product.reviews.push(review);

  // Update ratings
  const totalRating = product.reviews.reduce(
    (acc, item) => acc + item.rating,
    0
  );
  product.ratings.count = product.reviews.length;
  product.ratings.average = (totalRating / product.reviews.length).toFixed(1);

  await product.save();

  res.status(201).json({ message: "Review added successfully", review });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  const product = await Product.findById(productId)
    .populate("reviews.user", "name email") // populate user info if needed
    .select("reviews ratings");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    reviews: product.reviews,
    ratings: product.ratings, // optional: send average/count
  });
});

const getAllProductsAdminView = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find()
      .populate("seller", "name email role") // populate seller details
      .populate("reviews.user", "name email"); // populate review user details
    res.status(200).json(products);
  } catch (error) {
    res.status(500);
    throw new Error("Server error fetching products");
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new Error("Product not found");

  // --- Update basic fields ---
  const updatableFields = [
    "name",
    "description",
    "category",
    "shippingCharge",
    "deliveryTime",
    "tags",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  // --- Update product media ---
  if (req.files?.productImages) {
    const uploadedProductImages = [];
    for (let file of req.files.productImages) {
      const type = file.mimetype.startsWith("video/") ? "video" : "image";
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/products/${id}/${type}s`,
        file.originalname.split(".")[0] + "-" + Date.now(),
        type
      );
      uploadedProductImages.push(url);
    }
    product.images = uploadedProductImages;
  }

  await product.save();

  res.status(200).json({
    message: "Product updated successfully",
    product,
  });
});

const updateVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let variantsData = [];
  try {
    variantsData =
      typeof req.body.variants === "string"
        ? JSON.parse(req.body.variants)
        : req.body.variants;
  } catch (err) {
    res.status(400);
    throw new Error("Invalid variants data format");
  }
  // console.log("==>>  ", variantsData);
  if (!Array.isArray(variantsData)) {
    res.status(400);
    throw new Error("Variants should be an array");
  }

  let imageIndex = 0; // for req.files.variantImages if provided
  const flatImages = req.files?.variantImages || [];

  variantsData.forEach((update) => {
    const variantIndex = product.variants.findIndex(
      (v) => v._id.toString() === update.variantId
    );
    if (variantIndex === -1) return; // skip invalid variantId

    const variant = product.variants[variantIndex];

    // --- Update fields ---
    ["weight", "type", "packaging", "price", "discount", "stock"].forEach(
      (field) => {
        if (update[field] !== undefined) {
          variant[field] = update[field];
        }
      }
    );

    // --- Recalculate finalPrice ---
    variant.finalPrice = Math.round(
      variant.price - (variant.price * (variant.discount || 0)) / 100
    );

    // --- Update images ---
    if (update.numImages && flatImages.length > imageIndex) {
      const uploadedImages = [];
      for (let i = 0; i < update.numImages; i++) {
        const file = flatImages[imageIndex];
        if (!file) break;

        const url = createUploader(
          file.buffer,
          `BlossomHoney/products/${productId}/variants/${variantIndex}`,
          file.originalname.split(".")[0] + "-" + Date.now()
        );
        uploadedImages.push(url);
        imageIndex++;
      }
      variant.images = uploadedImages;
    }
  });

  await product.save();

  res.status(200).json({
    message: "Variants updated successfully",
    variants: product.variants,
  });
});

const deleteVariant = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const variantIndex = product.variants.findIndex(
    (v) => v._id.toString() === variantId
  );

  if (variantIndex === -1) {
    res.status(404);
    throw new Error("Variant not found");
  }

  // Remove the variant
  product.variants.splice(variantIndex, 1);

  // ✅ If no variants remain, delete the product entirely
  if (product.variants.length === 0) {
    // console.log("No variants left, deleting product");
    await Product.findByIdAndDelete(productId);

    // Delete associated images from Cloudinary
    const folderPath = `BlossomHoney/products/${product._id}`;
    await deleteCloudinaryFolder(folderPath);

    return res.status(200).json({
      message: "Last variant deleted — product also removed",
      productDeleted: true,
    });
  }

  // Otherwise, just save the product
  await product.save();

  res.status(200).json({
    message: "Variant deleted successfully",
    productDeleted: false,
  });
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

  // Delete associated images from Cloudinary
  const folderPath = `BlossomHoney/products/${product._id}`;
  await deleteCloudinaryFolder(folderPath);

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

// --- Fetch Products by Category ---
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryName } = req.params;
  console.log("Fetching products for category:", categoryName);

  // Validate category
  const validCategories = [
    "dry-fruits",
    "honey",
    "nuts-seeds",
    "spices",
    "other",
  ];
  if (!validCategories.includes(categoryName.toLowerCase().trim())) {
    res.status(400);
    throw new Error("Invalid category");
  }

  // Fetch products that match category and are approved
  const products = await Product.find({
    category: categoryName,
    isApproved: true,
  });

  if (!products || products.length === 0) {
    res.status(404);
    throw new Error("No products found in this category");
  }

  res.status(200).json({ count: products.length, products });
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
  updateVariants,
  deleteVariant,
  getProductsByCategory,
  getProductReviews,
};
