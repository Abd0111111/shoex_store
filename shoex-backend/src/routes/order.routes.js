const express = require("express");
const router = express.Router();
const { createOrder } = require("../controllers/order.controller");
const { optionalAuth } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const orderValidation = require("../validations/order.validation");

router.post("/", optionalAuth, validate(orderValidation.createOrder), createOrder);

module.exports = router;