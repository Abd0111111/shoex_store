const Feedback = require("../../models/Feedback.model");
const { sendPaginated } = require("../../utils/response");
const paginate = require("../../utils/pagination");

// GET /api/v1/admin/feedback
const getFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const total = await Feedback.countDocuments();
    const { skip, pagination } = paginate(page, limit, total);

    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pagination.limit);

    return sendPaginated(res, feedbacks, pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = { getFeedback };