const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateStoreSettings,
  updatePaymentSettings,
  updateShippingSettings,
  updateNotificationSettings,
  changePassword,
  update2FA,
  updateSessionTimeout,
} = require("../../controllers/admin/settings.controller");
const validate = require("../../middlewares/validate.middleware");
const adminValidation = require("../../validations/admin.validation");
const authValidation = require("../../validations/auth.validation");

router.get("/", getSettings);
router.put("/store", validate(adminValidation.updateStoreSettings), updateStoreSettings);
router.put("/payment", validate(adminValidation.updatePaymentSettings), updatePaymentSettings);
router.put("/shipping", validate(adminValidation.updateShippingSettings), updateShippingSettings);
router.put("/notifications", validate(adminValidation.updateNotificationSettings), updateNotificationSettings);
router.post("/security/change-password", validate(authValidation.changePassword), changePassword);
router.put("/security/2fa", validate(adminValidation.update2FA), update2FA);
router.put("/security/session-timeout", validate(adminValidation.updateSessionTimeout), updateSessionTimeout);

module.exports = router;