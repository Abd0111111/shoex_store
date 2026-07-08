const PromoCode = require("../../models/PromoCode.model");
const { sendSuccess, sendError } = require("../../utils/response");

// GET /api/v1/admin/promo
const getPromoCodes = async (req, res, next) => {
  try {
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
    return sendSuccess(res, promoCodes, "Promo codes retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/promo
const createPromoCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      return sendError(
        res,
        "Promo code already exists",
        "DUPLICATE_ERROR",
        400
      );
    }

    const promoCode = await PromoCode.create({
      ...req.body,
      code: code.toUpperCase(),
    });

    return sendSuccess(
      res,
      promoCode,
      "Promo code created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/promo/:id
const updatePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code } = req.body;

    if (code) {
      const existingPromo = await PromoCode.findOne({
        code: code.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingPromo) {
        return sendError(
          res,
          "Promo code already exists",
          "DUPLICATE_ERROR",
          400
        );
      }
      req.body.code = code.toUpperCase();
    }

    const promoCode = await PromoCode.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!promoCode) {
      return sendError(res, "Promo code not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, promoCode, "Promo code updated successfully");
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/admin/promo/:id
const deletePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const promoCode = await PromoCode.findByIdAndDelete(id);

    if (!promoCode) {
      return sendError(res, "Promo code not found", "NOT_FOUND", 404);
    }

    return sendSuccess(res, null, "Promo code deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
