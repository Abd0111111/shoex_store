import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Plus,
  Search,
  Trash2,
  Edit2,
  Percent,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  CheckCircle2,
  Play,
  Pause,
} from "lucide-react";
import { adminService } from "../../services/admin.service";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { formatPrice } from "@/utils/formatCurrency";
import { toast } from "sonner";

interface PromoCodeData {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export function AdminPromos() {
  const [promos, setPromos] = useState<PromoCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPromoCodes();
      setPromos(data);
    } catch (err: any) {
      console.error("Failed to load promo codes:", err);
      toast.error("Failed to retrieve promo codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const formatForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderValue(0);
    setMaxUses("");
    setExpiresAt("");
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: PromoCodeData) => {
    setEditingPromo(promo);
    setCode(promo.code);
    setDiscountType(promo.discountType);
    setDiscountValue(promo.discountValue);
    setMinOrderValue(promo.minOrderValue);
    setMaxUses(promo.maxUses ?? "");
    setExpiresAt(formatForInput(promo.expiresAt));
    setIsActive(promo.isActive);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromo(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await adminService.deletePromoCode(id);
      toast.success("Promo code deleted successfully");
      fetchPromos();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to delete promo code.";
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (promo: PromoCodeData) => {
    try {
      await adminService.updatePromoCode(promo._id, {
        isActive: !promo.isActive,
      });
      toast.success(`Promo code ${!promo.isActive ? "activated" : "deactivated"} successfully`);
      fetchPromos();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to toggle status.";
      toast.error(msg);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!code.trim()) errors.code = "Code name is required";
    else if (code.trim().length < 3) errors.code = "Code must be at least 3 characters";

    if (discountValue === "" || isNaN(Number(discountValue))) {
      errors.discountValue = "Discount value is required";
    } else if (Number(discountValue) < 0) {
      errors.discountValue = "Discount value cannot be negative";
    } else if (discountType === "percentage" && Number(discountValue) > 100) {
      errors.discountValue = "Percentage discount cannot exceed 100%";
    }

    if (minOrderValue < 0) {
      errors.minOrderValue = "Minimum order value cannot be negative";
    }

    if (maxUses !== "" && Number(maxUses) < 1) {
      errors.maxUses = "Maximum uses must be at least 1";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      maxUses: maxUses === "" ? null : Number(maxUses),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isActive,
    };

    try {
      if (editingPromo) {
        await adminService.updatePromoCode(editingPromo._id, payload);
        toast.success("Promo code updated successfully");
      } else {
        await adminService.createPromoCode(payload);
        toast.success("Promo code created successfully");
      }
      setIsModalOpen(false);
      fetchPromos();
    } catch (err: any) {
      const msg = err.response?.data?.error || "An error occurred while saving.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // derived lists & stats
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return promos.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.discountType.toLowerCase().includes(q)
    );
  }, [promos, searchQuery]);

  const stats = useMemo(() => {
    const total = promos.length;
    const active = promos.filter((p) => {
      const isExpired = p.expiresAt && new Date() > new Date(p.expiresAt);
      return p.isActive && !isExpired;
    }).length;
    const totalUses = promos.reduce((sum, p) => sum + p.usedCount, 0);
    return { total, active, totalUses };
  }, [promos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 text-white">Promo Codes</h1>
          <p className="text-sm text-muted-foreground">Manage discounts and checkout promo campaigns</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 self-start sm:self-auto bg-[#dc143c] hover:bg-[#b01030] text-white border-0 font-bold px-5 py-2.5 rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Promo Code
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Tag,
            bgClass: "bg-blue-500/10",
            textClass: "text-blue-500",
            label: "Total Promo Codes",
            value: stats.total.toString(),
          },
          {
            icon: CheckCircle2,
            bgClass: "bg-green-500/10",
            textClass: "text-green-500",
            label: "Active Codes",
            value: stats.active.toString(),
          },
          {
            icon: Percent,
            bgClass: "bg-[#dc143c]/10",
            textClass: "text-[#dc143c]",
            label: "Total Uses",
            value: stats.totalUses.toString(),
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className={`w-12 h-12 ${s.bgClass} rounded-lg flex items-center justify-center mb-4`}>
              <s.icon className={`w-6 h-6 ${s.textClass}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
            <p className="text-2xl font-extrabold text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by promo code name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#16161a] border-border"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-[#dc143c] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading promo codes...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Promo Code</th>
                  <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Discount</th>
                  <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Min Order Value</th>
                  <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Usage (Uses / Max)</th>
                  <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Expiration Date</th>
                  <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="py-3 px-4 text-sm font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((promo, i) => {
                  const isExpired = promo.expiresAt && new Date() > new Date(promo.expiresAt);
                  const isLimitReached = promo.maxUses !== null && promo.usedCount >= promo.maxUses;
                  const isActiveState = promo.isActive && !isExpired && !isLimitReached;

                  return (
                    <motion.tr
                      key={promo._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold text-sm text-white tracking-wider">
                            {promo.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-white">
                        {promo.discountType === "percentage" ? (
                          <span className="text-[#dc143c]">{promo.discountValue}% Off</span>
                        ) : (
                          <span>{formatPrice(promo.discountValue)} Off</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-white">
                        {promo.minOrderValue > 0 ? formatPrice(promo.minOrderValue) : "No Minimum"}
                      </td>
                      <td className="py-4 px-4 text-sm text-white font-mono">
                        {promo.usedCount} / {promo.maxUses !== null ? promo.maxUses : "∞"}
                      </td>
                      <td className="py-4 px-4 text-sm text-white">
                        {promo.expiresAt ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className={isExpired ? "text-red-400 line-through" : ""}>
                              {new Date(promo.expiresAt).toLocaleDateString()} {new Date(promo.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          "Never Expires"
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          onClick={() => handleToggleStatus(promo)}
                          className={`cursor-pointer hover:scale-105 transition-transform border-0 px-2.5 py-1 ${
                            isActiveState
                              ? "bg-green-500/10 text-green-500"
                              : isExpired
                              ? "bg-red-500/10 text-red-500"
                              : isLimitReached
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {isActiveState
                            ? "Active"
                            : isExpired
                            ? "Expired"
                            : isLimitReached
                            ? "Limit Reached"
                            : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title={promo.isActive ? "Deactivate" : "Activate"}
                            onClick={() => handleToggleStatus(promo)}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-white transition-colors"
                          >
                            {promo.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            title="Edit code"
                            onClick={() => handleOpenEdit(promo)}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete code"
                            onClick={() => handleDelete(promo._id)}
                            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-white font-semibold mb-1">No promo codes found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `No results for "${searchQuery}"` : "Create your first promo code to start offering discounts."}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Form Dialog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121214] border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#dc143c]" />
                  {editingPromo ? `Edit Promo Code: ${editingPromo.code}` : "Create New Promo Code"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Code Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-gray-300 font-semibold flex justify-between">
                    Promo Code Name <span className="text-[#dc143c] font-black">*</span>
                  </label>
                  <Input
                    placeholder="e.g. SHOEX20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    disabled={!!editingPromo}
                    className="bg-[#1a1a1e] border-border text-white placeholder:text-gray-600 focus:border-[#dc143c]/60"
                  />
                  {formErrors.code && (
                    <span className="text-red-400 text-xs flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.code}
                    </span>
                  )}
                </div>

                {/* Discount Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-300 font-semibold">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value as "percentage" | "fixed");
                        setDiscountValue("");
                      }}
                      className="w-full bg-[#1a1a1e] border border-border rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-all duration-200 focus:border-[#dc143c]/60"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (EGP)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-300 font-semibold">
                      Discount Value {discountType === "percentage" ? "(%)" : "(EGP)"} <span className="text-[#dc143c] font-black">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder={discountType === "percentage" ? "10" : "150"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value !== "" ? Number(e.target.value) : "")}
                      className="bg-[#1a1a1e] border-border text-white placeholder:text-gray-600 focus:border-[#dc143c]/60"
                    />
                    {formErrors.discountValue && (
                      <span className="text-red-400 text-xs flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {formErrors.discountValue}
                      </span>
                    )}
                  </div>
                </div>

                {/* Min Order Value */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-gray-300 font-semibold">Minimum Order Value (EGP)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="bg-[#1a1a1e] border-border text-white placeholder:text-gray-600 focus:border-[#dc143c]/60"
                  />
                  {formErrors.minOrderValue && (
                    <span className="text-red-400 text-xs flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.minOrderValue}
                    </span>
                  )}
                </div>

                {/* Max Uses & Expiration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-300 font-semibold">Max Uses (Optional)</label>
                    <Input
                      type="number"
                      placeholder="Unlimited (empty)"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value !== "" ? Number(e.target.value) : "")}
                      className="bg-[#1a1a1e] border-border text-white placeholder:text-gray-600 focus:border-[#dc143c]/60"
                    />
                    {formErrors.maxUses && (
                      <span className="text-red-400 text-xs flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {formErrors.maxUses}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-300 font-semibold">Expiration (Optional)</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-[#1a1a1e] border border-border rounded-xl px-3.5 py-2.5 text-white text-sm outline-none transition-all duration-200 focus:border-[#dc143c]/60"
                    />
                  </div>
                </div>

                {/* Status Checkbox */}
                <div className="flex items-center gap-2.5 py-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#dc143c] bg-[#1a1a1e] rounded border-border"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-300 cursor-pointer">
                    Set Active (Visible & ready to apply)
                  </label>
                </div>

                {/* Submit Panel */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="border-border hover:bg-white/5 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#dc143c] hover:bg-[#b01030] text-white border-0 font-bold px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : editingPromo ? (
                      "Save Changes"
                    ) : (
                      "Create Promo"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminPromos;
