const { sendError } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return sendError(res, message, "VALIDATION_ERROR", 422);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(
      res,
      `${field} already exists`,
      "CONFLICT",
      409
    );
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", "UNAUTHORIZED", 401);
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired", "UNAUTHORIZED", 401);
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (err.name === "CastError") {
    return sendError(res, "Invalid ID format", "NOT_FOUND", 404);
  }

  // Default
  return sendError(
    res,
    err.message || "Internal server error",
    "SERVER_ERROR",
    err.statusCode || 500
  );
};

module.exports = errorHandler;