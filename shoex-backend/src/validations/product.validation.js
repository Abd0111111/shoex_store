const Joi = require("joi");

const colorSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Color name is required",
  }),
  hex: Joi.string()
    .pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .required()
    .messages({
      "string.pattern.base": "Color hex must be a valid hex code (e.g. #ffffff)",
      "any.required": "Color hex is required",
    }),
});

const sizeStockSchema = Joi.object({
  size: Joi.number().required().messages({
    "any.required": "Size is required",
  }),
  stock: Joi.number().min(0).required().messages({
    "number.min": "Size stock cannot be negative",
    "any.required": "Size stock is required",
  }),
});

const createProduct = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Product name is required",
  }),
  brand: Joi.string().trim().default("SHOEX"),
  category: Joi.string()
    .valid("Lifestyle", "Running", "Basketball", "Casual", "Training", "Streetwear", "Skateboarding")
    .required()
    .messages({
      "any.only": "Invalid category",
      "any.required": "Category is required",
    }),
  description: Joi.string().required().messages({
    "any.required": "Description is required",
  }),
  tags: Joi.array().items(Joi.string()).default([]),
  images: Joi.array().items(Joi.string().uri()).min(1).required().messages({
    "array.min": "At least one image is required",
    "any.required": "Images are required",
  }),
  backgroundImageIndex: Joi.number().min(0).default(0),
  price: Joi.number().min(0).required().messages({
    "number.min": "Price cannot be negative",
    "any.required": "Price is required",
  }),
  originalPrice: Joi.number().min(0).allow(null).default(null),
  stock: Joi.number().min(0).required().messages({
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),
  sizeStocks: Joi.array().items(sizeStockSchema).default([]),
  sizes: Joi.array().items(Joi.number()).default([]),
  colors: Joi.array().items(colorSchema).default([]),
  sku: Joi.string().trim().allow(null, "").default(null),
  weight: Joi.number().min(0).allow(null).default(null),
  featured: Joi.boolean().default(false),
  status: Joi.string().valid("Active", "Draft", "Archived").default("Active"),
});

const updateProduct = createProduct.fork(
  ["name", "category", "description", "images", "price", "stock"],
  (field) => field.optional()
);

const applyDiscount = Joi.object({
  discountPercent: Joi.number().min(1).max(99).required().messages({
    "number.min": "Discount must be at least 1%",
    "number.max": "Discount cannot exceed 99%",
    "any.required": "Discount percent is required",
  }),
});

const updateStock = Joi.object({
  stock: Joi.number().min(0).required().messages({
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),
});

module.exports = {
  createProduct,
  updateProduct,
  applyDiscount,
  updateStock,
};