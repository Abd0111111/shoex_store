const express = require("express");
const router = express.Router();
const {
  getProducts,
  getCategories,
  getProductById,
  getProductReviews,
  createProductReview,
} = require("../controllers/product.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const Joi = require("joi");

// Inline validation for review — بسيطة ومش محتاجة ملف منفصل
const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required().messages({
    "number.min": "Rating must be between 1 and 5",
    "number.max": "Rating must be between 1 and 5",
    "any.required": "Rating is required",
  }),
  comment: Joi.string().trim().min(10).max(500).required().messages({
    "string.min": "Comment must be at least 10 characters",
    "string.max": "Comment cannot exceed 500 characters",
    "any.required": "Comment is required",
  }),
});

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductById);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", verifyToken, validate(reviewSchema), createProductReview);

module.exports = router;