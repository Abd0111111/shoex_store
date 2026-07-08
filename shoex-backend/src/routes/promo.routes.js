const express = require("express");
const router = express.Router();
const { validatePromo, getActivePromo } = require("../controllers/promo.controller");

router.get("/active", getActivePromo);
router.post("/validate", validatePromo);

module.exports = router;