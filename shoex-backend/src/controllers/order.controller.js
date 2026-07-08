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

    // ── 0. Validate promo code (if provided) ─────────────────────────────────
    let calculatedDiscount = 0;
    const cleanPromoCode = promoCode && typeof promoCode === "string" ? promoCode.trim().toUpperCase() : null;
    
    if (cleanPromoCode) {
      const promo = await PromoCode.findOne({
        code: cleanPromoCode,
        isActive: true,
      });

      if (!promo) {
        return sendError(res, "Promo code not found or expired.", "INVALID_PROMO", 404);
      }

      // Check expiry
      if (promo.expiresAt && new Date() > promo.expiresAt) {
        return sendError(res, "Promo code has expired.", "INVALID_PROMO", 404);
      }

      // Check max uses
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        return sendError(res, "Promo code usage limit reached.", "INVALID_PROMO", 404);
      }

      // Check min order value
      if (promo.minOrderValue && subtotal < promo.minOrderValue) {
        return sendError(
          res,
          `Minimum order value of ${promo.minOrderValue} EGP not met.`,
          "INVALID_PROMO",
          422
        );
      }

      // Calculate discount
      if (promo.discountType === "percentage") {
        calculatedDiscount = (subtotal * promo.discountValue) / 100;
      } else if (promo.discountType === "fixed") {
        calculatedDiscount = promo.discountValue;
      }
      calculatedDiscount = Math.min(calculatedDiscount, subtotal);

      // Verify matching discount value to prevent tampering
      if (Math.abs(calculatedDiscount - (discount || 0)) > 1) {
        return sendError(
          res,
          "Invalid discount amount calculation.",
          "VALIDATION_ERROR",
          422
        );
      }
    }

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
    const total = subtotal + shippingCost - calculatedDiscount;

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
      promoCode: cleanPromoCode || null,
      discount: calculatedDiscount,
      total,
      estimatedDelivery,
    });

    // ── 3. Promo code usage ─────────────────────────────────────────────────
    if (cleanPromoCode) {
      await PromoCode.findOneAndUpdate(
        { code: cleanPromoCode },
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