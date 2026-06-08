const Order = require("../../models/Order.model");
const { getAnalyticsSummary, getDateRange } = require("../../services/analytics.service");
const { sendSuccess } = require("../../utils/response");

// GET /api/v1/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || "30";
    const { start, end } = getDateRange(range);

    const summary = await getAnalyticsSummary(range);

    // Revenue chart
    const revenueChart = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%b %d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          value: { $sum: "$products.quantity" },
        },
      },
      { $sort: { value: -1 } },
    ]);

    const colors = ["#dc143c", "#ef4444", "#f87171", "#fca5a5", "#fecaca"];
    const totalUnits = categoryBreakdown.reduce((sum, c) => sum + c.value, 0);
    const formattedCategories = categoryBreakdown.map((c, i) => ({
      name: c._id,
      value: totalUnits > 0 ? Math.round((c.value / totalUnits) * 100) : 0,
      color: colors[i] || "#fecaca",
    }));

    // Top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          name: { $first: "$products.name" },
          sales: { $sum: "$products.quantity" },
          revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          sales: 1,
          revenue: { $round: ["$revenue", 2] },
        },
      },
    ]);

    return sendSuccess(res, {
      summary,
      revenueChart,
      categoryBreakdown: formattedCategories,
      topProducts,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/analytics/export
const exportAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || "30";
    const { start, end } = getDateRange(range);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      orderStatus: { $ne: "Cancelled" },
    }).sort({ createdAt: -1 });

    const rows = orders.map((o) => ({
      "Order ID": o.orderId,
      "Date": new Date(o.createdAt).toISOString(),
      "Customer": o.customer.name,
      "Total": o.total,
      "Status": o.orderStatus,
      "Payment": o.paymentStatus,
    }));

    const { format } = require("@fast-csv/format");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="analytics-report-${new Date().toISOString().split("T")[0]}.csv"`
    );

    if (rows.length === 0) return res.end("No data");

    const csvStream = format({ headers: true });
    csvStream.pipe(res);
    rows.forEach((row) => csvStream.write(row));
    csvStream.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, exportAnalytics };