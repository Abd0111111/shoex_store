const Joi = require("joi");

const createPromoCode = Joi.object({
  code: Joi.string().trim().uppercase().min(3).required().messages({
    "any.required": "Promo code is required",
    "string.min": "Promo code must be at least 3 characters",
    "string.empty": "Promo code cannot be empty",
  }),
  discountType: Joi.string().valid("percentage", "fixed").required().messages({
    "any.only": "Discount type must be percentage or fixed",
    "any.required": "Discount type is required",
  }),
  discountValue: Joi.number().min(0).required().messages({
    "number.min": "Discount value cannot be negative",
    "any.required": "Discount value is required",
  }),
  minOrderValue: Joi.number().min(0).optional().default(0).messages({
    "number.min": "Minimum order value cannot be negative",
  }),
  maxUses: Joi.number().min(1).optional().allow(null).default(null).messages({
    "number.min": "Maximum uses must be at least 1",
  }),
  expiresAt: Joi.date().iso().optional().allow(null).default(null).messages({
    "date.format": "Expiration date must be a valid ISO date",
  }),
  isActive: Joi.boolean().optional().default(true),
});

const updatePromoCode = Joi.object({
  code: Joi.string().trim().uppercase().min(3).optional().messages({
    "string.min": "Promo code must be at least 3 characters",
  }),
  discountType: Joi.string().valid("percentage", "fixed").optional().messages({
    "any.only": "Discount type must be percentage or fixed",
  }),
  discountValue: Joi.number().min(0).optional().messages({
    "number.min": "Discount value cannot be negative",
  }),
  minOrderValue: Joi.number().min(0).optional().messages({
    "number.min": "Minimum order value cannot be negative",
  }),
  maxUses: Joi.number().min(1).optional().allow(null).messages({
    "number.min": "Maximum uses must be at least 1",
  }),
  expiresAt: Joi.date().iso().optional().allow(null).messages({
    "date.format": "Expiration date must be a valid ISO date",
  }),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createPromoCode,
  updatePromoCode,
};
