const PromoCode = require("../models/PromoCode.model");
const { sendSuccess, sendError } = require("../utils/response");

// POST /api/v1/promo/validate
const validatePromo = async (req, res, next) => {
  try {
    const { code } = req.body;

    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!promo) {
      return sendError(
        res,
        "Promo code not found or expired.",
        "INVALID_PROMO",
        404
      );
    }

    // Check expiry
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return sendError(
        res,
        "Promo code has expired.",
        "INVALID_PROMO",
        404
      );
    }

    // Check max uses
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return sendError(
        res,
        "Promo code usage limit reached.",
        "INVALID_PROMO",
        404
      );
    }

    return sendSuccess(res, {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderValue: promo.minOrderValue,
      expiresAt: promo.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/promo/active
const getActivePromo = async (req, res, next) => {
  try {
    const now = new Date();
    const promo = await PromoCode.findOne({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 });

    return sendSuccess(res, promo, "Active promo retrieved successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { validatePromo, getActivePromo };