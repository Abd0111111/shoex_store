import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Heart,
  MapPin,
  LogOut,
  User,
  Star,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
type Tab = "orders" | "wishlist" | "addresses";

interface Address {
  country: string;
  governorate: string;
  city: string;
  address: string;
  apartment: string;
  phone: string;
}

interface WishlistItem {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
}

interface OrderItem {
  id: string;
  date: string;
  status: "Delivered" | "In Transit" | "Processing" | "Cancelled";
  total: number;
  images: string[];
}

// ─── Static Mock Data ──────────────────────────────────────
const MOCK_ORDERS: OrderItem[] = [
  {
    id: "ORD-2026-001",
    date: "May 20, 2026",
    status: "Delivered",
    total: 249.98,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200&q=80",
    ],
  },
  {
    id: "ORD-2026-002",
    date: "May 15, 2026",
    status: "In Transit",
    total: 139.99,
    images: [
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=200&q=80",
    ],
  },
  {
    id: "ORD-2026-003",
    date: "April 30, 2026",
    status: "Processing",
    total: 89.99,
    images: [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=200&q=80",
      "https://images.unsplash.com/photo-1556906781-9a412961a28b?w=200&q=80",
    ],
  },
];

const MOCK_WISHLIST: WishlistItem[] = [
  {
    id: "w1",
    name: "Flex Trainer Pro",
    category: "Training",
    price: 129,
    rating: 4.6,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  },
  {
    id: "w2",
    name: "Retro Boost Runner",
    category: "Running",
    price: 189,
    rating: 4.8,
    reviewCount: 298,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80",
    badge: "Trending",
  },
  {
    id: "w3",
    name: "Slide Comfort Elite",
    category: "Slides",
    price: 79,
    rating: 4.5,
    reviewCount: 412,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80",
  },
];

const EGYPT_GOVERNORATES = [
  "Cairo","Giza","Alexandria","Dakahlia","Red Sea","Beheira","Fayoum",
  "Gharbia","Ismailia","Menofia","Minya","Qaliubiya","New Valley","Suez",
  "Aswan","Assiut","Beni Suef","Port Said","Damietta","Sharkia",
  "South Sinai","Kafr El Sheikh","Matruh","Luxor","Qena","North Sinai","Sohag",
];

// ─── Status Badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: OrderItem["status"] }) {
  const styles: Record<OrderItem["status"], string> = {
    Delivered:    "text-green-400 bg-green-400/10 border-green-400/20",
    "In Transit": "text-[#e63946] bg-[#e63946]/10 border-[#e63946]/20",
    Processing:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    Cancelled:    "text-gray-500 bg-gray-500/10 border-gray-500/20",
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────
function ConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
      >
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <p className="text-white font-bold text-center mb-1">Remove Address?</p>
        <p className="text-gray-500 text-sm text-center mb-6">
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-gray-300 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Remove
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Address Form ─────────────────────────────────────────
interface AddressFormProps {
  initial: Address;
  onSave: (a: Address) => void;
  onCancel: () => void;
}

function AddressForm({ initial, onSave, onCancel }: AddressFormProps) {
  const [form, setForm] = useState<Address>(initial);
  const [errors, setErrors] = useState<Partial<Address>>({});

  const set = (k: keyof Address) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Partial<Address> = {};
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.phone.trim()) {
      e.phone = "Phone is required";
    } else if (!/^\d+$/.test(form.phone)) {
      // FIX: validate digits only
      e.phone = "Numbers only";
    } else if (!form.phone.startsWith("01")) {
      e.phone = "Must start with 01";
    } else if (form.phone.length < 11) {
      e.phone = "Must be 11 digits";
    } else if (form.phone.length > 11) {
      e.phone = "Must be 11 digits";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  const inputCls = (err?: string) =>
    `w-full bg-[#0d0d0d] border rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-200 placeholder:text-gray-600 ${
      err
        ? "border-red-500/70 focus:border-red-500"
        : "border-white/8 focus:border-[#e63946]/60 hover:border-white/15"
    }`;

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 14px center",
    appearance: "none" as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 space-y-4 mt-4"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-white font-bold">
          {initial.address ? "Edit Address" : "Add Address"}
        </p>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Country */}
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Country</label>
        <select value={form.country} onChange={(e) => set("country")(e.target.value)}
          className={inputCls()} style={selectStyle}>
          <option value="Egypt">Egypt</option>
        </select>
      </div>

      {/* Governorate + City */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Governorate</label>
          <select value={form.governorate} onChange={(e) => set("governorate")(e.target.value)}
            className={inputCls()} style={selectStyle}>
            {EGYPT_GOVERNORATES.map((g) => (
              <option key={g} value={g} className="bg-[#0d0d0d]">{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">City / District</label>
          <input value={form.city} onChange={(e) => set("city")(e.target.value)}
            placeholder="Nasr City" className={inputCls(errors.city)} />
          {errors.city && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={11} />{errors.city}
            </p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Street Address</label>
        <input value={form.address} onChange={(e) => set("address")(e.target.value)}
          placeholder="Street name, building number, landmarks"
          className={inputCls(errors.address)} />
        {errors.address && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle size={11} />{errors.address}
          </p>
        )}
      </div>

      {/* Apartment */}
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Apartment / Suite</label>
        <input value={form.apartment} onChange={(e) => set("apartment")(e.target.value)}
          placeholder="Floor, apartment number (optional)" className={inputCls()} />
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Phone Number</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none pointer-events-none">
            +20
          </span>
          <input
            value={form.phone}
            onChange={(e) => {
              // FIX: only allow digits while typing
              const val = e.target.value.replace(/\D/g, "").slice(0, 11);
              set("phone")(val);
            }}
            placeholder="01xxxxxxxxx"
            className={`${inputCls(errors.phone)} pl-12`}
          />
        </div>
        {errors.phone && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle size={11} />{errors.phone}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button onClick={handleSave}
          className="flex-1 bg-[#e63946] hover:bg-[#c1121f] text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm">
          <CheckCircle2 size={16} /> Save Address
        </button>
        <button onClick={onCancel}
          className="px-5 bg-[#1a1a1a] hover:bg-[#222] text-gray-400 hover:text-white font-medium py-3 rounded-xl transition-all duration-200 text-sm">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
}: {
  order: OrderItem;
  onClose: () => void;
}) {
  const statusSteps: OrderItem["status"][] = [
    "Processing",
    "In Transit",
    "Delivered",
  ];

  const isCancelled = order.status === "Cancelled";

  // WhatsApp support link with order ID pre-filled
  const whatsappUrl = `https://wa.me/201061885624?text=${encodeURIComponent(
    `Hi, I need help with my order ${order.id}`
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#161616] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <p className="text-white font-black text-base">{order.id}</p>
            <p className="text-gray-500 text-xs mt-0.5">{order.date}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Status Stepper */}
          {!isCancelled && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
                Order Status
              </p>
              <div className="flex items-center gap-0">
                {statusSteps.map((step, i) => {
                  const stepIndex = statusSteps.indexOf(order.status);
                  const isDone = i <= stepIndex;
                  const isActive = i === stepIndex;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone
                            ? "bg-[#e63946] border-[#e63946]"
                            : "bg-transparent border-white/15"
                        }`}>
                          {isDone && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <span className={`text-[10px] font-semibold whitespace-nowrap ${
                          isActive ? "text-[#e63946]" : isDone ? "text-gray-300" : "text-gray-600"
                        }`}>
                          {step}
                        </span>
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={`flex-1 h-px mx-1 mb-5 ${
                          i < stepIndex ? "bg-[#e63946]" : "bg-white/10"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-red-400 text-sm font-semibold">This order was cancelled</p>
            </div>
          )}

          {/* Product Images */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
              Items
            </p>
            <div className="flex gap-3 flex-wrap">
              {order.images.map((img, idx) => (
                <div key={idx}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-[#222] flex-shrink-0 border border-white/5">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
              Summary
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white">${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Shipping</span>
              <span className="text-green-400 font-semibold">Free</span>
            </div>
            <div className="border-t border-white/5 pt-2 flex justify-between">
              <span className="text-white font-bold">Total</span>
              <span className="text-white font-black text-lg">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Track / Support buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                // TODO: replace with real courier tracking URL from backend
                toast.info("Tracking will be available once your order ships.");
              }}
              disabled={order.status !== "In Transit"}
              className={`flex items-center justify-center gap-2 border border-white/5 font-semibold py-3 rounded-xl transition-all text-sm ${
                order.status === "In Transit"
                  ? "bg-[#1a1a1a] hover:bg-[#222] text-white"
                  : "bg-[#111] text-gray-600 cursor-not-allowed"
              }`}
            >
              <Truck size={15} className={order.status === "In Transit" ? "text-[#e63946]" : "text-gray-600"} />
              Track Order
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {/* WhatsApp icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Need Help?
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Tab: Orders ──────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await authService.getMyOrders();
        const formatted: OrderItem[] = data.map((o: any) => ({
          id: o.id,
          date: new Date(o.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          status: o.status,
          total: o.total,
          images: o.items ? o.items.map((item: any) => item.image) : [],
        }));
        setOrders(formatted);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const canTrack = (status: OrderItem["status"]) => status === "In Transit";

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-black text-white mb-6">Order History</h2>
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#161616] border border-white/5 rounded-2xl p-5 animate-pulse h-40" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-white mb-6">Order History</h2>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#161616] border border-white/5 rounded-2xl p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-base">{order.id}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{order.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-white font-black text-lg">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Product Images */}
              <div className="flex gap-3 mb-4">
                {order.images.map((img, idx) => (
                  <div key={idx}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-[#222] flex-shrink-0">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (canTrack(order.status)) {
                      toast.info(`Tracking ${order.id} — coming soon`);
                    }
                  }}
                  disabled={!canTrack(order.status)}
                  className={`flex items-center justify-center gap-2 border border-white/5 font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm ${
                    canTrack(order.status)
                      ? "bg-[#1a1a1a] hover:bg-[#222] text-white cursor-pointer"
                      : "bg-[#111] text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <Truck size={15} className={canTrack(order.status) ? "text-[#e63946]" : "text-gray-600"} />
                  Track Order
                </button>

                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/5 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm"
                >
                  <ChevronRight size={15} className="text-gray-500" />
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab: Wishlist ────────────────────────────────────────
function WishlistTab() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const data = await authService.getWishlist();
        const formatted: WishlistItem[] = data.map((p: any) => ({
          id: p._id,
          name: p.name,
          category: p.category,
          price: p.price,
          rating: p.rating || 0,
          reviewCount: p.reviewCount || 0,
          image: p.images && p.images[0] ? p.images[0] : "",
          badge: p.tags && p.tags.includes("trending") ? "Trending" : undefined,
        }));
        setItems(formatted);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load wishlist.");
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const remove = async (id: string) => {
    try {
      await authService.removeFromWishlist(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Removed from wishlist.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove item.");
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-black text-white mb-6">My Wishlist</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#161616] border border-white/5 rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-white mb-6">My Wishlist</h2>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <ShoppingBag size={16} /> Browse Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.06 }}
                className="bg-[#161616] border border-white/5 rounded-2xl overflow-hidden group"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-[#1a1a1a]">
                  <img src={item.image} alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {item.badge && (
                    <span className="absolute top-3 left-3 bg-[#e63946] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                  {/* Remove from wishlist button */}
                  <button
                    onClick={() => remove(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#e63946] transition-all duration-200"
                  >
                    <Heart size={14} className="fill-[#e63946] text-[#e63946]" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-semibold">{item.rating}</span>
                    <span className="text-gray-600 text-xs">({item.reviewCount})</span>
                  </div>
                  <p className="text-white font-bold text-sm mb-0.5">{item.name}</p>
                  <p className="text-gray-500 text-xs mb-3">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-black text-lg">${item.price}</span>
                    {/* Navigate to product page directly */}
                    <button
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="bg-[#e63946] hover:bg-[#c1121f] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      Shop Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Addresses ───────────────────────────────────────
function AddressesTab() {
  const { user } = useAuthStore();
  const EMPTY: Address = {
    country: "Egypt",
    governorate: "Cairo",
    city: "",
    address: "",
    apartment: "",
    phone: user?.phone || "",
  };

  const [saved, setSaved] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const data = await authService.getAddress();
        // Check if there is actual address data saved
        if (data && data.address) {
          setSaved({
            country: data.country || "Egypt",
            governorate: data.governorate || "Cairo",
            city: data.city || "",
            address: data.address || "",
            apartment: data.apartment || "",
            phone: user?.phone || "",
          });
        } else {
          setSaved(null);
        }
      } catch (err: any) {
        toast.error("Failed to load address.");
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [user]);

  const handleSave = async (a: Address) => {
    try {
      await authService.updateAddress({
        country: a.country,
        governorate: a.governorate,
        city: a.city,
        address: a.address,
        apartment: a.apartment,
      });
      setSaved({
        ...a,
        phone: user?.phone || "",
      });
      setEditing(false);
      toast.success("Address updated successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save address.");
    }
  };

  const handleRemove = async () => {
    try {
      await authService.deleteAddress();
      setSaved(null);
      setEditing(false);
      setShowConfirm(false);
      toast.success("Address removed.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove address.");
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-black text-white mb-6">Saved Address</h2>
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 animate-pulse h-40" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-white mb-6">Saved Address</h2>

      <AnimatePresence mode="wait">
        {/* Has a saved address — view mode */}
        {saved && !editing && (
          <motion.div key="saved"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-[#161616] border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e63946]/10 flex items-center justify-center">
                  <MapPin size={16} className="text-[#e63946]" />
                </div>
                <p className="text-white font-bold">My Address</p>
              </div>
              <span className="text-[#e63946] text-xs font-bold border border-[#e63946]/30 px-2 py-0.5 rounded-full">
                Default
              </span>
            </div>

            <div className="space-y-1.5 text-sm mb-5 pl-10">
              <p className="text-white font-medium">
                {saved.address}{saved.apartment && `, ${saved.apartment}`}
              </p>
              <p className="text-gray-400">
                {saved.city}, {saved.governorate}, {saved.country}
              </p>
              <p className="text-gray-400">📱 +20 {saved.phone}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setEditing(true)}
                className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/5 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm">
                <Edit2 size={14} className="text-[#e63946]" /> Edit
              </button>
              {/* FIX: shows confirm modal instead of removing directly */}
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-white hover:text-red-400 font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm">
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </motion.div>
        )}

        {/* Editing existing address */}
        {saved && editing && (
          <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AddressForm initial={saved} onSave={handleSave} onCancel={() => setEditing(false)} />
          </motion.div>
        )}

        {/* No address — empty state */}
        {!saved && !editing && (
          <motion.div key="empty"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            className="bg-[#161616] border border-dashed border-white/10 rounded-2xl p-10 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} className="text-gray-600" />
            </div>
            <p className="text-white font-bold mb-1">No address saved</p>
            <p className="text-gray-500 text-sm mb-5">Add your delivery address to speed up checkout</p>
            <button onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              <MapPin size={16} /> Add Address
            </button>
          </motion.div>
        )}

        {/* Adding new address */}
        {!saved && editing && (
          <motion.div key="adding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AddressForm initial={EMPTY} onSave={handleSave} onCancel={() => setEditing(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIX: Confirm delete modal */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            onConfirm={handleRemove}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Account Page ────────────────────────────────────
export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, isAuthenticated } = useAuthStore();

  // FIX: sync tab with URL params properly using useEffect
  const getTabFromUrl = (): Tab => {
    const t = searchParams.get("tab");
    return (t === "wishlist" || t === "addresses" || t === "orders") ? t : "orders";
  };

  const [activeTab, setActiveTab] = useState<Tab>(getTabFromUrl);

  // FIX: sync if URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [searchParams]);

  const handleTabChange = (newTab: Tab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-24 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#e63946]/10 flex items-center justify-center mx-auto mb-5">
            <User size={28} className="text-[#e63946]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Sign in to your account</h2>
          <p className="text-gray-500 mb-6">Access your orders, wishlist and saved addresses</p>
          <button onClick={() => navigate("/login")}
            className="bg-[#e63946] hover:bg-[#c1121f] text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const NAV_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "orders",    label: "Orders",    icon: <Package size={18} /> },
    { key: "wishlist",  label: "Wishlist",  icon: <Heart size={18} /> },
    { key: "addresses", label: "Addresses", icon: <MapPin size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ── Page Header ── */}
      <div className="bg-[#0d0d0d] border-b border-white/5 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-black text-white">My Account</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage your orders and account settings</p>
          </motion.div>
        </div>
      </div>

      {/* ── Mobile Tab Bar ── */}
      {/* FIX: on mobile, sidebar becomes a horizontal tab bar at the top */}
      <div className="lg:hidden sticky top-16 z-30 bg-[#0d0d0d] border-b border-white/5 px-4">
        <div className="flex gap-1 py-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === item.key
                  ? "bg-[#e63946] text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Sidebar (desktop only) ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="hidden lg:block lg:col-span-1"
          >
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 sticky top-28">
              {/* Avatar */}
              <div className="flex flex-col items-center py-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#e63946] flex items-center justify-center mb-3">
                  <User size={28} className="text-white" />
                </div>
                <p className="text-white font-bold text-base">{user.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
              </div>

              <div className="border-t border-white/5 mb-3" />

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleTabChange(item.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-[#e63946] text-white shadow-lg shadow-[#e63946]/20"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-white/5 mt-4 mb-3" />

              <button onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#e63946] hover:bg-[#e63946]/8 transition-all duration-200 border border-white/5 hover:border-[#e63946]/20">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </motion.div>

          {/* ── Content ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            {/* Mobile: Sign Out button above content */}
            <div className="lg:hidden flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e63946] flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{user.name}</p>
                  <p className="text-gray-500 text-xs">{user.email}</p>
                </div>
              </div>
              <button onClick={handleSignOut}
                className="flex items-center gap-2 text-[#e63946] text-sm font-semibold hover:bg-[#e63946]/10 px-3 py-2 rounded-xl transition-colors">
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "orders"    && <OrdersTab />}
                {activeTab === "wishlist"  && <WishlistTab />}
                {activeTab === "addresses" && <AddressesTab />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}