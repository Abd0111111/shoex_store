const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const PromoCode = require("../models/PromoCode.model");
const Feedback = require("../models/Feedback.model");
const { sendWhatsAppConfirmation } = require("../services/whatsapp.service");
const { notifyNewOrder, notifyLowStock } = require("../services/notification.service");
const { sendSuccess, sendError } = require("../utils/response");

// POST /api/v1/orders
const createOrder = async (req, res, next) => {
  try {
    const {
      customer,
      shippingAddress,
      items,
      subtotal,
      shippingCost,
      promoCode,
      discount,
      feedback,
    } = req.body;

    // ── 1. Validate stock + deduct ──────────────────────────────────────────
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return sendError(res, `Product "${item.name}" not found`, "NOT_FOUND", 404);
      }
      if (product.stock < item.quantity) {
        return sendError(
          res,
          `Insufficient stock for "${product.name}" — available: ${product.stock}`,
          "VALIDATION_ERROR",
          422
        );
      }

      // Deduct total stock
      product.stock -= item.quantity;

      // Deduct sizeStocks
      const sizeEntry = product.sizeStocks.find((s) => s.size === item.size);
      if (sizeEntry) {
        sizeEntry.stock = Math.max(0, sizeEntry.stock - item.quantity);
      }

      await product.save();

      // Low stock check — fire and forget (مش بيأثر على الـ response)
      if (product.stock < 10) {
        notifyLowStock(product).catch((err) =>
          console.error("Low stock notify failed:", err.message)
        );
      }
    }

    // ── 2. Create order ─────────────────────────────────────────────────────
    const total = subtotal + shippingCost - (discount || 0);

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    const order = await Order.create({
      customer: {
        ...customer,
        userId: req.user?._id || null,
      },
      shippingAddress,
      products: items,
      subtotal,
      shippingCost,
      promoCode: promoCode || null,
      discount: discount || 0,
      total,
      estimatedDelivery,
    });

    // ── 3. Promo code usage ─────────────────────────────────────────────────
    if (promoCode) {
      await PromoCode.findOneAndUpdate(
        { code: promoCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    // ── 4. Save feedback ────────────────────────────────────────────────────
    if (feedback && feedback.trim()) {
      await Feedback.create({
        orderId: order.orderId,
        customerName: customer.name,
        feedback: feedback.trim(),
      });
    }

    // ── 5. Side effects — fire and forget ───────────────────────────────────
    sendWhatsAppConfirmation(order).catch((err) =>
      console.error("WhatsApp failed:", err.message)
    );
    notifyNewOrder(order).catch((err) =>
      console.error("New order notify failed:", err.message)
    );

    // ── 6. Response ─────────────────────────────────────────────────────────
    return sendSuccess(
      res,
      {
        orderId: order.orderId,
        status: order.orderStatus,
        estimatedDelivery: order.estimatedDelivery,
        whatsappConfirmation: true,
      },
      "Order placed successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder };