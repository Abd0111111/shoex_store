const Joi = require("joi");

// --- Team ---
const createTeamMember = Joi.object({
  name: Joi.string().trim().min(2).required().messages({
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("admin", "editor", "viewer").required().messages({
    "any.only": "Role must be admin, editor, or viewer",
    "any.required": "Role is required",
  }),
});

const updateTeamMember = Joi.object({
  name: Joi.string().trim().min(2).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid("admin", "editor", "viewer").optional().messages({
    "any.only": "Role must be admin, editor, or viewer",
  }),
  // ✅ password مضاف — optional في الـ update
  password: Joi.string().min(6).optional().allow("").messages({
    "string.min": "Password must be at least 6 characters",
  }),
});

// --- Customer ---
const updateCustomerStatus = Joi.object({
  status: Joi.string().valid("Active", "Inactive").required().messages({
    "any.only": "Status must be Active or Inactive",
    "any.required": "Status is required",
  }),
});

// --- Settings ---
const updateStoreSettings = Joi.object({
  storeName: Joi.string().trim().optional(),
  storeUrl: Joi.string().optional(),
  storeEmail: Joi.string().email().optional(),
  storePhone: Joi.string().optional(),
  storeAddress: Joi.string().optional(),
  taxId: Joi.string().allow("", null).optional(),
  bizType: Joi.string().optional(),
  currency: Joi.string().valid("USD", "EUR", "GBP", "EGP", "AED", "SAR").optional().messages({
    "any.only": "Invalid currency",
  }),
  timezone: Joi.string().optional(),
  language: Joi.string().valid("English", "Arabic", "French", "Spanish").optional().messages({
    "any.only": "Invalid language",
  }),
  prefs: Joi.object({
    enableReviews: Joi.boolean().optional(),
    guestCheckout: Joi.boolean().optional(),
    orderEmails: Joi.boolean().optional(),
    newsletter: Joi.boolean().optional(),
    showOutOfStock: Joi.boolean().optional(),
    maintenanceMode: Joi.boolean().optional(),
  }).optional(),
});

const updatePaymentSettings = Joi.object({
  stripeEnabled: Joi.boolean().optional(),
  stripeKey: Joi.string().allow(null, "").optional(),
  paypalEnabled: Joi.boolean().optional(),
  paypalClientId: Joi.string().allow(null, "").optional(),
  cashOnDelivery: Joi.boolean().optional(),
  testMode: Joi.boolean().optional(),
});

const updateShippingSettings = Joi.object({
  freeShippingThreshold: Joi.number().min(0).optional(),
  processingDays: Joi.number().min(0).optional(),
  locations: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        city: Joi.string().optional(),
        rate: Joi.number().min(0).optional(),
        deliveryDays: Joi.string().optional(),
        isCustom: Joi.boolean().optional(),
      })
    )
    .optional(),
});

const updateNotificationSettings = Joi.object({
  newOrder: Joi.boolean().optional(),
  lowStock: Joi.boolean().optional(),
  newReview: Joi.boolean().optional(),
  newCustomer: Joi.boolean().optional(),
  dailyReport: Joi.boolean().optional(),
  weeklyReport: Joi.boolean().optional(),
  emailRecipient: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),
});

const update2FA = Joi.object({
  enabled: Joi.boolean().required().messages({
    "any.required": "Enabled field is required",
  }),
});

const updateSessionTimeout = Joi.object({
  timeoutMinutes: Joi.number().min(5).max(1440).required().messages({
    "number.min": "Session timeout must be at least 5 minutes",
    "number.max": "Session timeout cannot exceed 24 hours",
    "any.required": "Timeout minutes is required",
  }),
});

// --- Inventory ---
const updateInventoryStock = Joi.object({
  stock: Joi.number().min(0).required().messages({
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),
});

module.exports = {
  createTeamMember,
  updateTeamMember,
  updateCustomerStatus,
  updateStoreSettings,
  updatePaymentSettings,
  updateShippingSettings,
  updateNotificationSettings,
  update2FA,
  updateSessionTimeout,
  updateInventoryStock,
};