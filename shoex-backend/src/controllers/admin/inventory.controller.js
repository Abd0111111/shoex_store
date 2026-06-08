const Product = require("../../models/Product.model");
const Order = require("../../models/Order.model");
const { sendSuccess, sendError } = require("../../utils/response");
const paginate = require("../../utils/pagination");
const getStockStatus = require("../../utils/stockStatus");

// GET /api/v1/admin/inventory
const getInventory = async (req, res, next) => {
  try {
    const {
      search,
      status,
      sortBy = "stock",
      sortDir = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (search) filter.$text = { $search: search };

    // Stock status filter
    if (status === "Out of Stock") filter.stock = 0;
    else if (status === "Low Stock") filter.stock = { $gt: 0, $lt: 10 };
    else if (status === "In Stock") filter.stock = { $gte: 10 };

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Run all heavy queries in parallel
    const [total, products, movementData, aggregateStats] = await Promise.all([
      Product.countDocuments(filter),

      Product.find(filter)
        .sort(sort)
        .skip(paginate(page, limit, 0).skip)
        .limit(Number(limit)),

      // Single aggregate for ALL products movement — replaces N individual calls
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: weekAgo },
            orderStatus: { $ne: "Cancelled" },
          },
        },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.productId",
            sold: { $sum: "$products.quantity" },
          },
        },
      ]),

      // Single aggregate for stat cards — replaces Product.find() + JS reduce
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalUnits: { $sum: "$stock" },
            totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
            totalSKUs: { $sum: 1 },
            lowStockCount: {
              $sum: {
                $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lt: ["$stock", 10] }] }, 1, 0],
              },
            },
            outOfStockCount: {
              $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const { pagination } = paginate(page, limit, total);

    // Build movement lookup map — O(1) access per product
    const movementMap = movementData.reduce((acc, m) => {
      acc[m._id.toString()] = m.sold;
      return acc;
    }, {});

    // Map products with movement from lookup
    const inventory = products.map((p) => ({
      id: p._id,
      name: p.name,
      category: p.category,
      sku: p.sku,
      price: p.price,
      images: p.images,
      stock: p.stock,
      movement: movementMap[p._id.toString()] || 0,
      inventoryValue: parseFloat((p.price * p.stock).toFixed(2)),
      status: getStockStatus(p.stock),
    }));

    const stats = aggregateStats[0] || {
      totalUnits: 0,
      totalValue: 0,
      totalSKUs: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    return res.status(200).json({
      success: true,
      data: inventory,
      pagination,
      aggregates: {
        totalUnits: stats.totalUnits,
        lowStockCount: stats.lowStockCount,
        outOfStockCount: stats.outOfStockCount,
        totalInventoryValue: parseFloat(stats.totalValue.toFixed(2)),
        totalSKUs: stats.totalSKUs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/inventory/:id/stock
const updateInventoryStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    );

    if (!product) {
      return sendError(res, "Product not found", "NOT_FOUND", 404);
    }

    return sendSuccess(
      res,
      {
        id: product._id,
        name: product.name,
        stock: product.stock,
        status: getStockStatus(product.stock),
      },
      "Stock updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getInventory, updateInventoryStock };