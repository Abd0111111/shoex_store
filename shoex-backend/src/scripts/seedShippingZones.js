/**
 * seedShippingZones.js
 *
 * One-time script to load/update the Cheetah Logistics shipping rate card
 * into the ShippingZone collection.
 *
 * HOW TO RUN:
 *   1. Place this file anywhere in your backend project (e.g. src/scripts/).
 *   2. Adjust the two lines marked "ADJUST ME" below to match your project's
 *      Mongo connection string and the exact path to your ShippingZone model.
 *   3. From the backend root, run:
 *        node src/scripts/seedShippingZones.js
 *
 * SAFE TO RE-RUN: uses upsert on `city`, so running it twice won't create
 * duplicates — it will just update the rate/deliveryDays if they changed.
 *
 * NOTE ON DELIVERY TIMES: the rate card gives delivery in hours. Converted
 * to days here (÷24) with +1 day added as a safety margin on top of the
 * paper's own estimate, then mapped to the closest option in the admin
 * panel's fixed delivery-days dropdown (1-2 / 2-3 / 3-4 / 3-5 / 5-7 Days,
 * 1 Week, 2 Weeks) so seeded zones stay consistent with what the UI offers.
 */

const mongoose = require("mongoose");
require("dotenv").config();

// ── ADJUST ME: point this to your actual Mongo connection string ──
const MONGO_URI = "mongodb+srv://boodymns_db_user:boodymansy12122004@shoex.fsdu9ra.mongodb.net/shoex?appName=shoex";
// ── ADJUST ME: point this to your actual ShippingZone model file ──
const ShippingZone = require("../models/ShippingZone.model");

// Cheetah Logistics rate card (flat rate per governorate, no weight tiers)
const ZONES = [
  // 75 EGP — paper: 24h -> +1 day margin
  { city: "Cairo", rate: 75, deliveryDays: "1-2 Days" },
  { city: "Giza", rate: 75, deliveryDays: "1-2 Days" },

  // 85 EGP — paper: 48h -> +1 day margin (Cairo/Giza satellite cities & compounds)
  { city: "New Cairo", rate: 85, deliveryDays: "3-4 Days" },
  { city: "Madinaty", rate: 85, deliveryDays: "3-4 Days" },
  { city: "El Shorouk", rate: 85, deliveryDays: "3-4 Days" },
  { city: "El Obour", rate: 85, deliveryDays: "3-4 Days" },
  { city: "Badr City", rate: 85, deliveryDays: "3-4 Days" },
  { city: "6th of October", rate: 85, deliveryDays: "3-4 Days" },
  { city: "Sheikh Zayed", rate: 85, deliveryDays: "3-4 Days" },
  { city: "15 May City", rate: 85, deliveryDays: "3-4 Days" },
  { city: "Hadayek El Ahram", rate: 85, deliveryDays: "3-4 Days" },
  { city: "Helwan", rate: 85, deliveryDays: "3-4 Days" },

  // 95 EGP — paper: 48h -> +1 day margin
  { city: "Alexandria", rate: 95, deliveryDays: "3-4 Days" },

  // 95 EGP — paper: 72-96h -> +1 day margin (Delta governorates)
  { city: "Sharqia", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Dakahlia", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Qalyubia", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Gharbia", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Kafr El Sheikh", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Damietta", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Ismailia", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Port Said", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Suez", rate: 95, deliveryDays: "3-5 Days" },
  { city: "Beheira", rate: 95, deliveryDays: "3-5 Days" },

  // 105 EGP — paper: 72-96h -> +1 day margin
  { city: "Fayoum", rate: 105, deliveryDays: "3-5 Days" },
  { city: "Beni Suef", rate: 105, deliveryDays: "3-5 Days" },
  { city: "Minya", rate: 105, deliveryDays: "3-5 Days" },
  { city: "Assiut", rate: 105, deliveryDays: "3-5 Days" },
  { city: "Sohag", rate: 105, deliveryDays: "3-5 Days" },

  // 115 EGP — paper: 72-96h -> +1 day margin
  { city: "Qena", rate: 115, deliveryDays: "3-5 Days" },
  { city: "Luxor", rate: 115, deliveryDays: "3-5 Days" },
  { city: "Aswan", rate: 115, deliveryDays: "3-5 Days" },

  // 140 EGP — paper: 96-120h -> +1 day margin
  { city: "North Coast", rate: 140, deliveryDays: "5-7 Days" },
  { city: "Hurghada", rate: 140, deliveryDays: "5-7 Days" },
  { city: "Marsa Matrouh", rate: 140, deliveryDays: "5-7 Days" },
];

async function run() {
  if (!MONGO_URI) {
    console.error("❌ No Mongo connection string found. Set MONGODB_URI (or MONGO_URI) in your .env, or hardcode it in this script.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  let created = 0;
  let updated = 0;

  for (const zone of ZONES) {
    const result = await ShippingZone.findOneAndUpdate(
      { city: zone.city },
      { $set: { rate: zone.rate, deliveryDays: zone.deliveryDays, isCustom: false } },
      { upsert: true, new: true, rawResult: true }
    );

    if (result.lastErrorObject?.updatedExisting) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`✅ Done. Created: ${created}, Updated: ${updated}, Total zones: ${ZONES.length}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});