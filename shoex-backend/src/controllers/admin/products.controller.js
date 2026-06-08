const Product = require("../../models/Product.model");
const { uploadImage } = require("../../services/upload.service");
const { notifyLowStock } = require("../../services/notification.service");
const { sendSuccess, sendError, sendPaginated } = require("../../utils/response");
const paginate = require("../../utils/pagination");
const getStockStatus = require("../../utils/stockStatus");

// GET /api/v1/admin/products
const getAdminProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      sortBy = "createdAt",
      sortDir = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };
    const total = await Product.countDocuments(filter);
    const { skip, pagination } = paginate(page, limit, total);

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pagination.limit);

    return sendPaginated(res, products, pagination);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/products
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    // Check low stock after create
    if (product.stock < 10) {
      await notifyLowStock(product);
    }

    return sendSuccess(res, product, "Product created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    // Check low stock after update
    if (product.stock < 10) {
      await notifyLowStock(product);
    }

    return sendSuccess(res, product, "Product updated successfully");
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/admin/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, null, "Product deleted successfully");
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/products/:id/discount
const applyDiscount = async (req, res, next) => {
  try {
    const { discountPercent } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    // Preserve original price
    const originalPrice = product.originalPrice ?? product.price;
    const newPrice = parseFloat(
      (originalPrice * (1 - discountPercent / 100)).toFixed(2)
    );

    product.originalPrice = originalPrice;
    product.price = newPrice;
    await product.save();

    return sendSuccess(res, product, "Discount applied successfully");
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/products/:id/discount/remove
const removeDiscount = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    if (product.originalPrice) {
      product.price = product.originalPrice;
      product.originalPrice = null;
    }

    await product.save();

    return sendSuccess(res, product, "Discount removed successfully");
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/products/:id/stock
const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    product.stock = stock;
    await product.save();

    if (product.stock < 10) {
      await notifyLowStock(product);
    }

    return sendSuccess(res, product, "Stock updated successfully");
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/products/upload-image
const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, "No image file provided", "VALIDATION_ERROR", 422);
    }

    const result = await uploadImage(req.file.buffer, req.file.mimetype);

    return sendSuccess(res, result, "Image uploaded successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  applyDiscount,
  removeDiscount,
  updateStock,
  uploadProductImage,
};