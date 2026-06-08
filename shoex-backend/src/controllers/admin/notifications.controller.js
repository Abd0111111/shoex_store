const Notification = require("../../models/Notification.model");
const { sendSuccess, sendPaginated } = require("../../utils/response");
const paginate = require("../../utils/pagination");

// GET /api/v1/admin/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const filter = {};
    if (unreadOnly === "true") filter.read = false;

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ read: false });
    const { skip, pagination } = paginate(page, limit, total);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: { ...pagination, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    return sendSuccess(res, null, "Notification marked as read");
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ read: false }, { read: true });
    return sendSuccess(res, { updatedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };