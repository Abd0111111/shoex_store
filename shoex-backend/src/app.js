const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middlewares/error.middleware");

// =====================
// Import Middlewares
// =====================
const { verifyToken } = require("./middlewares/auth.middleware");
const { requireAdmin } = require("./middlewares/admin.middleware");

const app = express();

// =====================
// Security Middlewares
// =====================
app.use(helmet());

// =====================
// CORS
// =====================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://shoex.com",
      "https://www.shoex.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =====================
// Body Parsers
// =====================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// =====================
// Logger
// =====================
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// =====================
// Root Route
// =====================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to SHOEX API 👟",
    docs: "/api/v1/health",
  });
});

// =====================
// Health Check
// =====================
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SHOEX API is running 🚀",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// =====================
// Public Routes
// =====================
app.use("/api/v1/auth",        require("./routes/auth.routes"));
app.use("/api/v1/products",    require("./routes/product.routes"));
app.use("/api/v1/orders",      require("./routes/order.routes"));
app.use("/api/v1/users",       require("./routes/user.routes"));
app.use("/api/v1/promo",       require("./routes/promo.routes"));
app.use("/api/v1/shipping",    require("./routes/shipping.routes"));
app.use("/api/v1/newsletter",  require("./routes/newsletter.routes"));

// =====================
// Admin Routes
// =====================
app.use("/api/v1/admin/dashboard",     verifyToken, requireAdmin, require("./routes/admin/dashboard.routes"));
app.use("/api/v1/admin/products",      verifyToken, requireAdmin, require("./routes/admin/products.routes"));
app.use("/api/v1/admin/orders",        verifyToken, requireAdmin, require("./routes/admin/orders.routes"));
app.use("/api/v1/admin/customers",     verifyToken, requireAdmin, require("./routes/admin/customers.routes"));
app.use("/api/v1/admin/inventory",     verifyToken, requireAdmin, require("./routes/admin/inventory.routes"));
app.use("/api/v1/admin/analytics",     verifyToken, requireAdmin, require("./routes/admin/analytics.routes"));
app.use("/api/v1/admin/shipping",      verifyToken, requireAdmin, require("./routes/admin/shipping.routes"));
app.use("/api/v1/admin/notifications", verifyToken, requireAdmin, require("./routes/admin/notifications.routes"));
app.use("/api/v1/admin/feedback",      verifyToken, requireAdmin, require("./routes/admin/feedback.routes"));
app.use("/api/v1/admin/settings",      verifyToken, requireAdmin, require("./routes/admin/settings.routes"));
app.use("/api/v1/admin/team",          verifyToken, require("./routes/admin/team.routes"));

// =====================
// 404 Handler
// =====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    code: "NOT_FOUND",
  });
});

// =====================
// Global Error Handler
// =====================
app.use(errorHandler);

module.exports = app;