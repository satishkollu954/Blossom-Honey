const asyncHandler = require("express-async-handler");
const Product = require("../Model/Product");
const mongoose = require("mongoose");
const {
  createUploader,
  extractFileUrls,
  deleteCloudinaryFolder,
} = require("../Middleware/uploadMiddleware");
const { cloudinary } = require("../Middleware/newmiddleware");
const User = require("../Model/User");

// Generate SKU
function generateSKU(productName) {
  const prefix = productName.slice(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${random}`;
}

function convertWeightToKg(weightStr) {
  if (!weightStr) return 0;

  const lower = weightStr.trim().toLowerCase();

  // Match numeric part
  const num = parseFloat(lower);
  if (isNaN(num)) return 0;

  if (lower.includes("kg")) return num;
  if (lower.includes("g")) return num / 1000;
  if (lower.includes("mg")) return num / 1_000_000;
  if (lower.includes("lb") || lower.includes("lbs")) return num * 0.453592;
  return num; // fallback
}

// ===============================================================
// ✅ CREATE PRODUCT (Images Only, Variants Supported)
// ===============================================================
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

  // ✅ Generate unique SKU for main product
  let productSku;
  do {
    productSku = generateSKU(req.body.name);
  } while (await Product.findOne({ sku: productSku }));

  // ✅ Generate SKU for each variant
  const processedVariants = [];
  for (const variant of variantsData) {
    let variantSku;
    do {
      variantSku = generateSKU(req.body.name);
    } while (await Product.findOne({ "variants.sku": variantSku }));

    processedVariants.push({
      ...variant,
      sku: variantSku,
      weightInKg: convertWeightToKg(variant.weight),
    });
  }

  // ✅ Create product
  const product = new Product({
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    sku: productSku,
    variants: processedVariants,
    seller: sellerId,
    isApproved,
    shippingCharge: req.body.shippingCharge || 0,
    deliveryTime: req.body.deliveryTime || "3-5 business days",
    tags: tagsData,
  });

  const savedProduct = await product.save();
  const productId = savedProduct._id.toString();

  // ✅ Upload PRODUCT images (if any)
  const uploadedProductImages = [];
  if (req.files?.productImages) {
    for (let file of req.files.productImages) {
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/products/${productId}/images`,
        file.originalname.split(".")[0] + "-" + Date.now(),
        "image"
      );
      uploadedProductImages.push(url);
    }
  }

  savedProduct.images = uploadedProductImages;
  await savedProduct.save();

  res.status(201).json({
    message: "✅ Product created successfully",
    product: savedProduct,
  });
});

// ===============================================================
// ✅ GET ALL APPROVED PRODUCTS
// ===============================================================
const getApprovedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isApproved: true });
  res.json({ products });
});

// ===============================================================
// ✅ GET PRODUCT BY ID
// ===============================================================
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isApproved: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found or not yet approved");
  }

  res.json(product);
});

// ===============================================================
// ✅ CREATE PRODUCT REVIEW (Images Only)
// ===============================================================
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  // ✅ Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return res
      .status(400)
      .json({ message: "Product already reviewed by this user" });
  }

  // ✅ Upload review images (only images)
  const reviewImages = [];
  if (req.files?.reviewImages) {
    for (const file of req.files.reviewImages) {
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/products/${product._id}/reviews/images`,
        file.originalname.split(".")[0] + "-" + Date.now(),
        "image"
      );
      reviewImages.push(url);
    }
  }

  const user = await User.findById(req.user._id);
  const username = user?.name || "Anonymous";

  const review = {
    user: req.user._id,
    username,
    rating: Number(rating),
    comment,
    images: reviewImages,
  };

  product.reviews.push(review);

  // ✅ Update ratings
  const totalRating = product.reviews.reduce(
    (acc, item) => acc + item.rating,
    0
  );
  product.ratings.count = product.reviews.length;
  product.ratings.average = (totalRating / product.reviews.length).toFixed(1);

  await product.save();

  res.status(201).json({
    message: "✅ Review added successfully",
    review,
  });
});

// ===============================================================
// ✅ GET PRODUCT REVIEWS
// ===============================================================
const getProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("reviews.user", "name email")
    .select("reviews ratings");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    reviews: product.reviews,
    ratings: product.ratings,
  });
});

// ===============================================================
// ✅ ADMIN: GET ALL PRODUCTS (with seller & reviews populated)
// ===============================================================
const getAllProductsAdminView = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate("seller", "name email role")
    .populate("reviews.user", "name email");

  res.status(200).json(products);
});

// ===============================================================
// ✅ UPDATE PRODUCT (Images + Basic Fields)
// ===============================================================
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new Error("Product not found");

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

  // --- Update product images (only images) ---
  if (req.files?.productImages) {
    const uploadedProductImages = [];
    for (let file of req.files.productImages) {
      const url = await createUploader(
        file.buffer,
        `BlossomHoney/products/${id}/images`,
        file.originalname.split(".")[0] + "-" + Date.now(),
        "image"
      );
      uploadedProductImages.push(url);
    }
    product.images = uploadedProductImages;
  }

  await product.save();

  res.status(200).json({
    message: "✅ Product updated successfully",
    product,
  });
});

const addVariant = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  consol;
  let variantsData = [];
  try {
    variantsData =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    res.status(400);
    throw new Error("Invalid variants data format");
  }
  console.log("variantsData", variantsData);
  console.log("req.body.variantsa", req.body);
  // Ensure variantsData is always an array
  if (!Array.isArray(variantsData)) {
    variantsData = [variantsData];
  }

  if (variantsData.length === 0) {
    res.status(400);
    throw new Error("No variants provided");
  }

  const flatImages = req.files?.variantImages || [];
  let imageIndex = 0;

  // ✅ Loop through each variant to add
  for (const variantData of variantsData) {
    // Generate unique SKU if not provided
    const variantSku =
      variantData.sku ||
      `${product.sku}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

    // Convert weight → kg
    const weightInKg = convertWeightToKg(variantData.weight);

    // Calculate final price
    const finalPrice = Math.round(
      variantData.price -
        (variantData.price * (variantData.discount || 0)) / 100
    );

    // --- Handle variant images ---
    const uploadedImages = [];
    if (variantData.numImages && flatImages.length > imageIndex) {
      for (let i = 0; i < variantData.numImages; i++) {
        const file = flatImages[imageIndex];
        if (!file) break;

        const url = createUploader(
          file.buffer,
          `BlossomHoney/products/${productId}/variants/new-${Date.now()}`,
          file.originalname.split(".")[0] + "-" + Date.now(),
          "image"
        );
        uploadedImages.push(url);
        imageIndex++;
      }
    }

    // --- Create new variant object ---
    const newVariant = {
      weight: variantData.weight,
      weightInKg,
      type: variantData.type,
      packaging: variantData.packaging,
      price: variantData.price,
      discount: variantData.discount || 0,
      finalPrice,
      stock: variantData.stock,
      sku: variantSku,
      images: uploadedImages,
    };

    product.variants.push(newVariant);
  }

  await product.save();

  res.status(201).json({
    message: "✅ Variant(s) added successfully",
    variants: product.variants,
  });
});

// ===============================================================
// ✅ UPDATE VARIANTS (Images Only)
const updateVariants = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;

  // 1️⃣ Find product
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "❌ Product not found" });
  }

  // 2️⃣ Find the variant inside product
  const variant = product.variants.id(variantId);
  if (!variant) {
    return res.status(404).json({ message: "❌ Variant not found" });
  }

  // 3️⃣ Extract single variant update (because admin updates only one)
  const update = req.body.variants?.[0];
  if (!update) {
    return res.status(400).json({ message: "No variant data provided" });
  }

  console.log("Received update:", update);

  // 4️⃣ Apply updates safely
  if (update.weight) {
    variant.weight = update.weight;
    variant.weightInKg = convertWeightToKg(update.weight);
  }
  if (update.type) variant.type = update.type;
  if (update.packaging) variant.packaging = update.packaging;
  if (update.price !== undefined) variant.price = update.price;
  if (update.discount !== undefined) variant.discount = update.discount;
  if (update.stock !== undefined) variant.stock = update.stock;
  if (update.sku) variant.sku = update.sku;
  if (update.dimensions || update.length || update.breadth || update.height) {
    variant.dimensions = {
      length:
        update.length ?? update.dimensions?.length ?? variant.dimensions.length,
      breadth:
        update.breadth ??
        update.dimensions?.breadth ??
        variant.dimensions.breadth,
      height:
        update.height ?? update.dimensions?.height ?? variant.dimensions.height,
    };
  }

  console.log("--> ", variant.dimensions);
  // 5️⃣ Recalculate final price
  const price = variant.price || 0;
  const discount = variant.discount || 0;
  variant.finalPrice = Math.round(price - (price * discount) / 100);

  // 6️⃣ Handle image upload (if applicable)
  if (req.files?.variantImages?.length) {
    const uploadedImages = [];
    for (const file of req.files.variantImages) {
      const url = createUploader(
        file.buffer,
        `BlossomHoney/products/${productId}/variants/${variantId}`,
        file.originalname.split(".")[0] + "-" + Date.now(),
        "image"
      );
      uploadedImages.push(url);
    }
    variant.images = uploadedImages;
  }
  console.log("product==>>  ", product.variants[0].dimensions);
  // 7️⃣ Save product (with updated variant)
  await product.save();

  res.status(200).json({
    message: "✅ Variant updated successfully",
    variant,
  });
});

// ===============================================================
// ✅ DELETE VARIANT
// ===============================================================
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

  product.variants.splice(variantIndex, 1);

  // ✅ Delete entire product if no variants left
  if (product.variants.length === 0) {
    await Product.findByIdAndDelete(productId);

    const folderPath = `BlossomHoney/products/${product._id}`;
    await deleteCloudinaryFolder(folderPath);

    return res.status(200).json({
      message: "Last variant deleted — product also removed",
      productDeleted: true,
    });
  }

  await product.save();

  res.status(200).json({
    message: "✅ Variant deleted successfully",
    productDeleted: false,
  });
});

// ===============================================================
// ✅ DELETE PRODUCT
// ===============================================================
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

  const folderPath = `BlossomHoney/products/${product._id}`;
  await deleteCloudinaryFolder(folderPath);

  res.json({ message: "✅ Product removed successfully" });
});

// ===============================================================
// ✅ APPROVE PRODUCT (Admin Only)
// ===============================================================
const approveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.isApproved = true;
  await product.save();

  res.json({
    message: "✅ Product approved successfully",
    product: {
      _id: product._id,
      name: product.name,
      isApproved: product.isApproved,
    },
  });
});

// ===============================================================
// ✅ GET PRODUCTS BY CATEGORY
// ===============================================================
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryName } = req.params;
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

  const products = await Product.find({
    category: categoryName,
    isApproved: true,
  });

  if (!products.length) {
    res.status(404);
    throw new Error("No products found in this category");
  }

  res.status(200).json({
    count: products.length,
    products,
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
  addVariant,
  updateVariants,
  deleteVariant,
  getProductsByCategory,
  getProductReviews,
};
