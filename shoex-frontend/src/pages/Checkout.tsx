import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  MessageCircle,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import api from "@/services/api";
import { toast } from "sonner";
import { formatPrice } from "@/utils/formatCurrency";

type Step = "shipping" | "review";

interface ShippingForm {
  email: string;
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  governorate: string;
  phone: string;
  altPhone: string;
}

interface FormErrors {
  [key: string]: string;
}

interface ShippingRate {
  governorate: string;
  cost: number;
  currency: string;
  deliveryDays: string;
}

interface FieldProps {
  label: string; id: string; value: string;
  onChange: (v: string) => void; error?: string;
  type?: string; placeholder?: string; required?: boolean;
}

function Field({ label, id, value, onChange, error, type = "text", placeholder, required = false }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-gray-300 font-medium">
        {label}{required && <span className="text-[#e63946] ml-1">*</span>}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-200 placeholder:text-gray-600 ${
          error ? "border-red-500/70 focus:border-red-500" : "border-white/8 focus:border-[#e63946]/60 hover:border-white/15"
        }`}
      />
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-red-400 text-xs flex items-center gap-1.5">
            <AlertCircle size={12} />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SelectProps {
  label: string; id: string; value: string;
  onChange: (v: string) => void; options: string[];
  error?: string; required?: boolean;
}

function SelectField({ label, id, value, onChange, options, error, required = false }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-gray-300 font-medium">
        {label}{required && <span className="text-[#e63946] ml-1">*</span>}
      </label>
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-200 appearance-none cursor-pointer ${
          error ? "border-red-500/70 focus:border-red-500" : "border-white/8 focus:border-[#e63946]/60 hover:border-white/15"
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#1a1a1a] text-white">{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const isDone = step === "review";
  return (
    <div className="flex items-center gap-3">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
          isDone ? "bg-[#e63946] text-white" : "bg-[#e63946] text-white ring-4 ring-[#e63946]/20"
        }`}>
          {isDone ? <CheckCircle2 size={16} /> : "1"}
        </div>
        <span className={`text-sm font-semibold ${isDone ? "text-gray-400" : "text-white"}`}>Shipping</span>
      </div>
      {/* Connector */}
      <div className="w-16 sm:w-24 h-px bg-[#2a2a2a] overflow-hidden">
        <div className="h-full bg-[#e63946] transition-all duration-500" style={{ width: isDone ? "100%" : "0%" }} />
      </div>
      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
          isDone ? "bg-[#e63946] text-white ring-4 ring-[#e63946]/20" : "bg-[#1a1a1a] border border-[#333] text-gray-500"
        }`}>
          2
        </div>
        <span className={`text-sm font-semibold ${isDone ? "text-white" : "text-gray-600"}`}>Review</span>
      </div>
    </div>
  );
}

interface OrderSummaryProps {
  shippingCost: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  appliedPromo: any;
  promoError: string;
  setPromoError: (err: string) => void;
  promoLoading: boolean;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  discountAmount: number;
}

function OrderSummary({
  shippingCost,
  promoCode,
  setPromoCode,
  appliedPromo,
  promoError,
  setPromoError,
  promoLoading,
  onApplyPromo,
  onRemovePromo,
  discountAmount,
}: OrderSummaryProps) {
  const { items, totalPrice } = useCartStore();
  const subtotal = totalPrice();

  return (
    <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 sticky top-28">
      <h2 className="text-white font-black text-xl mb-5 flex items-center gap-2">
        <Package size={20} className="text-[#e63946]" />
        Order Summary
      </h2>
      {/* Items */}
      <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#222] flex-shrink-0">
              <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{item.product.name}</p>
              <p className="text-gray-500 text-xs">Size {item.selectedSize} · {item.selectedColor.name}</p>
              <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
            </div>
            <p className="text-white font-bold text-sm flex-shrink-0">
              {formatPrice(item.product.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>
      {/* Pricing — NO TAX */}
      <div className="border-t border-white/5 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-white font-medium">{formatPrice(subtotal)}</span>
        </div>

        {appliedPromo && (
          <div className="flex justify-between text-sm">
            <span className="text-green-400">
              Discount ({appliedPromo.discountType === "percentage" ? `${appliedPromo.discountValue}%` : "Fixed"})
            </span>
            <span className="text-green-400 font-medium">-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Shipping</span>
          <motion.span key={shippingCost} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-[#e63946] font-semibold">
            {formatPrice(shippingCost)}
          </motion.span>
        </div>
        <div className="border-t border-white/5 pt-3 flex justify-between items-center">
          <span className="text-white font-bold text-base">Total</span>
          <div className="text-right">
            <motion.p key={subtotal - discountAmount} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-white font-black text-xl">
              {formatPrice(subtotal + shippingCost - discountAmount)}
            </motion.p>
            <p className="text-gray-500 text-xs">+ {formatPrice(shippingCost)} shipping</p>
          </div>
        </div>
      </div>

      {/* Promo Code Input/Box */}
      <div className="border-t border-white/5 pt-5 mt-5">
        {appliedPromo ? (
          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-green-400" />
              <span className="text-green-400 font-bold">{appliedPromo.code}</span>
              <span className="text-green-400 text-xs">
                ({appliedPromo.discountType === "percentage" ? `${appliedPromo.discountValue}%` : formatPrice(appliedPromo.discountValue)} off)
              </span>
            </div>
            <button
              onClick={onRemovePromo}
              className="text-green-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onApplyPromo();
                    }
                  }}
                  placeholder="PROMO CODE"
                  className="w-full bg-[#1a1a1a] border border-white/8 focus:border-[#e63946]/60 hover:border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none transition-all placeholder:text-gray-600"
                />
              </div>
              <button
                type="button"
                onClick={onApplyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="bg-[#e63946] hover:bg-[#c1121f] active:scale-[0.98] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center min-w-[70px]"
              >
                {promoLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  "Apply"
                )}
              </button>
            </div>
            {promoError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs flex items-center gap-1.5 px-1"
              >
                <AlertCircle size={12} />
                {promoError}
              </motion.p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart, totalPrice } = useCartStore();

  const [step, setStep] = useState<Step>("shipping");
  const [feedback, setFeedback] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Dynamic shipping rates from backend
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);

  const [form, setForm] = useState<ShippingForm>({
    email: "", country: "Egypt", firstName: "", lastName: "",
    address: "", apartment: "", city: "", governorate: "Cairo",
    phone: "", altPhone: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Promo Code States
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = totalPrice();
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === "percentage") {
      discountAmount = (subtotal * appliedPromo.discountValue) / 100;
    } else if (appliedPromo.discountType === "fixed") {
      discountAmount = appliedPromo.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setPromoLoading(true);
    setPromoError("");
    try {
      const { data } = await api.post("/promo/validate", { code });
      if (data.success && data.data) {
        // Min order check
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

  // Fetch shipping rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data } = await api.get("/shipping/rates");
        setRates(data.data || []);
        if (data.data && data.data.length > 0) {
          setForm((f) => ({ ...f, governorate: data.data[0].governorate }));
        }
      } catch (err) {
        console.error("Failed to load shipping rates:", err);
        toast.error("Failed to load shipping rates. Defaulting Cairo rates.");
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, []);

  const getShippingCost = (gov: string): number => {
    const rate = rates.find((r) => r.governorate.toLowerCase() === gov.toLowerCase());
    return rate ? rate.cost : 65;
  };

  const shippingCost = getShippingCost(form.governorate);

  const setField = (key: keyof ShippingForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validatePhone = (phone: string): string => {
    if (!phone) return "Phone number is required";
    if (!phone.startsWith("01")) return "Phone must start with 01";
    if (phone.length < 11) return "Phone number is incomplete (min 11 digits)";
    return "";
  };

  const validateAltPhone = (alt: string, primary: string): string => {
    if (!alt) return "";
    if (!alt.startsWith("01")) return "Must start with 01";
    if (alt.length < 11) return "Phone number is incomplete";
    if (alt === primary) return "Must be different from your primary number";
    return "";
  };

  const validateShipping = (): boolean => {
    const e: FormErrors = {};
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    const pe = validatePhone(form.phone);
    if (pe) e.phone = pe;
    const ae = validateAltPhone(form.altPhone, form.phone);
    if (ae) e.altPhone = ae;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (validateShipping()) {
      setStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitLoading(true);
    try {
      const payload = {
        customer: {
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email.trim(),
          phone: form.phone.trim(),
          altPhone: form.altPhone ? form.altPhone.trim() : null,
        },
        shippingAddress: {
          country: form.country,
          governorate: form.governorate,
          city: form.city.trim(),
          address: form.address.trim(),
          apartment: form.apartment ? form.apartment.trim() : null,
        },
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          image: item.product.images[0],
          price: item.product.price,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor.name,
        })),
        subtotal: totalPrice(),
        shippingCost: shippingCost,
        discount: discountAmount,
        promoCode: appliedPromo ? appliedPromo.code : null,
        feedback: feedback ? feedback.trim() : null,
      };

      await api.post("/orders", payload);
      toast.success("Order placed successfully!");
      setOrderPlaced(true);
      clearCart();
      setTimeout(() => navigate("/"), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to place order. Please check your inputs.";
      toast.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Empty cart guard ──
  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="text-gray-700 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add items before checking out</p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-bold py-3 px-8 rounded-xl transition-colors">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ── Order Confirmed ──
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-[#e63946]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[#e63946]" />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-3">Order Placed!</h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Thank you for your order. We'll reach out via WhatsApp to confirm your delivery details.
          </p>
          <div className="bg-[#161616] border border-green-500/20 rounded-xl p-4 flex items-center gap-3 mb-8">
            <MessageCircle size={20} className="text-green-400 flex-shrink-0" />
            <p className="text-sm text-gray-300 text-left">
              Confirmation will be sent to <span className="text-white font-semibold">+20 {form.phone}</span>
            </p>
          </div>
          <p className="text-gray-600 text-sm">Redirecting you home…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-black text-white mb-5">Checkout</h1>
          <ProgressBar step={step} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left: Form ── */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">

              {/* STEP 1: Shipping */}
              {step === "shipping" && (
                <motion.div key="shipping"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}
                  className="bg-[#161616] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-5">

                  <h2 className="text-white font-black text-xl">Shipping Information</h2>

                  <Field label="Email Address" id="email" value={form.email}
                    onChange={setField("email")} error={errors.email}
                    type="email" placeholder="you@example.com" required />

                  <SelectField label="Country / Region" id="country" value={form.country}
                    onChange={setField("country")} options={["Egypt"]} required />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="First Name" id="firstName" value={form.firstName}
                      onChange={setField("firstName")} error={errors.firstName}
                      placeholder="Ahmed" required />
                    <Field label="Last Name" id="lastName" value={form.lastName}
                      onChange={setField("lastName")} error={errors.lastName}
                      placeholder="Hassan" required />
                  </div>

                  <Field label="Address" id="address" value={form.address}
                    onChange={setField("address")} error={errors.address}
                    placeholder="Street name, building number, landmarks" required />

                  <Field label="Apartment, suite, etc." id="apartment" value={form.apartment}
                    onChange={setField("apartment")}
                    placeholder="Floor, apartment number (optional)" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="City / District" id="city" value={form.city}
                      onChange={setField("city")} error={errors.city}
                      placeholder="Nasr City" required />
                    
                    {ratesLoading ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-gray-300 font-medium">Governorate</span>
                        <div className="h-[46px] w-full bg-[#1a1a1a] border border-white/8 rounded-xl animate-pulse" />
                      </div>
                    ) : (
                      <SelectField label="Governorate" id="governorate" value={form.governorate}
                        onChange={setField("governorate")} options={rates.map(r => r.governorate)} required />
                    )}
                  </div>

                  {/* Dynamic shipping cost hint */}
                  {!ratesLoading && (
                    <motion.div key={shippingCost} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-[#e63946]/8 border border-[#e63946]/20 rounded-xl px-4 py-2.5">
                      <Package size={14} className="text-[#e63946] flex-shrink-0" />
                      <p className="text-sm text-gray-300">
                        Shipping to <span className="text-white font-semibold">{form.governorate}</span>:{" "}
                        <span className="text-[#e63946] font-bold">{shippingCost} EGP</span>
                      </p>
                    </motion.div>
                  )}

                  {/* Phone (WhatsApp) */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-sm text-gray-300 font-medium">
                      Phone Number <span className="text-[#e63946]">*</span>
                      <span className="ml-1.5 text-xs text-green-400 font-normal">— WhatsApp required</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none pointer-events-none">+20</span>
                      <input id="phone" type="tel" value={form.phone}
                        onChange={(e) => setField("phone")(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className={`w-full bg-[#1a1a1a] border rounded-xl pl-12 pr-4 py-3 text-white text-sm outline-none transition-all duration-200 placeholder:text-gray-600 ${
                          errors.phone ? "border-red-500/70 focus:border-red-500" : "border-white/8 focus:border-[#e63946]/60 hover:border-white/15"
                        }`}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.phone && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="text-red-400 text-xs flex items-center gap-1.5">
                          <AlertCircle size={12} />{errors.phone}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Alt Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="altPhone" className="text-sm text-gray-300 font-medium">
                      Alternative Phone Number
                      <span className="ml-1.5 text-xs text-gray-600 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none pointer-events-none">+20</span>
                      <input id="altPhone" type="tel" value={form.altPhone}
                        onChange={(e) => setField("altPhone")(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className={`w-full bg-[#1a1a1a] border rounded-xl pl-12 pr-4 py-3 text-white text-sm outline-none transition-all duration-200 placeholder:text-gray-600 ${
                          errors.altPhone ? "border-red-500/70 focus:border-red-500" : "border-white/8 focus:border-[#e63946]/60 hover:border-white/15"
                        }`}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.altPhone && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="text-red-400 text-xs flex items-center gap-1.5">
                          <AlertCircle size={12} />{errors.altPhone}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={handleContinue}
                    className="w-full mt-2 bg-[#e63946] hover:bg-[#c1121f] active:scale-[0.98] text-white font-black py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base shadow-lg shadow-[#e63946]/20">
                    Continue to Review
                    <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Review */}
              {step === "review" && (
                <motion.div key="review"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
                  className="space-y-5">

                  {/* WhatsApp Notice */}
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-[#161616] border border-green-500/25 rounded-2xl p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={20} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold mb-1">WhatsApp Order Confirmation</p>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        We will contact you via WhatsApp to confirm your order and assist you with any further inquiries.
                      </p>
                      {form.phone && (
                        <p className="text-green-400 text-sm font-semibold mt-2">
                          Will be sent to: +20 {form.phone}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Shipping Review */}
                  <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">Shipping Details</h3>
                      <button onClick={() => setStep("shipping")}
                        className="text-[#e63946] text-sm hover:text-[#c1121f] transition-colors flex items-center gap-1">
                        <ArrowLeft size={14} />Edit
                      </button>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="text-white font-medium">{form.firstName} {form.lastName}</p>
                      <p className="text-gray-400">{form.email}</p>
                      <p className="text-gray-400">
                        {form.address}{form.apartment && `, ${form.apartment}`}
                      </p>
                      <p className="text-gray-400">{form.city}, {form.governorate}, Egypt</p>
                      <p className="text-gray-400">
                        📱 {form.phone}{form.altPhone && ` · Alt: ${form.altPhone}`}
                      </p>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
                    <label htmlFor="feedback" className="block text-white font-bold mb-1">
                      Rate your purchasing experience
                      <span className="text-gray-500 font-normal text-sm ml-2">(Optional)</span>
                    </label>
                    <p className="text-gray-500 text-xs mb-3">
                      Share anything — good or bad. Your feedback helps us improve.
                    </p>
                    <textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)}
                      rows={4} placeholder="How was your shopping experience? Any suggestions?"
                      className="w-full bg-[#1a1a1a] border border-white/8 focus:border-[#e63946]/60 hover:border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-200 placeholder:text-gray-600 resize-none"
                    />
                    <p className="text-gray-600 text-xs mt-1 text-right">{feedback.length} characters</p>
                  </div>

                  {/* Place Order Button */}
                  <motion.button onClick={handlePlaceOrder}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    disabled={submitLoading}
                    className="w-full bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-60 text-white font-black py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-base shadow-lg shadow-[#e63946]/25">
                    {submitLoading ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Place Order
                      </>
                    )}
                  </motion.button>

                  <button onClick={() => setStep("shipping")}
                    className="w-full bg-[#161616] border border-white/5 hover:bg-[#1a1a1a] text-gray-400 hover:text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                    <ArrowLeft size={16} />Back to Shipping
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── Right: Summary ── */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <OrderSummary
                shippingCost={shippingCost}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                appliedPromo={appliedPromo}
                promoError={promoError}
                setPromoError={setPromoError}
                promoLoading={promoLoading}
                onApplyPromo={handleApplyPromo}
                onRemovePromo={handleRemovePromo}
                discountAmount={discountAmount}
              />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}