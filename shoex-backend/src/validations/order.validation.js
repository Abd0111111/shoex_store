const Joi = require("joi");

const orderItemSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "Product ID is required",
  }),
  name: Joi.string().required(),
  image: Joi.string().uri().required(),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().min(1).required().messages({
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
  size: Joi.number().required().messages({
    "any.required": "Size is required",
  }),
  color: Joi.string().allow(null, "").default(null),
});

const createOrder = Joi.object({
  customer: Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Customer name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email",
      "any.required": "Customer email is required",
    }),
    phone: Joi.string()
      .pattern(/^01[0125][0-9]{8}$/)
      .required()
      .messages({
        "string.pattern.base": "Please provide a valid Egyptian phone number",
        "any.required": "Customer phone is required",
      }),
    altPhone: Joi.string()
      .pattern(/^01[0125][0-9]{8}$/)
      .allow(null, "")
      .default(null),
  }).required(),

  shippingAddress: Joi.object({
    country: Joi.string().default("Egypt"),
    governorate: Joi.string().required().messages({
      "any.required": "Governorate is required",
    }),
    city: Joi.string().required().messages({
      "any.required": "City is required",
    }),
    address: Joi.string().required().messages({
      "any.required": "Address is required",
    }),
    apartment: Joi.string().allow(null, "").default(null),
  }).required(),

  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    "array.min": "Order must have at least one item",
    "any.required": "Order items are required",
  }),

  subtotal: Joi.number().min(0).required(),
  shippingCost: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
  promoCode: Joi.string().allow(null, "").default(null),
  feedback: Joi.string().allow(null, "").default(null),
});

const updateOrderStatus = Joi.object({
  orderStatus: Joi.string()
    .valid(
      "New Order",
      "Contacted",
      "Confirmed",
      "Packed",
      "Shipped",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
      "Returned"
    )
    .required()
    .messages({
      "any.only": "Invalid order status",
      "any.required": "Order status is required",
    }),
});

const updatePaymentStatus = Joi.object({
  paymentStatus: Joi.string()
    .valid("Paid", "Pending", "Failed", "Refunded")
    .required()
    .messages({
      "any.only": "Invalid payment status",
      "any.required": "Payment status is required",
    }),
});

const updateTracking = Joi.object({
  trackingNumber: Joi.string().required().messages({
    "any.required": "Tracking number is required",
  }),
});

const updateNotes = Joi.object({
  notes: Joi.string().allow("", null).required().messages({
    "any.required": "Notes field is required",
  }),
});

module.exports = {
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  updateTracking,
  updateNotes,
};