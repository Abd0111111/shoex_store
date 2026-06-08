const User = require("../models/User.model");
const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");
const paginate = require("../utils/pagination");

// Status mapping — admin statuses → user-friendly statuses
const mapOrderStatus = (status) => {
  const map = {
    "New Order": "Processing",
    "Contacted": "Processing",
    "Confirmed": "Processing",
    "Packed": "Processing",
    "Shipped": "In Transit",
    "Out For Delivery": "In Transit",
    "Delivered": "Delivered",
    "Cancelled": "Cancelled",
    "Returned": "Cancelled",
  };
  return map[status] || status;
};

// GET /api/v1/users/me/orders
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const filter = { "customer.userId": req.user._id };
    const total = await Order.countDocuments(filter);
    const { skip, pagination } = paginate(page, limit, total);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit);

    const formatted = orders.map((o) => ({
      id: o.orderId,
      date: o.createdAt,
      status: mapOrderStatus(o.orderStatus),
      total: o.total,
      trackingNumber: o.trackingNumber,
      items: o.products.map((p) => ({
        productId: p.productId,
        name: p.name,
        image: p.image,
        size: p.size,
        color: p.color,
        quantity: p.quantity,
        price: p.price,
      })),
    }));

    return sendPaginated(res, formatted, pagination);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/users/me/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      match: { status: "Active" },
      select: "name price originalPrice images category rating reviewCount inStock stock",
    });

    if (!user) {
      return sendError(res, "User not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, user.wishlist);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/users/me/wishlist
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    const user = await User.findById(req.user._id);

    const alreadyInWishlist = user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (alreadyInWishlist) {
      return sendError(
        res,
        "Product already in wishlist",
        "CONFLICT",
        409
      );
    }

    user.wishlist.push(productId);
    await user.save();

    return sendSuccess(res, { productId }, "Added to wishlist", 201);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/users/me/wishlist/:productId
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    const index = user.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    if (index === -1) {
      return sendError(res, "Product not in wishlist", "NOT_FOUND", 404);
    }

    user.wishlist.splice(index, 1);
    await user.save();

    return sendSuccess(res, null, "Removed from wishlist");
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/users/me/address
const getAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("address");

    if (!user) {
      return sendError(res, "User not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, user.address);
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/users/me/address
const updateAddress = async (req, res, next) => {
  try {
    const { country, governorate, city, address, apartment } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        address: {
          country: country || null,
          governorate: governorate || null,
          city: city || null,
          address: address || null,
          apartment: apartment || null,
        },
      },
      { new: true }
    ).select("address");

    if (!user) {
      return sendError(res, "User not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, user.address, "Address updated successfully");
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/users/me/address
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        address: {
          country: null,
          governorate: null,
          city: null,
          address: null,
          apartment: null,
        },
      },
      { new: true }
    ).select("address");

    if (!user) {
      return sendError(res, "User not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, null, "Address deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAddress,
  updateAddress,
  deleteAddress,
};