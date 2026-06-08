const express = require("express");
const router = express.Router();
const { getAnalytics, exportAnalytics } = require("../../controllers/admin/analytics.controller");

router.get("/", getAnalytics);
router.get("/export", exportAnalytics);

module.exports = router;