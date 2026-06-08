const Order = require("../../models/Order.model");
const Product = require("../../models/Product.model");
const User = require("../../models/User.model");
const { sendSuccess } = require("../../utils/response");

// GET /api/v1/admin/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const [todayOrders, weekOrders, monthOrders, pendingCount] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart }, orderStatus: { $ne: "Cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 }, avg: { $avg: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekStart }, orderStatus: { $ne: "Cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthStart }, orderStatus: { $ne: "Cancelled" } } },
        { $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          avg: { $avg: "$total" },
          customers: { $addToSet: "$customer.email" },
        }},
      ]),
      Order.countDocuments({ orderStatus: "New Order" }),
    ]);

    // Revenue chart — last 7 days
    const revenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayData = await Order.aggregate([
        { $match: { createdAt: { $gte: dayStart, $lte: dayEnd }, orderStatus: { $ne: "Cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      ]);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      revenueChart.push({
        date: days[dayStart.getDay()],
        revenue: dayData[0]?.revenue || 0,
        orders: dayData[0]?.orders || 0,
      });
    }

    const today = todayOrders[0] || { revenue: 0, orders: 0, avg: 0 };
    const week = weekOrders[0] || { revenue: 0, orders: 0 };
    const month = monthOrders[0] || { revenue: 0, orders: 0, avg: 0, customers: [] };

    // Monthly products sold
    const productsSold = await Order.aggregate([
      { $match: { createdAt: { $gte: monthStart }, orderStatus: { $ne: "Cancelled" } } },
      { $unwind: "$products" },
      { $group: { _id: null, total: { $sum: "$products.quantity" } } },
    ]);

    return sendSuccess(res, {
      today: {
        revenue: parseFloat((today.revenue || 0).toFixed(2)),
        orders: today.orders || 0,
        avgOrderValue: parseFloat((today.avg || 0).toFixed(2)),
        newCustomers: 0, // TODO: count new users today
      },
      week: {
        revenue: parseFloat((week.revenue || 0).toFixed(2)),
        orders: week.orders || 0,
      },
      month: {
        revenue: parseFloat((month.revenue || 0).toFixed(2)),
        orders: month.orders || 0,
        avgOrderValue: parseFloat((month.avg || 0).toFixed(2)),
        newCustomers: month.customers?.length || 0,
      },
      pendingOrdersCount: pendingCount,
      weeklyRevenueTarget: 50000,
      monthlyCustomersTarget: 40,
      monthlyProductsSoldTarget: 200,
      productsSoldThisMonth: productsSold[0]?.total || 0,
      revenueChart,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/dashboard/recent-orders
const getRecentOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const data = orders.map((o) => ({
      id: o.orderId,
      customerName: o.customer.name,
      customerPhone: o.customer.phone,
      total: o.total,
      orderStatus: o.orderStatus,
      date: o.createdAt,
    }));

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/dashboard/low-stock
const getLowStockProducts = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;

    const products = await Product.find({ stock: { $lt: threshold } })
      .select("name category images stock")
      .sort({ stock: 1 })
      .limit(10);

    return sendSuccess(res, products);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getRecentOrders, getLowStockProducts };