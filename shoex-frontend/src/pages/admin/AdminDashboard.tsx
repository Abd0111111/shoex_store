import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";
import { formatPrice } from "@/utils/formatCurrency";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, change, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-[#dc143c]/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#dc143c]" />
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            trend === "up" ? "text-green-500" : "text-red-500"
          }`}
        >
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <h3 className="text-2xl md:text-3xl font-extrabold mb-1 text-white">{value}</h3>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

// Order status badge colors
function getOrderStatusStyle(status: string) {
  switch (status) {
    case "New Order":   return "bg-blue-500/10 text-blue-500";
    case "Contacted":   return "bg-yellow-500/10 text-yellow-400";
    case "Packed":      return "bg-orange-500/10 text-orange-400";
    case "Shipped":     return "bg-purple-500/10 text-purple-500";
    case "Delivered":   return "bg-green-500/10 text-green-500";
    case "Cancelled":   return "bg-red-500/10 text-red-500";
    default:            return "bg-gray-500/10 text-gray-400";
  }
}

// ─── Main component ────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsData, ordersData, stockData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getRecentOrders(),
          adminService.getLowStock(10),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData);
        setLowStockProducts(stockData);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-[#dc143c] mb-4" />
        <p className="text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  // Progress bar percentages (relative to target thresholds)
  const weekRevenueTarget  = stats.weeklyRevenueTarget || 50000;
  const weekRevenuePercent = Math.min(100, Math.round(((stats.week?.revenue || 0) / weekRevenueTarget) * 100));
  
  const newCustomersTarget  = stats.monthlyCustomersTarget || 40;
  const newCustomersPercent = Math.min(100, Math.round(((stats.month?.newCustomers || 0) / newCustomersTarget) * 100));
  
  const productsSoldTarget  = stats.monthlyProductsSoldTarget || 200;
  const productsSoldPercent = Math.min(100, Math.round(((stats.productsSoldThisMonth || 0) / productsSoldTarget) * 100));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold mb-2 text-white">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={formatPrice(stats.today?.revenue || 0)}
          change={12.5}
          trend="up"
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders Today"
          value={stats.today?.orders || 0}
          change={8.2}
          trend="up"
        />
        <StatCard
          icon={Package}
          label="Pending Orders"
          value={stats.pendingOrdersCount || 0}
          change={5.1}
          trend="down"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Order Value"
          value={formatPrice(stats.today?.avgOrderValue || 0)}
          change={3.4}
          trend="up"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-white">Revenue Overview</h2>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-white">
                {formatPrice(stats.week?.revenue || 0)}
              </p>
              <p className="text-sm text-green-500 flex items-center justify-end gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +15.3% from last week
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.revenueChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#24242a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
                formatter={(value: any) => [formatPrice(Number(value)), "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#dc143c"
                strokeWidth={3}
                dot={{ fill: "#dc143c", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Orders chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-white">Orders Overview</h2>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-white">{stats.week?.orders || 0}</p>
              <p className="text-sm text-green-500 flex items-center justify-end gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +12.1% from last week
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.revenueChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#24242a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
              />
              <Bar dataKey="orders" fill="#dc143c" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Recent Orders</h2>
            </div>
            <Link
              to="/admin/orders"
              className="text-sm text-primary hover:underline transition-colors"
            >
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="flex items-center justify-between p-3 bg-[#1e1e24] border border-white/5 rounded-lg hover:bg-white/5 hover:border-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#dc143c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5 text-[#dc143c]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-white">{formatPrice(order.total)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusStyle(order.orderStatus)}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Low Stock Alerts</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Products with less than 10 units</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">All products are well stocked.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product, i) => (
                <motion.div
                  key={product.id || product._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-[#1e1e24] border border-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images?.[0] || ""}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-sm text-white">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-500">{product.stock} units</p>
                    <p className="text-xs text-muted-foreground">Low Stock</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Summary progress cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Weekly Revenue */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-xl font-extrabold text-white">
                {formatPrice(stats.week?.revenue || 0)}
              </p>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${weekRevenuePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{weekRevenuePercent}% of weekly target</p>
        </div>

        {/* New Customers */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">New Customers</p>
              <p className="text-xl font-extrabold text-white">{stats.month?.newCustomers || 0}</p>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${newCustomersPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{newCustomersPercent}% of monthly target</p>
        </div>

        {/* Products Sold */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products Sold</p>
              <p className="text-xl font-extrabold text-white">{stats.productsSoldThisMonth || 0}</p>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${productsSoldPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{productsSoldPercent}% of monthly target</p>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminDashboard;