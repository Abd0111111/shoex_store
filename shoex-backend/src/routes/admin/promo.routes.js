const express = require("express");
const router = express.Router();
const {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} = require("../../controllers/admin/promo.controller");
const validate = require("../../middlewares/validate.middleware");
const { createPromoCode: createSchema, updatePromoCode: updateSchema } = require("../../validations/promo.validation");

router.get("/", getPromoCodes);
router.post("/", validate(createSchema), createPromoCode);
router.put("/:id", validate(updateSchema), updatePromoCode);
router.delete("/:id", deletePromoCode);

module.exports = router;
