import { motion } from "framer-motion";
import { Truck, Package, CheckCircle2, XCircle, Clock } from "lucide-react";
import { mockOrders } from "../../data/admin-data";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

export function AdminShipping() {
  const shippingOrders = mockOrders.filter(
    (o) => o.orderStatus === "Packed" || o.orderStatus === "Shipped" || o.orderStatus === "Out For Delivery"
  );

  const stats = {
    awaiting: mockOrders.filter((o) => o.orderStatus === "Packed").length,
    inTransit: mockOrders.filter((o) => o.shippingStatus === "In Transit").length,
    delivered: mockOrders.filter((o) => o.shippingStatus === "Delivered").length,
    failed: mockOrders.filter((o) => o.shippingStatus === "Failed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold mb-1 text-white">Shipping Management</h1>
        <p className="text-sm text-muted-foreground">Track and manage shipments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Clock,        bgClass: "bg-amber-500/10", textClass: "text-amber-500", label: "Awaiting Shipment",  value: stats.awaiting },
          { icon: Truck,        bgClass: "bg-blue-500/10",  textClass: "text-blue-500",  label: "In Transit",         value: stats.inTransit },
          { icon: CheckCircle2, bgClass: "bg-green-500/10", textClass: "text-green-500", label: "Delivered",          value: stats.delivered },
          { icon: XCircle,      bgClass: "bg-red-500/10",   textClass: "text-red-500",   label: "Failed Deliveries",  value: stats.failed },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="text-xl font-extrabold mb-6 text-white">Active Shipments</h2>
        <div className="space-y-4">
          {shippingOrders.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No active shipments right now.</p>
          )}
          {shippingOrders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-secondary rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.shippingAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {order.trackingNumber && (
                  <div className="hidden md:block">
                    <p className="text-xs text-muted-foreground">Tracking</p>
                    <p className="text-sm font-mono font-semibold text-white">{order.trackingNumber}</p>
                  </div>
                )}
                <Badge className={
                  order.orderStatus === "Shipped"          ? "bg-blue-500/10 text-blue-500 border-0" :
                  order.orderStatus === "Out For Delivery" ? "bg-orange-500/10 text-orange-500 border-0" :
                  "bg-amber-500/10 text-amber-500 border-0"
                }>
                  {order.orderStatus}
                </Badge>
                <Button size="sm" variant="outline"><Truck className="w-3.5 h-3.5 mr-1" />Track</Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default AdminShipping;