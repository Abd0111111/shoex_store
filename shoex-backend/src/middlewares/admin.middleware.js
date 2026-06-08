const { sendError } = require("../utils/response");

const requireAdmin = (req, res, next) => {
  const adminRoles = ["admin", "owner", "editor", "viewer"];

  if (!req.user || !adminRoles.includes(req.user.role)) {
    return sendError(
      res,
      "Access denied. Admin access required.",
      "FORBIDDEN",
      403
    );
  }
  next();
};

const requireOwner = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return sendError(
      res,
      "Access denied. Owner access required.",
      "FORBIDDEN",
      403
    );
  }
  next();
};

const requireEditorOrAbove = (req, res, next) => {
  const allowed = ["admin", "owner", "editor"];

  if (!req.user || !allowed.includes(req.user.role)) {
    return sendError(
      res,
      "Access denied. Editor access required.",
      "FORBIDDEN",
      403
    );
  }
  next();
};

module.exports = { requireAdmin, requireOwner, requireEditorOrAbove };