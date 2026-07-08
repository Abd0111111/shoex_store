import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Plus, Minus, ShoppingBag,
  ArrowRight, Tag, Heart, X, Truck,
  ShieldCheck, Sparkles, Headset,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/formatCurrency";
import api from "@/services/api";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────────────────────────
const MAX_QTY = 10;

interface AppliedPromo {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
}

// ─── Shipping Notice (real cost is only known once governorate is picked at checkout) ──
function ShippingNotice() {
  return (
    <div className="mb-6 flex items-center gap-2.5 bg-[#1e1e1e] rounded-xl border border-white/5 px-4 py-3">
      <Truck size={16} className="text-[#e63946] flex-shrink-0" />
      <p className="text-gray-400 text-xs">
        Shipping cost depends on your governorate — it'll be calculated at checkout.
      </p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();

  const [promoCode,    setPromoCode]    = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError,   setPromoError]   = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Totals ──
  const subtotal = totalPrice();

  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === "percentage") {
      discountAmount = (subtotal * appliedPromo.discountValue) / 100;
    } else {
      discountAmount = appliedPromo.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const total = subtotal - discountAmount;

  // ── Promo (validated against backend, same as Checkout) ──
  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setPromoLoading(true);
    setPromoError("");
    try {
      const { data } = await api.post("/promo/validate", { code });
      if (data.success && data.data) {
        if (data.data.minOrderValue && subtotal < data.data.minOrderValue) {
          setPromoError(`Minimum order value of ${formatPrice(data.data.minOrderValue)} required.`);
          setAppliedPromo(null);
        } else {
          setAppliedPromo(data.data);
          toast.success("Promo code applied successfully!");
        }
      } else {
        setPromoError("Invalid promo code.");
        setAppliedPromo(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid promo code.";
      setPromoError(msg);
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  // ── Quantity ──
  const handleQuantityChange = (
    productId: string,
    size: number,
    newQty: number
  ) => {
    if (newQty <= 0) {
      removeItem(productId, size);
    } else {
      updateQuantity(productId, size, Math.min(newQty, MAX_QTY));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <h1 className="text-4xl font-black text-white">Shopping Cart</h1>
            <p className="text-gray-400 mt-1 text-sm">
              {items.length} {items.length === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          {/* Clear Cart */}
          {items.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors font-semibold"
            >
              <Trash2 size={14} /> Clear Cart
            </button>
          )}
        </motion.div>

        {/* Clear Cart Confirm */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center"
              >
                <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-extrabold text-white mb-2">Clear Cart?</h3>
                <p className="text-sm text-gray-400 mb-6">
                  All {items.length} items will be removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { clearCart(); setShowClearConfirm(false); }}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <ShoppingBag size={64} className="text-gray-700 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Add some sneakers to get started</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Continue Shopping <ArrowRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Cart Items ── */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={`${item.product.id}-${item.selectedSize}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="bg-[#161616] border border-white/5 rounded-2xl p-4 sm:p-5"
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#1e1e1e] flex-shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                              {item.product.category}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Save for Later */}
                            <button
                              title="Save for later"
                              onClick={() => removeItem(item.product.id, item.selectedSize)}
                              className="text-gray-600 hover:text-pink-400 transition-colors p-1"
                            >
                              <Heart size={15} />
                            </button>
                            {/* Remove */}
                            <button
                              title="Remove item"
                              onClick={() => removeItem(item.product.id, item.selectedSize)}
                              className="text-gray-600 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="bg-[#252525] text-gray-300 text-xs px-2.5 py-1 rounded-lg">
                            Size: {item.selectedSize}
                          </span>
                          <span className="bg-[#252525] text-gray-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0"
                              style={{ backgroundColor: item.selectedColor.hex }}
                            />
                            {item.selectedColor.name}
                          </span>
                        </div>

                        {/* Quantity + Price */}
                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          <div className="flex items-center gap-3 bg-[#1e1e1e] rounded-xl px-3 py-2">
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.selectedSize, item.quantity - 1)}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="text-white font-bold text-sm w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.selectedSize, item.quantity + 1)}
                              disabled={item.quantity >= MAX_QTY}
                              className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          {item.quantity === MAX_QTY && (
                            <span className="text-xs text-amber-500">Max {MAX_QTY}</span>
                          )}

                          <div className="text-right">
                            <p className="text-white font-black text-base sm:text-lg">
                              {formatPrice(item.product.price * item.quantity)}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {formatPrice(item.product.price)} each
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="pt-2">
                <Link
                  to="/shop"
                  className="text-gray-500 hover:text-white text-sm transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#161616] border border-white/5 rounded-2xl p-6 sticky top-28"
              >
                <h2 className="text-white font-black text-xl mb-6">Order Summary</h2>

                {/* Shipping notice — real cost only known at checkout */}
                <ShippingNotice />

                {/* Totals — NO TAX */}
                <div className="space-y-3 pb-4 border-b border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shipping</span>
                    <span className="text-gray-500 font-medium italic">
                      + calculated at checkout
                    </span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">
                        Discount ({appliedPromo.discountType === "percentage"
                          ? `${appliedPromo.discountValue}%`
                          : "Fixed"})
                      </span>
                      <span className="text-green-400 font-medium">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-white font-bold text-lg">Total</span>
                  <div className="text-right">
                    <span className="text-white font-black text-2xl">{formatPrice(total)}</span>
                    <p className="text-gray-600 text-xs">+ shipping</p>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mt-5 space-y-2">
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-green-400" />
                        <span className="text-green-400 text-sm font-bold">{appliedPromo.code}</span>
                        <span className="text-green-400 text-xs">
                          — {appliedPromo.discountType === "percentage"
                            ? `${appliedPromo.discountValue}%`
                            : formatPrice(appliedPromo.discountValue)} off
                        </span>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-green-400 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Tag
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase());
                            setPromoError("");
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                          placeholder="Enter promo code"
                          className="w-full bg-[#1e1e1e] border border-white/10 text-white text-sm rounded-xl pl-9 pr-3 py-3 outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
                        />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="w-full bg-[#252525] hover:bg-[#2e2e2e] text-white font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {promoLoading ? (
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Apply Code"
                        )}
                      </button>
                      {promoError && (
                        <p className="text-red-500 text-xs text-center flex items-center justify-center gap-1.5">
                          <AlertCircle size={12} />{promoError}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Checkout Button */}
                <Link
                  to="/checkout"
                  className="mt-5 flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors text-base"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </Link>

                {/* Trust hints */}
                <div className="mt-5 space-y-2">
                  {[
                    { icon: Sparkles, text: "High quality, carefully selected products" },
                    { icon: Truck, text: "Fast, reliable delivery nationwide" },
                    { icon: Headset, text: "Excellent after-sales support" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                      <Icon size={12} className="text-red-500 flex-shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}