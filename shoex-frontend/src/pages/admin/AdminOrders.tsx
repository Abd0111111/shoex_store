// src/pages/admin/AdminOrders.tsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, Eye, Phone, MessageCircle,
  CheckCircle2, Truck, XCircle, Package, AlertTriangle, Loader2
} from "lucide-react";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/types/admin";
import { ordersService } from "@/services/orders.service";
import api from "@/services/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { formatPrice } from "@/utils/formatCurrency";

// ── Status Colors ────────────────────────────────────
const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  "New Order":        "bg-blue-500/10 text-blue-500",
  "Contacted":        "bg-cyan-500/10 text-cyan-500",
  "Confirmed":        "bg-indigo-500/10 text-indigo-500",
  "Packed":           "bg-purple-500/10 text-purple-500",
  "Shipped":          "bg-amber-500/10 text-amber-500",
  "Out For Delivery": "bg-orange-500/10 text-orange-500",
  "Delivered":        "bg-green-500/10 text-green-500",
  "Cancelled":        "bg-red-500/10 text-red-500",
  "Returned":         "bg-gray-500/10 text-gray-500",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  "Paid":     "bg-green-500/10 text-green-500",
  "Pending":  "bg-amber-500/10 text-amber-500",
  "Failed":   "bg-red-500/10 text-red-500",
  "Refunded": "bg-gray-500/10 text-gray-500",
};

const FINAL_STATUSES = ["Delivered", "Cancelled", "Returned"];

// ── Types ────────────────────────────────────────────
type Order = AdminOrder;

// ── Cancel Confirmation Modal ────────────────────────
function CancelOrderModal({
  orderId,
  onConfirm,
  onClose,
}: {
  orderId: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
      >
        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-extrabold text-white text-center mb-2">Cancel Order?</h3>
        <p className="text-sm text-muted-foreground text-center mb-1">
          Order <span className="text-white font-semibold">{orderId}</span>
        </p>
        <p className="text-sm text-muted-foreground text-center mb-6">
          This action cannot be undone. The order will be permanently marked as cancelled.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Keep Order
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => { onConfirm(); onClose(); }}
          >
            Yes, Cancel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Quick Actions ──
interface QuickActionsProps {
  order: Order;
  onWhatsApp: (phone: string, orderId: string, customerName: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCancelRequest: (orderId: string) => void;
}

function QuickActions({ order, onWhatsApp, onUpdateStatus, onCancelRequest }: QuickActionsProps) {
  const status = order.orderStatus;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* View */}
      <Link to={`/admin/orders/${order.id}`}>
        <Button
          variant="ghost" size="sm"
          className="text-white hover:text-[#dc143c] h-7 px-2"
          title="View order details"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      </Link>

      {/* WhatsApp */}
      <Button
        variant="ghost" size="sm"
        onClick={() => onWhatsApp(order.customerPhone, order.id, order.customerName)}
        className="text-green-500 hover:text-green-400 hover:bg-green-500/10 h-7 px-2"
        title="Contact via WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" />
      </Button>

      {/* Confirm */}
      {(status === "New Order" || status === "Contacted") && (
        <Button
          variant="ghost" size="sm"
          onClick={() => onUpdateStatus(order.id, "Confirmed")}
          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-7 px-2"
          title="Confirm order"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Pack */}
      {status === "Confirmed" && (
        <Button
          variant="ghost" size="sm"
          onClick={() => onUpdateStatus(order.id, "Packed")}
          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-7 px-2"
          title="Mark as packed"
        >
          <Package className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Ship */}
      {status === "Packed" && (
        <Button
          variant="ghost" size="sm"
          onClick={() => onUpdateStatus(order.id, "Shipped")}
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 px-2"
          title="Hand to courier"
        >
          <Truck className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Out For Delivery */}
      {status === "Shipped" && (
        <Button
          variant="ghost" size="sm"
          onClick={() => onUpdateStatus(order.id, "Out For Delivery")}
          className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 h-7 px-2"
          title="Mark as out for delivery"
        >
          <Truck className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Deliver */}
      {status === "Out For Delivery" && (
        <Button
          variant="ghost" size="sm"
          onClick={() => onUpdateStatus(order.id, "Delivered")}
          className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-7 px-2"
          title="Confirm delivery"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Cancel */}
      {!FINAL_STATUSES.includes(status) && (
        <Button
          variant="ghost" size="sm"
          onClick={() => onCancelRequest(order.id)}
          className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-7 px-2"
          title="Cancel order"
        >
          <XCircle className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // ── Fetch Orders ─────────────────────────────────────
  const fetchOrdersData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.orderStatus = statusFilter;
      if (paymentFilter !== "all") params.paymentStatus = paymentFilter;

      const res = await ordersService.getOrdersWithMetadata(params);
      setOrders(res.data);
      setStatusCounts(res.statusCounts);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  // ── Update Order Status ──────────────────────────────
  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order ${orderId} updated to "${newStatus}"`);
      fetchOrdersData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update order status");
    }
  }, [fetchOrdersData]);

  // ── WhatsApp ─────────────────────────────────────────
const openWhatsApp = useCallback(
  async (phone: string, orderId: string, customerName: string) => {
    let cleaned = phone.replace(/\s+/g, "").replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "2" + cleaned;
    if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;

    const orderObj = orders.find((o) => o.id === orderId);
    const productsList = orderObj?.products
      .map((p) => `- ${p.name} | مقاس ${p.size}`)
      .join("\n") || "";

    const lines = [
      `السلام عليكم يا ${customerName}`,
      `إحنا فريق SHOEX، شايفين إن عندك طلب جديد عندنا.`,
      ``,
      `طلبك:`,
      productsList,
      ``,
      `عاوزين نأكد الطلب معاك، رد علينا لو مناسب`,
    ];

    const msg = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${cleaned}?text=${msg}`, "_blank");

    if (orderObj && orderObj.orderStatus === "New Order") {
      await handleUpdateStatus(orderId, "Contacted");
    }
  },
  [orders, handleUpdateStatus]
);

  // ── Cancel handlers ──────────────────────────────────
  const handleCancelRequest = useCallback((orderId: string) => {
    setCancelTargetId(orderId);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTargetId) return;
    try {
      await ordersService.updateOrderStatus(cancelTargetId, "Cancelled");
      toast.error(`Order ${cancelTargetId} has been cancelled`);
      setCancelTargetId(null);
      fetchOrdersData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to cancel order");
    }
  }, [cancelTargetId, fetchOrdersData]);

  // ── Stat cards ──
  const stats = [
    { label: "Total Orders", value: statusCounts?.total ?? 0 },
    { label: "New Orders",   value: statusCounts?.newOrders ?? 0, highlight: true },
    { label: "Shipped",      value: statusCounts?.shipped ?? 0 },
    { label: "Delivered",    value: statusCounts?.delivered ?? 0 },
  ];

  // ── Export CSV ──────────────────────────────────────
  const handleExport = async () => {
    try {
      toast.info("Preparing orders export...");
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== "all") params.orderStatus = statusFilter;
      if (paymentFilter !== "all") params.paymentStatus = paymentFilter;

      const { data } = await api.get("/admin/orders/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orders-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("CSV report downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to export orders.");
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold mb-1 text-white">Orders</h1>
            <p className="text-sm text-muted-foreground">Manage and track all customer orders</p>
          </div>
          <Button
            className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white self-start md:self-auto"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" /> Export Orders
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border rounded-xl p-4 ${
                s.highlight ? "bg-blue-500/10 border-blue-500/30" : "bg-card border-border"
              }`}
            >
              <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-extrabold ${s.highlight ? "text-blue-400" : "text-white"}`}>
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Workflow Guide */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Order Workflow</p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {[
              { color: "bg-blue-500",   label: "New Order" },
              { color: "bg-cyan-500",   label: "Contacted" },
              { color: "bg-indigo-500", label: "Confirmed" },
              { color: "bg-purple-500", label: "Packed" },
              { color: "bg-amber-500",  label: "Shipped" },
              { color: "bg-orange-500", label: "Out For Delivery" },
              { color: "bg-green-500",  label: "Delivered" },
            ].map((s, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`} />
                <span className="text-muted-foreground">{s.label}</span>
                {i < arr.length - 1 && <span className="text-gray-700 ml-1">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#16161a]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-[#16161a]">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(ORDER_STATUS_COLORS).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-48 bg-[#16161a]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin text-[#dc143c] mb-4" />
                <p>Loading orders from database...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Order ID", "Customer", "Products", "Total", "Date", "Payment", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => {
                    const isNew = order.orderStatus === "New Order";
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-border transition-colors ${
                          isNew ? "bg-blue-500/5 hover:bg-blue-500/10" : "hover:bg-white/5"
                        }`}
                      >
                        {/* Order ID */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {isNew && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                            )}
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="font-semibold text-sm text-white hover:text-[#dc143c] transition-colors"
                            >
                              {order.id}
                            </Link>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3">
                          <p className="font-medium text-sm text-white">{order.customerName}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Phone className="w-3 h-3" /> {order.customerPhone}
                          </div>
                        </td>

                        {/* Product images */}
                        <td className="py-3 px-3">
                          <div className="flex -space-x-2">
                            {order.products.slice(0, 3).map((p, idx) => (
                              <img
                                key={idx}
                                src={p.image}
                                alt={p.name}
                                className="w-8 h-8 rounded-lg border-2 border-[#16161a] object-cover"
                              />
                            ))}
                            {order.products.length > 3 && (
                              <div className="w-8 h-8 rounded-lg border-2 border-[#16161a] bg-secondary flex items-center justify-center text-[10px] font-semibold text-white">
                                +{order.products.length - 3}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-3 px-3">
                          <p className="font-bold text-sm text-white">{formatPrice(order.total)}</p>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3">
                          <p className="text-sm text-white">{new Date(order.date).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>

                        {/* Payment */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PAYMENT_COLORS[order.paymentStatus]}`}>
                            {order.paymentStatus}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ORDER_STATUS_COLORS[order.orderStatus]}`}>
                            {order.orderStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3">
                          <QuickActions
                            order={order}
                            onWhatsApp={openWhatsApp}
                            onUpdateStatus={handleUpdateStatus}
                            onCancelRequest={handleCancelRequest}
                          />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Empty state */}
            {!loading && orders.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">No orders found</p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `No results for "${search}"`
                    : "No orders match the selected filters."}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelTargetId && (
          <CancelOrderModal
            orderId={cancelTargetId}
            onConfirm={handleCancelConfirm}
            onClose={() => setCancelTargetId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}