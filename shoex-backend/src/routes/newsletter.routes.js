const express = require("express");
const router = express.Router();
const Newsletter = require("../models/Newsletter.model");
const { sendSuccess, sendError } = require("../utils/response");
const Joi = require("joi");
const validate = require("../middlewares/validate.middleware");

const subscribeSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
});

router.post("/subscribe", validate(subscribeSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      // بنرجع success عشان مش بنكشف إن الإيميل موجود
      return sendSuccess(res, null, "Subscribed successfully");
    }

    await Newsletter.create({ email });
    return sendSuccess(res, null, "Subscribed successfully");
  } catch (error) {
    if (error.code === 11000) {
      return sendSuccess(res, null, "Subscribed successfully");
    }
    next(error);
  }
});

module.exports = router;