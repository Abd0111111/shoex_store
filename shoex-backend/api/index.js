require("dotenv").config();
const serverless = require("serverless-http");
const app = require("../src/app");
const connectDB = require("../src/config/db");

let isConnected = false;

const handler = serverless(app);

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      return res.status(503).json({
        success: false,
        error: "Database connection failed",
        code: "DB_CONNECTION_ERROR",
      });
    }
  }
  return handler(req, res);
};