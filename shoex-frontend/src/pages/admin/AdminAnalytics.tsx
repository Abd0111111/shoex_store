import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { adminService } from "@/services/admin.service";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice } from "@/utils/formatCurrency";

// ─── Date range tabs ───────────────────────────────────────────────────────────
const DATE_RANGES = ["7 days", "30 days", "90 days"] as const;
type DateRange = (typeof DATE_RANGES)[number];

// ─── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change: string | number;        // e.g. "+12.5%" or "-3.1%"
  bgClass: string;
  textClass: string;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, change, bgClass, textClass, delay = 0 }: StatCardProps) {
  const changeNum = parseFloat(String(change));
  const isPositive = changeNum >= 0;
  const changeText = isPositive ? `+${changeNum.toFixed(1)}%` : `${changeNum.toFixed(1)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${bgClass} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${textClass}`} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {changeText}
        </div>
      </div>
      <p className="text-2xl font-extrabold mb-1 text-white">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("30 days");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const rangeVal = dateRange === "7 days" ? "7" : dateRange === "30 days" ? "30" : "90";

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await adminService.getSalesData(rangeVal);
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        toast.error("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [dateRange]);

  const handleExport = async () => {
    try {
      toast.info("Preparing report export...");
      const { data } = await api.get(`/admin/analytics/export`, {
        params: { range: rangeVal },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analytics-report-${rangeVal}days.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("CSV report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to export analytics report.");
    }
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Analytics & Reports</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="h-80 bg-card border border-border rounded-xl" />
          <div className="h-80 bg-card border border-border rounded-xl" />
        </div>
      </div>
    );
  }

  const { summary, revenueChart, categoryBreakdown, topProducts } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 text-white">Analytics & Reports</h1>
          <p className="text-muted-foreground">Track performance and insights</p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 self-start sm:self-auto text-white"
          onClick={handleExport}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Date range tabs */}
      <div className="flex gap-2">
        {DATE_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              dateRange === range
                ? "bg-[#dc143c] text-white"
                : "bg-card border border-border text-muted-foreground hover:text-white hover:border-white/30"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatPrice(summary.totalRevenue || 0)}
          change={summary.revenueChange || 0}
          bgClass="bg-green-500/10"
          textClass="text-green-500"
          delay={0}
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={summary.totalOrders || 0}
          change={summary.ordersChange || 0}
          bgClass="bg-blue-500/10"
          textClass="text-blue-500"
          delay={0.05}
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={summary.totalCustomers || 0}
          change={summary.customersChange || 0}
          bgClass="bg-purple-500/10"
          textClass="text-purple-500"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Order Value"
          value={formatPrice(summary.avgOrderValue || 0)}
          change={summary.avgOrderValueChange || 0}
          bgClass="bg-amber-500/10"
          textClass="text-amber-500"
          delay={0.15}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-xl font-extrabold mb-6 text-white">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChart}>
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

        {/* Sales by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-xl font-extrabold mb-6 text-white">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                dataKey="value"
              >
                {categoryBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#24242a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
                formatter={(value: number) => [`${value}%`, "Share"]}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: "#9ca3af", fontSize: "12px" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Selling Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h2 className="text-xl font-extrabold mb-6 text-white">Top Selling Products</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#24242a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#ffffff",
              }}
              formatter={(value: any, name: any) => {
                if (name === "Revenue" || name === "revenue") {
                  return [formatPrice(Number(value)), "Revenue"];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="sales"   fill="#dc143c" radius={[8, 8, 0, 0]} name="Units Sold" />
            <Bar dataKey="revenue" fill="#ef4444" radius={[8, 8, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

export default AdminAnalytics;