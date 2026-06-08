const ShippingZone = require("../models/ShippingZone.model");

const shippingZones = [
  { city: "Cairo",          rate: 65,  deliveryDays: "1-2 Days", isCustom: false },
  { city: "Giza",           rate: 65,  deliveryDays: "1-2 Days", isCustom: false },
  { city: "Alexandria",     rate: 85,  deliveryDays: "2-3 Days", isCustom: false },
  { city: "Dakahlia",       rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Red Sea",        rate: 120, deliveryDays: "3-4 Days", isCustom: false },
  { city: "Beheira",        rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Fayoum",         rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Gharbia",        rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Ismailia",       rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Monufia",        rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Minya",          rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Qalyubia",       rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "New Valley",     rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Sharqia",        rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Suez",           rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Aswan",          rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Asyut",          rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Beni Suef",      rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Port Said",      rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Damietta",       rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "South Sinai",    rate: 120, deliveryDays: "3-4 Days", isCustom: false },
  { city: "Kafr El Sheikh", rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Matrouh",        rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Luxor",          rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Qena",           rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "Sohag",          rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
  { city: "North Sinai",    rate: 90,  deliveryDays: "3-5 Days", isCustom: false },
];

const seedShippingZones = async () => {
  try {
    const count = await ShippingZone.countDocuments({ isCustom: false });
    if (count > 0) {
      console.log("⏭️  Shipping zones already seeded — skipping");
      return;
    }
    await ShippingZone.insertMany(shippingZones);
    console.log(`✅ Shipping zones seeded — ${shippingZones.length} zones added`);
  } catch (error) {
    console.error("❌ Shipping zones seed error:", error.message);
    throw error;
  }
};

module.exports = seedShippingZones;