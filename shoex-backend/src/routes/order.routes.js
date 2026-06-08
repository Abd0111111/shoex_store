const express = require("express");
const router = express.Router();
const { createOrder } = require("../controllers/order.controller");
const validate = require("../middlewares/validate.middleware");
const orderValidation = require("../validations/order.validation");

router.post("/", validate(orderValidation.createOrder), createOrder);

module.exports = router;