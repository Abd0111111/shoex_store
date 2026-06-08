const express = require("express");
const router = express.Router();
const { getFeedback } = require("../../controllers/admin/feedback.controller");

router.get("/", getFeedback);

module.exports = router;