const express = require("express");
const router = express.Router();
const { getActiveShipments } = require("../../controllers/admin/shipping.controller");

router.get("/active", getActiveShipments);

module.exports = router;