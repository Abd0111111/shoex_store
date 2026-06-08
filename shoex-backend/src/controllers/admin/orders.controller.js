const Order = require("../../models/Order.model");
const { isValidTransition } = require("../../utils/orderStatus");
const { notifyOrderCancelled } = require("../../services/notification.service");
const { sendSuccess, sendError, sendPaginated } = require("../../utils/response");
const paginate = require("../../utils/pagination");

// GET /api/v1/admin/orders
const getOrders = async (req, res, next) => {
  try {
    const {
      search,
      orderStatus,
      paymentStatus,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.email": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
      ];
    }

    // Run both queries in parallel
    const [total, statusCounts, orders] = await Promise.all([
      Order.countDocuments(filter),

      // Status counts always on ALL orders (no filter) for accurate stat cards
      Order.aggregate([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),

      Order.find(filter)
        .sort({ orderStatus: 1, createdAt: -1 })
        .skip(paginate(page, limit, 0).skip)
        .limit(Number(limit)),
    ]);

    const { skip, pagination } = paginate(page, limit, total);

    // Re-sort so "New Order" always comes first
    const sorted = orders.sort((a, b) => {
      if (a.orderStatus === "New Order" && b.orderStatus !== "New Order") return -1;
      if (a.orderStatus !== "New Order" && b.orderStatus === "New Order") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Build status counts map
    const countsMap = statusCounts.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: sorted,
      pagination,
      statusCounts: {
        total: await Order.countDocuments(),
        newOrders: countsMap["New Order"] || 0,
        contacted: countsMap["Contacted"] || 0,
        confirmed: countsMap["Confirmed"] || 0,
        packed: countsMap["Packed"] || 0,
        shipped: countsMap["Shipped"] || 0,
        outForDelivery: countsMap["Out For Delivery"] || 0,
        delivered: countsMap["Delivered"] || 0,
        cancelled: countsMap["Cancelled"] || 0,
        returned: countsMap["Returned"] || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return sendError(res, "Order not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, {
      id: order.orderId,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      products: order.products,
      total: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shippingStatus: order.shippingStatus,
      shippingAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.governorate}`,
      trackingNumber: order.trackingNumber,
      transactionId: order.transactionId,
      notes: order.notes,
      date: order.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return sendError(res, "Order not found", "NOT_FOUND", 404);
    }

    if (!isValidTransition(order.orderStatus, orderStatus)) {
      return sendError(
        res,
        `Cannot transition from "${order.orderStatus}" to "${orderStatus}"`,
        "INVALID_STATUS_TRANSITION",
        400
      );
    }

    order.orderStatus = orderStatus;

    // Auto-update shippingStatus
    if (orderStatus === "Shipped" || orderStatus === "Out For Delivery") {
      order.shippingStatus = "In Transit";
    } else if (orderStatus === "Delivered") {
      order.shippingStatus = "Delivered";
    }

    await order.save();

    // Notify if cancelled
    if (orderStatus === "Cancelled") {
      await notifyOrderCancelled(order);
    }

    return sendSuccess(res, { orderStatus: order.orderStatus }, "Order status updated");
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/orders/:id/payment-status
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { paymentStatus },
      { new: true }
    );

    if (!order) {
      return sendError(res, "Order not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, { paymentStatus: order.paymentStatus }, "Payment status updated");
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/orders/:id/tracking
const updateTracking = async (req, res, next) => {
  try {
    const { trackingNumber } = req.body;
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { trackingNumber },
      { new: true }
    );

    if (!order) {
      return sendError(res, "Order not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, { trackingNumber: order.trackingNumber }, "Tracking number updated");
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/orders/:id/notes
const updateNotes = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { notes },
      { new: true }
    );

    if (!order) {
      return sendError(res, "Order not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, { notes: order.notes }, "Notes updated");
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/orders/export
const exportOrders = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.query;

    const filter = {};
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    if (orders.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`);
      return res.send("No orders found");
    }

    const rows = orders.map((o) => ({
      "Order ID": o.orderId,
      "Customer Name": o.customer.name,
      "Customer Email": o.customer.email,
      "Customer Phone": o.customer.phone,
      "Total": o.total,
      "Order Status": o.orderStatus,
      "Payment Status": o.paymentStatus,
      "Shipping Status": o.shippingStatus,
      "Governorate": o.shippingAddress.governorate,
      "City": o.shippingAddress.city,
      "Address": o.shippingAddress.address,
      "Tracking Number": o.trackingNumber || "",
      "Notes": o.notes || "",
      "Date": new Date(o.createdAt).toLocaleDateString(),
    }));

    const fields = Object.keys(rows[0]);
    const csvData = [
      fields.join(","),
      ...rows.map((r) => fields.map((f) => `"${String(r[f]).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const date = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="orders-${date}.csv"`);
    return res.send(csvData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateTracking,
  updateNotes,
  exportOrders,
};