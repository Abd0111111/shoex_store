const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    store: {
      storeName: { type: String, default: "SHOEX Store" },
      storeUrl: { type: String, default: "shoex.com" },
      storeEmail: { type: String, default: "contact@shoex.com" },
      storePhone: { type: String, default: "+20 106 363 8026" },
      storeAddress: {
        type: String,
        default: "123 Commerce Street, Cairo, Egypt",
      },
      taxId: { type: String, default: "" },
      bizType: { type: String, default: "E-commerce" },
      currency: { type: String, default: "EGP" },
      timezone: { type: String, default: "Africa/Cairo" },
      language: { type: String, default: "English" },
      prefs: {
        enableReviews: { type: Boolean, default: true },
        guestCheckout: { type: Boolean, default: true },
        orderEmails: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: false },
        showOutOfStock: { type: Boolean, default: true },
        maintenanceMode: { type: Boolean, default: false },
      },
    },
    payment: {
      stripeEnabled: { type: Boolean, default: false },
      stripeKey: { type: String, default: null, select: false },
      paypalEnabled: { type: Boolean, default: false },
      paypalClientId: { type: String, default: null, select: false },
      cashOnDelivery: { type: Boolean, default: true },
      testMode: { type: Boolean, default: true },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 500 },
      processingDays: { type: Number, default: 1 },
    },
    notifications: {
      newOrder: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true },
      newReview: { type: Boolean, default: false },
      newCustomer: { type: Boolean, default: true },
      dailyReport: { type: Boolean, default: false },
      weeklyReport: { type: Boolean, default: true },
      emailRecipient: { type: String, default: "contact@shoex.com" },
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      sessionTimeout: { type: Number, default: 60 },
    },
  },
  {
    timestamps: true,
  }
);

// Static method — دايما نرجع الـ document الوحيد
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);