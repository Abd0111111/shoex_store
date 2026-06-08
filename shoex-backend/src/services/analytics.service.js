const Order = require("../models/Order.model");

const getDateRange = (range) => {
  const now = new Date();
  const days = parseInt(range) || 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start, end: now };
};

const getAnalyticsSummary = async (range) => {
  const { start, end } = getDateRange(range);

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - parseInt(range));

  const [current, previous] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          customers: { $addToSet: "$customer.email" },
          avgOrderValue: { $avg: "$total" },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: prevStart, $lt: start },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          customers: { $addToSet: "$customer.email" },
          avgOrderValue: { $avg: "$total" },
        },
      },
    ]),
  ]);

  const curr = current[0] || { revenue: 0, orders: 0, customers: [], avgOrderValue: 0 };
  const prev = previous[0] || { revenue: 0, orders: 0, customers: [], avgOrderValue: 0 };

  const calcChange = (curr, prev) => {
    if (prev === 0) return 0;
    return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
  };

  return {
    totalRevenue: parseFloat(curr.revenue.toFixed(2)),
    totalOrders: curr.orders,
    totalCustomers: curr.customers.length,
    avgOrderValue: parseFloat((curr.avgOrderValue || 0).toFixed(2)),
    revenueChange: calcChange(curr.revenue, prev.revenue),
    ordersChange: calcChange(curr.orders, prev.orders),
    customersChange: calcChange(curr.customers.length, prev.customers.length),
    avgOrderValueChange: calcChange(curr.avgOrderValue, prev.avgOrderValue),
  };
};

module.exports = { getAnalyticsSummary, getDateRange };