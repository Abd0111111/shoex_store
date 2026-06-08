const express = require("express");
const router = express.Router();
const { getInventory, updateInventoryStock } = require("../../controllers/admin/inventory.controller");

router.get("/", getInventory);
router.patch("/:id/stock", updateInventoryStock);

module.exports = router;