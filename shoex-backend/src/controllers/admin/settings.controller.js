const Settings = require("../../models/Settings.model");
const User = require("../../models/User.model");
const bcrypt = require("bcryptjs");
const { sendSuccess, sendError } = require("../../utils/response");
const ShippingZone = require("../../models/ShippingZone.model");

// GET /api/v1/admin/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();

    // Mask payment keys
    const data = settings.toObject();
    if (data.payment.stripeKey) {
      data.payment.stripeKeyMasked = `sk_test_****${data.payment.stripeKey.slice(-4)}`;
    } else {
      data.payment.stripeKeyMasked = null;
    }
    if (data.payment.paypalClientId) {
      data.payment.paypalClientIdMasked = `****${data.payment.paypalClientId.slice(-4)}`;
    } else {
      data.payment.paypalClientIdMasked = null;
    }
    delete data.payment.stripeKey;
    delete data.payment.paypalClientId;

    // Get shipping zones
    const zones = await ShippingZone.find().sort({ city: 1 });
    data.shipping.locations = zones.map((z) => ({
      id: z._id,
      city: z.city,
      rate: z.rate,
      deliveryDays: z.deliveryDays,
      isCustom: z.isCustom,
    }));

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/store
const updateStoreSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    settings.store = { ...settings.store.toObject(), ...req.body };
    await settings.save();
    return sendSuccess(res, settings.store, "Store settings updated");
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/payment
const updatePaymentSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    const { stripeKey, paypalClientId, ...rest } = req.body;

    settings.payment = { ...settings.payment.toObject(), ...rest };
    if (stripeKey) settings.payment.stripeKey = stripeKey;
    if (paypalClientId) settings.payment.paypalClientId = paypalClientId;

    await settings.save();
    return sendSuccess(res, null, "Payment settings updated");
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/shipping
const updateShippingSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    const { freeShippingThreshold, processingDays, locations } = req.body;

    if (freeShippingThreshold !== undefined)
      settings.shipping.freeShippingThreshold = freeShippingThreshold;
    if (processingDays !== undefined)
      settings.shipping.processingDays = processingDays;

    await settings.save();

    // Update shipping zones
    if (locations && Array.isArray(locations)) {
      for (const loc of locations) {
        const zone = await ShippingZone.findById(loc.id);
        if (!zone) continue;

        // isCustom: false — only rate and deliveryDays editable
        if (!zone.isCustom) {
          zone.rate = loc.rate ?? zone.rate;
          zone.deliveryDays = loc.deliveryDays ?? zone.deliveryDays;
        } else {
          // isCustom: true — fully editable
          zone.city = loc.city ?? zone.city;
          zone.rate = loc.rate ?? zone.rate;
          zone.deliveryDays = loc.deliveryDays ?? zone.deliveryDays;
        }
        await zone.save();
      }
    }

    return sendSuccess(res, null, "Shipping settings updated");
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/notifications
const updateNotificationSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    settings.notifications = { ...settings.notifications.toObject(), ...req.body };
    await settings.save();
    return sendSuccess(res, settings.notifications, "Notification settings updated");
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/settings/security/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return sendError(res, "Current password is incorrect", "VALIDATION_ERROR", 400);
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/security/2fa
const update2FA = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    settings.security.twoFactorEnabled = req.body.enabled;
    await settings.save();
    return sendSuccess(res, null, "2FA settings updated");
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings/security/session-timeout
const updateSessionTimeout = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    settings.security.sessionTimeout = req.body.timeoutMinutes;
    await settings.save();
    return sendSuccess(res, null, "Session timeout updated");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateStoreSettings,
  updatePaymentSettings,
  updateShippingSettings,
  updateNotificationSettings,
  changePassword,
  update2FA,
  updateSessionTimeout,
};