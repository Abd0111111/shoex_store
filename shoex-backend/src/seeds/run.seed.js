require("dotenv").config();
const connectDB = require("../config/db");
const seedShippingZones = require("./shippingZones.seed");
const seedAdminUser = require("./adminUser.seed");

const runSeeds = async () => {
  try {
    await connectDB();
    console.log("🌱 Running seeds...\n");

    await seedShippingZones();
    await seedAdminUser();

    console.log("\n✅ All seeds completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

runSeeds();