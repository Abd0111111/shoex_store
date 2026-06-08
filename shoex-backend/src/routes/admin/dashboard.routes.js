const express = require("express");
const router = express.Router();
const { getDashboardStats, getRecentOrders, getLowStockProducts } = require("../../controllers/admin/dashboard.controller");

router.get("/stats", getDashboardStats);
router.get("/recent-orders", getRecentOrders);
router.get("/low-stock", getLowStockProducts);

module.exports = router;