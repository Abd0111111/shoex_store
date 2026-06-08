const express = require("express");
const router = express.Router();
const ShippingZone = require("../models/ShippingZone.model");
const { sendSuccess } = require("../utils/response");

router.get("/rates", async (req, res, next) => {
  try {
    const zones = await ShippingZone.find().sort({ city: 1 });
    const rates = zones.map((z) => ({
      governorate: z.city,
      cost: z.rate,
      currency: "EGP",
      deliveryDays: z.deliveryDays,
    }));
    return sendSuccess(res, rates);
  } catch (error) {
    next(error);
  }
});

module.exports = router;