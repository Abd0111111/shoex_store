const Product = require("../models/Product.model");
const Review = require("../models/Review.model");
const Order = require("../models/Order.model");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");
const paginate = require("../utils/pagination");

// GET /api/v1/products
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      maxPrice,
      size,
      sort = "default",
      tag,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const filter = { status: "Active" };

    if (category) filter.category = category;
    if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) };
    if (size) filter.sizes = parseInt(size);
    if (tag) filter.tags = tag;
    if (search) filter.$text = { $search: search };

    const sortOptions = {
      default: { createdAt: -1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      rating: { rating: -1 },
      "name-asc": { name: 1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.default;
    const total = await Product.countDocuments(filter);
    const { skip, pagination } = paginate(page, limit, total);

    const products = await Product.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(pagination.limit);

    return sendPaginated(res, products, pagination);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", count: 1 } },
      { $sort: { name: 1 } },
    ]);

    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:id/reviews
const getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    const total = await Review.countDocuments({ productId: req.params.id });
    const { skip, pagination } = paginate(page, limit, total);

    const reviews = await Review.find({ productId: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit);

    const formatted = reviews.map((r) => ({
      id: r._id,
      userId: r.userId,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt,
      verified: r.verified,
    }));

    return sendPaginated(res, formatted, pagination);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products/:id/reviews
const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user._id;

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    // Check user has a delivered order with this product
const hasAnyOrder = await Order.findOne({ "customer.userId": userId });

if (!hasAnyOrder) {
  return sendError(
    res,
    "You must place at least one order before reviewing.",
    "REVIEW_NOT_ALLOWED",
    403
  );
}

    // Check duplicate review
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return sendError(
        res,
        "You have already reviewed this product.",
        "CONFLICT",
        409
      );
    }

    // Create review
    const review = await Review.create({
      productId,
      userId,
      userName: req.user.name,
      rating,
      comment,
      verified: true,
    });

    // Recalculate product rating and reviewCount
    const stats = await Review.aggregate([
      { $match: { productId: product._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      product.rating = parseFloat(stats[0].avgRating.toFixed(1));
      product.reviewCount = stats[0].count;
      await product.save();
    }

    return sendSuccess(
      res,
      {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt,
      },
      "Review submitted successfully",
      201
    );
  } catch (error) {
    // Handle duplicate key error from unique index
    if (error.code === 11000) {
      return sendError(
        res,
        "You have already reviewed this product.",
        "CONFLICT",
        409
      );
    }
    next(error);
  }
};

module.exports = {
  getProducts,
  getCategories,
  getProductById,
  getProductReviews,
  createProductReview,
};