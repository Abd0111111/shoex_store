const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { sendError } = require("../utils/response");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "No token provided", "UNAUTHORIZED", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub);

    if (!user) {
      return sendError(res, "User not found", "UNAUTHORIZED", 401);
    }

    if (user.status === "Inactive") {
      return sendError(res, "Account is inactive", "FORBIDDEN", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Invalid or expired token", "UNAUTHORIZED", 401);
  }
};

module.exports = { verifyToken };