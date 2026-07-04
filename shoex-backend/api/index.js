require("dotenv").config();
const app = require("../src/app");
const connectDB = require("../src/config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    return res.status(503).json({
      success: false,
      error: "Database connection failed",
      code: "DB_CONNECTION_ERROR",
    });
  }
  return app(req, res);
};