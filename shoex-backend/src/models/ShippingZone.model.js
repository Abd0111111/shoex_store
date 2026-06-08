const mongoose = require("mongoose");

const shippingZoneSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, "City is required"],
      unique: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate cannot be negative"],
    },
    deliveryDays: {
      type: String,
      required: [true, "Delivery days is required"],
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);



module.exports = mongoose.model("ShippingZone", shippingZoneSchema);