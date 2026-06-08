const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require("../../controllers/admin/notifications.controller");

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;