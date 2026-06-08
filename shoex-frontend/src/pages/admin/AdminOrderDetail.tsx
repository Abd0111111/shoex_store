import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Truck, CheckCircle2, Phone, Mail,
  MapPin, CreditCard, Download, Printer, MessageCircle,
  Package, XCircle, AlertTriangle, Loader2
} from "lucide-react";
import type { AdminOrder, OrderStatus } from "@/types/admin";
import { ordersService } from "@/services/orders.service";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { formatPrice } from "@/utils/formatCurrency";

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_WORKFLOW: OrderStatus[] = [
  "New Order", "Contacted", "Confirmed", "Packed",
  "Shipped", "Out For Delivery", "Delivered",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  "New Order":        "bg-blue-500/10 text-blue-500",
  "Contacted":        "bg-cyan-500/10 text-cyan-500",
  "Confirmed":        "bg-indigo-500/10 text-indigo-500",
  "Packed":           "bg-purple-500/10 text-purple-500",
  "Shipped":          "bg-amber-500/10 text-amber-500",
  "Out For Delivery": "bg-orange-500/10 text-orange-500",
  "Delivered":        "bg-green-500/10 text-green-500",
  "Cancelled":        "bg-red-500/10 text-red-500",
  "Returned":         "bg-gray-500/10 text-gray-400",
};

const FINAL_STATUSES = ["Delivered", "Cancelled", "Returned"];

// ─── Cancel Confirmation Modal ──────────────────────────────────────────────────
function CancelModal({
  onConfirm,
  onClose,
}: {
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

// ─── Main component ─────────────────────────────────────────────────────────────
export function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("New Order");
  const [notes,            setNotes]            = useState("");
  const [notesSaved,       setNotesSaved]       = useState(true);
  const [showCancelModal,  setShowCancelModal]  = useState(false);

  // ── Fetch order details ──
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await ordersService.getOrderById(id);
        if (data) {
          setOrder(data);
          setCurrentStatus(data.orderStatus);
          setNotes(data.notes || "");
          setNotesSaved(true);
        } else {
          setOrder(null);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to fetch order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-[#dc143c] mb-4" />
        <p className="text-lg">Fetching order details from database...</p>
      </div>
    );
  }

  // ── Not found ──
  if (!order) {
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-white">Order not found</h2>
        <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist.</p>
        <Link to="/admin/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const isFinal      = FINAL_STATUSES.includes(currentStatus);
  const isCancelled  = currentStatus === "Cancelled";
  const currentIndex = isCancelled ? -1 : STATUS_WORKFLOW.indexOf(currentStatus);

  // ── Price helpers ──
  const subtotal = order.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const shipping = order.total - subtotal;

  // ── Handlers ──
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(order.id, newStatus);
      setCurrentStatus(newStatus);
      toast.success(`Order status updated to "${newStatus}"`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update order status");
    }
  };

  const handleCancel = async () => {
    try {
      await ordersService.updateOrderStatus(order.id, "Cancelled");
      setCurrentStatus("Cancelled");
      toast.error("Order has been cancelled.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to cancel order");
    }
  };

  const handleSaveNotes = async () => {
    try {
      await ordersService.updateNotes(order.id, notes);
      toast.success("Notes saved successfully");
      setNotesSaved(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save notes");
    }
  };

  const openWhatsApp = () => {
    let cleaned = order.customerPhone.replace(/\s+/g, "").replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "2" + cleaned;
    if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;

    const productsList = order.products
      .map((p) => `- ${p.name} | مقاس ${p.size}`)
      .join("\n");

    const lines = [
      `السلام عليكم يا ${order.customerName}`,
      `إحنا فريق SHOEX، شايفين إن عندك طلب جديد عندنا.`,
      ``,
      `طلبك:`,
      productsList,
      ``,
      `عاوزين نأكد الطلب معاك، رد علينا لو مناسب`,
    ];

    const msg = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${cleaned}?text=${msg}`, "_blank");
    if (currentStatus === "New Order") handleStatusUpdate("Contacted");
  };

  // ── Next status in workflow (for forward navigation only) ──
  const nextStatus = (() => {
    if (isFinal) return null;
    const idx = STATUS_WORKFLOW.indexOf(currentStatus);
    if (idx === -1 || idx === STATUS_WORKFLOW.length - 1) return null;
    return STATUS_WORKFLOW[idx + 1];
  })();

  // ── Invoice download ──
  const handleDownloadInvoice = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice — ${order.id}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; color:#111; padding:40px; background:#fff; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; border-bottom:3px solid #dc143c; padding-bottom:20px; }
    .logo { font-size:28px; font-weight:900; color:#dc143c; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; background:#dc143c; color:#fff; margin-top:8px; }
    h2 { font-size:14px; font-weight:700; margin:24px 0 10px; color:#333; border-left:3px solid #dc143c; padding-left:10px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .info-box { background:#f9f9f9; border-radius:8px; padding:16px; }
    .info-row { display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; }
    .info-label { color:#888; }
    .info-value { font-weight:600; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th { background:#f3f3f3; text-align:left; padding:10px 12px; font-size:12px; color:#555; font-weight:700; }
    td { padding:10px 12px; border-bottom:1px solid #eee; font-size:13px; }
    .total-row td { font-weight:700; font-size:15px; color:#dc143c; border-bottom:none; }
    .footer { margin-top:40px; text-align:center; color:#aaa; font-size:11px; border-top:1px solid #eee; padding-top:20px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">SHOEX</div>
      <div style="font-size:13px;color:#888;margin-top:4px">Order Invoice</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:22px;font-weight:900">${order.id}</div>
      <div style="color:#888;font-size:13px;margin-top:4px">${new Date(order.date).toLocaleString()}</div>
      <div><span class="badge">${currentStatus}</span></div>
    </div>
  </div>
  <div class="grid2">
    <div class="info-box">
      <h2>Customer Info</h2>
      <div class="info-row"><span class="info-label">Name</span><span class="info-value">${order.customerName}</span></div>
      <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${order.customerPhone}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${order.customerEmail}</span></div>
      <div class="info-row"><span class="info-label">Address</span><span class="info-value">${order.shippingAddress}</span></div>
    </div>
    <div class="info-box">
      <h2>Payment Info</h2>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value">${order.paymentStatus}</span></div>
      <div class="info-row"><span class="info-label">Method</span><span class="info-value">Credit Card</span></div>
      <div class="info-row"><span class="info-label">Transaction ID</span><span class="info-value">${order.transactionId || "TXN-2026-PENDING"}</span></div>
      ${order.trackingNumber ? `<div class="info-row"><span class="info-label">Tracking</span><span class="info-value">${order.trackingNumber}</span></div>` : ""}
    </div>
  </div>
  <h2>Order Items</h2>
  <table>
    <thead>
      <tr><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
    </thead>
    <tbody>
      ${order.products.map((p) => `
        <tr>
          <td>${p.name}</td>
          <td>${p.size}</td>
          <td>${p.color ?? "—"}</td>
          <td>${p.quantity}</td>
          <td>${p.price.toFixed(2)} EGP</td>
          <td>${(p.price * p.quantity).toFixed(2)} EGP</td>
        </tr>
      `).join("")}
      <tr><td colspan="5" style="text-align:right;color:#888;font-size:12px">Subtotal</td><td>${subtotal.toFixed(2)} EGP</td></tr>
      <tr><td colspan="5" style="text-align:right;color:#888;font-size:12px">Shipping</td><td>${shipping.toFixed(2)} EGP</td></tr>
      <tr class="total-row"><td colspan="5" style="text-align:right">TOTAL</td><td>${order.total.toFixed(2)} EGP</td></tr>
    </tbody>
  </table>
  ${notes ? `<h2>Admin Notes</h2><div class="info-box"><p style="font-size:13px;color:#555">${notes}</p></div>` : ""}
  <div class="footer">SHOEX Store &bull; contact@shoex.com &bull; Generated on ${new Date().toLocaleString()}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${order.id}-invoice.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded — open in browser then print as PDF.");
  };

  // ── Print ──
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) { toast.error("Pop-up blocked — please allow pop-ups."); return; }
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Print Invoice — ${order.id}</title>
  <style>
    body { font-family:Arial,sans-serif; padding:40px; color:#111; }
    h1 { font-size:24px; color:#dc143c; margin-bottom:4px; }
    table { width:100%; border-collapse:collapse; margin-top:16px; }
    th,td { border:1px solid #ddd; padding:8px 12px; font-size:13px; text-align:left; }
    th { background:#f3f3f3; }
    @media print { button { display:none; } }
  </style>
</head>
<body>
  <h1>SHOEX — ${order.id}</h1>
  <p style="color:#888;margin-bottom:20px">${new Date(order.date).toLocaleString()} &bull; Status: ${currentStatus}</p>
  <p><strong>Customer:</strong> ${order.customerName} — ${order.customerPhone}</p>
  <p><strong>Address:</strong> ${order.shippingAddress}</p>
  <table>
    <thead><tr><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>
      ${order.products.map((p) => `<tr><td>${p.name}</td><td>${p.size}</td><td>${p.color ?? "—"}</td><td>${p.quantity}</td><td>${p.price.toFixed(2)} EGP</td><td>${(p.price * p.quantity).toFixed(2)} EGP</td></tr>`).join("")}
      <tr><td colspan="5" style="text-align:right;color:#888">Subtotal</td><td>${subtotal.toFixed(2)} EGP</td></tr>
      <tr><td colspan="5" style="text-align:right;color:#888">Shipping</td><td>${shipping.toFixed(2)} EGP</td></tr>
      <tr><td colspan="5" style="text-align:right"><strong>Grand Total</strong></td><td><strong>${order.total.toFixed(2)} EGP</strong></td></tr>
    </tbody>
  </table>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders">
              <Button variant="ghost" size="icon" className="text-white hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold text-white">{order.id}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[currentStatus]}`}>
                  {currentStatus}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Placed on {new Date(order.date).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={openWhatsApp}
              className="text-green-400 border-green-500/30 hover:bg-green-500/10"
            >
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="w-4 h-4 mr-2" /> Download Invoice
            </Button>
          </div>
        </div>

        {/* Quick Action Bar */}
        {!isFinal && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-3">
              Next Action:
              {nextStatus && (
                <span className="ml-2 text-muted-foreground font-normal">
                  Move to <span className="text-white font-semibold">"{nextStatus}"</span>
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              {(currentStatus === "New Order" || currentStatus === "Contacted") && (
                <Button
                  onClick={openWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Contact via WhatsApp
                </Button>
              )}

              {(currentStatus === "New Order" || currentStatus === "Contacted") && (
                <Button
                  onClick={() => handleStatusUpdate("Confirmed")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Order
                </Button>
              )}

              {currentStatus === "Confirmed" && (
                <Button
                  onClick={() => handleStatusUpdate("Packed")}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
                >
                  <Package className="w-4 h-4 mr-2" /> Mark as Packed
                </Button>
              )}

              {currentStatus === "Packed" && (
                <Button
                  onClick={() => handleStatusUpdate("Shipped")}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-sm"
                >
                  <Truck className="w-4 h-4 mr-2" /> Hand to Courier
                </Button>
              )}

              {currentStatus === "Shipped" && (
                <Button
                  onClick={() => handleStatusUpdate("Out For Delivery")}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm"
                >
                  <Truck className="w-4 h-4 mr-2" /> Out For Delivery
                </Button>
              )}

              {currentStatus === "Out For Delivery" && (
                <Button
                  onClick={() => handleStatusUpdate("Delivered")}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Delivery
                </Button>
              )}

              <Button
                onClick={() => setShowCancelModal(true)}
                variant="outline"
                className="border-red-500/30 text-red-500 hover:bg-red-500/10 text-sm ml-auto"
              >
                <XCircle className="w-4 h-4 mr-2" /> Cancel Order
              </Button>
            </div>
          </div>
        )}

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-400">Order Cancelled</p>
              <p className="text-sm text-muted-foreground">
                This order has been cancelled and cannot be modified.
              </p>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="text-xl font-extrabold mb-6 text-white">Order Status Timeline</h2>
            <div className="relative pt-2 pb-6">
              <div className="absolute top-[26px] left-[5%] right-[5%] h-[2px] bg-white/10" />
              <div
                className="absolute top-[26px] left-[5%] h-[2px] bg-[#dc143c] transition-all duration-500"
                style={{
                  width: currentIndex >= 0
                    ? `${(currentIndex / (STATUS_WORKFLOW.length - 1)) * 90}%`
                    : "0%",
                }}
              />
              <div className="relative flex justify-between">
                {STATUS_WORKFLOW.map((status, i) => {
                  const isCompleted = i < currentIndex;
                  const isCurrent   = i === currentIndex;
                  const isActive    = i <= currentIndex;
                  const isNextStep  = !isFinal && i === currentIndex + 1;

                  return (
                    <div key={status} className="flex flex-col items-center flex-1">
                      <motion.button
                        onClick={() => isNextStep && handleStatusUpdate(status)}
                        whileHover={isNextStep ? { scale: 1.1 } : {}}
                        whileTap={isNextStep ? { scale: 0.95 } : {}}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
                          isActive
                            ? "bg-[#dc143c] text-white shadow-lg shadow-[#dc143c]/30"
                            : isNextStep
                            ? "bg-[#1f1f23] text-gray-400 hover:text-white hover:bg-[#dc143c]/20 border border-[#dc143c]/40"
                            : "bg-[#1f1f23] text-gray-600"
                        } ${isCurrent ? "ring-4 ring-[#dc143c]/20" : ""} ${
                          isNextStep ? "cursor-pointer" : "cursor-default"
                        }`}
                        title={isNextStep ? `Advance to "${status}"` : undefined}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </motion.button>
                      <p
                        className={`text-[10px] sm:text-xs mt-2 text-center max-w-[70px] leading-tight ${
                          isActive   ? "font-semibold text-white" :
                          isNextStep ? "text-gray-400" :
                                       "text-gray-600"
                        }`}
                      >
                        {status}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-xl font-extrabold mb-4 text-white">Order Items</h2>
              <div className="space-y-4">
                {order.products.map((product, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 bg-[#1a1a1f] border border-white/5 rounded-lg"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Size: {product.size}
                        {product.color && <> &bull; Color: {product.color}</>}
                        {" "}&bull; Qty: {product.quantity}
                      </p>
                      <p className="font-bold text-[#dc143c]">
                        {formatPrice(product.price * product.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order totals — subtotal + shipping only, no tax */}
              <div className="border-t border-border mt-6 pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold text-orange-400">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-extrabold text-white">Total</span>
                  <span className="text-xl font-extrabold text-[#dc143c]">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Admin Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-xl font-extrabold mb-4 text-white">Admin Notes</h2>
              <Textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
                placeholder="Add internal notes about this order..."
                className="min-h-32 bg-[#16161a] mb-4 text-white"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={notesSaved}
                className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white disabled:opacity-40"
              >
                {notesSaved ? "Notes Saved ✓" : "Save Notes"}
              </Button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-xl font-extrabold mb-4 text-white">Customer Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-semibold text-white">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contact</p>
                  <div className="flex items-center gap-2 text-sm text-white mb-1">
                    <Phone className="w-4 h-4 text-[#dc143c]" />
                    {order.customerPhone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Mail className="w-4 h-4 text-[#dc143c]" />
                    {order.customerEmail}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-[#dc143c] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white">{order.shippingAddress}</p>
                  </div>
                </div>
                <Button
                  onClick={openWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Contact via WhatsApp
                </Button>
              </div>
            </motion.div>

            {/* Payment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-xl font-extrabold mb-4 text-white">Payment Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      order.paymentStatus === "Paid"    ? "bg-green-500/10 text-green-500" :
                      order.paymentStatus === "Pending" ? "bg-amber-500/10 text-amber-500" :
                                                          "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <div className="flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4 text-[#dc143c]" />
                    <span className="text-sm">Credit Card</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                  <p className="text-sm font-mono text-white">{order.transactionId || "TXN-2026-PENDING"}</p>
                </div>
              </div>
            </motion.div>

            {/* Shipping */}
            {order.trackingNumber && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="text-xl font-extrabold mb-4 text-white">Shipping Info</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                    <p className="text-sm font-mono font-semibold text-white">
                      {order.trackingNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Shipping Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        order.shippingStatus === "Delivered"  ? "bg-green-500/10 text-green-500" :
                        order.shippingStatus === "In Transit" ? "bg-amber-500/10 text-amber-500" :
                                                                "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {order.shippingStatus}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (order.trackingNumber) {
                        window.open(`https://track.aftership.com/${order.trackingNumber}`, "_blank");
                      } else {
                        toast.info("No tracking number available yet.");
                      }
                    }}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Track Shipment
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal
            onConfirm={handleCancel}
            onClose={() => setShowCancelModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default AdminOrderDetail;