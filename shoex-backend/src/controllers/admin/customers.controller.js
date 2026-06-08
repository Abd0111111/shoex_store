const User = require("../../models/User.model");
const Order = require("../../models/Order.model");
const { sendSuccess, sendError, sendPaginated } = require("../../utils/response");
const paginate = require("../../utils/pagination");

// GET /api/v1/admin/customers
const getCustomers = async (req, res, next) => {
  try {
    const {
      search,
      status,
      sortBy = "createdAt",
      sortDir = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { role: "user" };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };
    const total = await User.countDocuments(filter);
    const { skip, pagination } = paginate(page, limit, total);

    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pagination.limit);

    // Get order stats per customer
    const customers = await Promise.all(
      users.map(async (user) => {
        const orderStats = await Order.aggregate([
          { $match: { "customer.email": user.email, orderStatus: { $ne: "Cancelled" } } },
          { $group: { _id: null, totalSpent: { $sum: "$total" }, totalOrders: { $sum: 1 }, lastPurchase: { $max: "$createdAt" } } },
        ]);

        const stats = orderStats[0] || { totalSpent: 0, totalOrders: 0, lastPurchase: null };

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          totalSpent: parseFloat((stats.totalSpent || 0).toFixed(2)),
          totalOrders: stats.totalOrders || 0,
          lastPurchase: stats.lastPurchase || null,
          joinedDate: user.createdAt,
          status: user.status,
        };
      })
    );

    // Aggregates
    const aggregates = await Order.aggregate([
      { $match: { orderStatus: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" }, totalOrders: { $sum: 1 }, avgOrderValue: { $avg: "$total" } } },
    ]);

    const agg = aggregates[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    return res.status(200).json({
      success: true,
      data: customers,
      pagination,
      aggregates: {
        totalRevenue: parseFloat((agg.totalRevenue || 0).toFixed(2)),
        totalOrders: agg.totalOrders || 0,
        avgOrderValue: parseFloat((agg.avgOrderValue || 0).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/customers/:id/status
const updateCustomerStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!user) {
      return sendError(res, "Customer not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, { id: user._id, status: user.status }, "Customer status updated");
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/customers/export
const exportCustomers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });

    const rows = users.map((u) => ({
      "Name": u.name,
      "Email": u.email,
      "Phone": u.phone || "",
      "Status": u.status,
      "Joined Date": new Date(u.createdAt).toISOString(),
    }));

    const { format } = require("@fast-csv/format");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="customers-${new Date().toISOString().split("T")[0]}.csv"`
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

module.exports = { getCustomers, updateCustomerStatus, exportCustomers };