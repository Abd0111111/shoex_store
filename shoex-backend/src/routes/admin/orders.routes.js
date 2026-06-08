const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateTracking,
  updateNotes,
  exportOrders,
} = require("../../controllers/admin/orders.controller");
const validate = require("../../middlewares/validate.middleware");
const orderValidation = require("../../validations/order.validation");

router.get("/", getOrders);
router.get("/export", exportOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", validate(orderValidation.updateOrderStatus), updateOrderStatus);
router.patch("/:id/payment-status", validate(orderValidation.updatePaymentStatus), updatePaymentStatus);
router.patch("/:id/tracking", validate(orderValidation.updateTracking), updateTracking);
router.patch("/:id/notes", validate(orderValidation.updateNotes), updateNotes);

module.exports = router;