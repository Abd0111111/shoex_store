const express = require("express");
const router = express.Router();
const {
  getCustomers,
  updateCustomerStatus,
  exportCustomers,
} = require("../../controllers/admin/customers.controller");
const validate = require("../../middlewares/validate.middleware");
const adminValidation = require("../../validations/admin.validation");

router.get("/", getCustomers);
router.get("/export", exportCustomers);
router.patch("/:id/status", validate(adminValidation.updateCustomerStatus), updateCustomerStatus);

module.exports = router;