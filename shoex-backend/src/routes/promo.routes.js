const express = require("express");
const router = express.Router();
const { validatePromo } = require("../controllers/promo.controller");

router.post("/validate", validatePromo);

module.exports = router;