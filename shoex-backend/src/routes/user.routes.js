const express = require("express");
const router = express.Router();
const {
  getMyOrders,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const Joi = require("joi");

// Validations
const addToWishlistSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "Product ID is required",
  }),
});

const updateAddressSchema = Joi.object({
  country: Joi.string().allow("", null).default("Egypt"),
  governorate: Joi.string().required().messages({
    "any.required": "Governorate is required",
  }),
  city: Joi.string().required().messages({
    "any.required": "City is required",
  }),
  address: Joi.string().required().messages({
    "any.required": "Address is required",
  }),
  apartment: Joi.string().allow("", null).default(null),
});

// All routes require authentication
router.use(verifyToken);

router.get("/me/orders", getMyOrders);
router.get("/me/wishlist", getWishlist);
router.post("/me/wishlist", validate(addToWishlistSchema), addToWishlist);
router.delete("/me/wishlist/:productId", removeFromWishlist);
router.get("/me/address", getAddress);
router.put("/me/address", validate(updateAddressSchema), updateAddress);
router.delete("/me/address", deleteAddress);

module.exports = router;