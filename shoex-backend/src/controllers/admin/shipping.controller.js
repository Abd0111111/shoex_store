const Order = require("../../models/Order.model");
const { sendSuccess } = require("../../utils/response");

// GET /api/v1/admin/shipping/active
const getActiveShipments = async (req, res, next) => {
  try {
    const [stats, activeShipments] = await Promise.all([
      Promise.all([
        Order.countDocuments({ orderStatus: "Confirmed" }),
        Order.countDocuments({ orderStatus: { $in: ["Shipped", "Out For Delivery"] } }),
        Order.countDocuments({ orderStatus: "Delivered" }),
        Order.countDocuments({ shippingStatus: "Failed" }),
      ]),
      Order.find({
        orderStatus: { $in: ["Packed", "Shipped", "Out For Delivery"] },
      })
        .sort({ createdAt: -1 })
        .limit(50),
    ]);

    return sendSuccess(res, {
      stats: {
        awaitingShipment: stats[0],
        inTransit: stats[1],
        delivered: stats[2],
        failedDeliveries: stats[3],
      },
      activeShipments: activeShipments.map((o) => ({
        id: o.orderId,
        customerName: o.customer.name,
        shippingAddress: `${o.shippingAddress.address}, ${o.shippingAddress.city}, ${o.shippingAddress.governorate}`,
        orderStatus: o.orderStatus,
        shippingStatus: o.shippingStatus,
        trackingNumber: o.trackingNumber,
        date: o.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActiveShipments };