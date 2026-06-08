const User = require("../models/User.model");

const seedAdminUser = async () => {
  try {
    const existing = await User.findOne({ isOwner: true });
    if (existing) {
      console.log("⏭️  Owner account already exists — skipping");
      return;
    }

    await User.create({
      name: process.env.OWNER_NAME || "Store Owner",
      email: process.env.OWNER_EMAIL,
      password: process.env.OWNER_PASSWORD,
      role: "owner",
      isOwner: true,
      phone: "01063638026",
      status: "Active",
    });

    console.log(`✅ Owner account created — ${process.env.OWNER_EMAIL}`);
  } catch (error) {
    console.error("❌ Admin user seed error:", error.message);
    throw error;
  }
};

module.exports = seedAdminUser;