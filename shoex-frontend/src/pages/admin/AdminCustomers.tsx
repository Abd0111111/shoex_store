import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  ShoppingBag,
  Search,
  Download,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { mockCustomers } from "../../data/admin-data";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { formatPrice } from "@/utils/formatCurrency";

// ─── Types ─────────────────────────────────────────────────────────────────────
type SortField = "name" | "totalSpent" | "totalOrders" | "lastPurchase";
type SortDir   = "asc" | "desc";
type StatusFilter = "All" | "Active" | "Inactive";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 inline ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp   className="w-3.5 h-3.5 inline ml-1 text-[#dc143c]" />
    : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-[#dc143c]" />;
}

// ─── Main component ────────────────────────────────────────────────────────────
export function AdminCustomers() {
  const [searchQuery,   setSearchQuery]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("All");
  const [sortField,     setSortField]     = useState<SortField>("totalSpent");
  const [sortDir,       setSortDir]       = useState<SortDir>("desc");
  const [page,          setPage]          = useState(1);

  // ── Stat card values (derived from full list, not filtered) ──
  const totalSpent  = mockCustomers.reduce((sum, c) => sum + c.totalSpent,  0);
  const totalOrders = mockCustomers.reduce((sum, c) => sum + c.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const statCards = [
    { icon: Users,      label: "Total Customers",  value: mockCustomers.length.toString(),        bgClass: "bg-blue-500/10",   textClass: "text-blue-500"   },
    { icon: DollarSign, label: "Total Revenue",     value: formatPrice(totalSpent),      bgClass: "bg-green-500/10",  textClass: "text-green-500"  },
    { icon: ShoppingBag,label: "Total Orders",      value: totalOrders.toString(),                 bgClass: "bg-purple-500/10", textClass: "text-purple-500" },
    { icon: TrendingUp, label: "Avg Order Value",   value: formatPrice(avgOrderValue),         bgClass: "bg-amber-500/10",  textClass: "text-amber-500"  },
  ];

  // ── Toggle sort ──
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  // ── Filter + sort + paginate ──
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mockCustomers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q);
      const matchesStatus =
        statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortField === "name")         { aVal = a.name;         bVal = b.name;         }
      else if (sortField === "totalSpent")  { aVal = a.totalSpent;  bVal = b.totalSpent;  }
      else if (sortField === "totalOrders") { aVal = a.totalOrders; bVal = b.totalOrders; }
      else                              { aVal = new Date(a.lastPurchase).getTime(); bVal = new Date(b.lastPurchase).getTime(); }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated   = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // ── Export (TODO: replace with real API call / CSV generation) ──
  const handleExport = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Total Spent", "Orders", "Last Purchase", "Status", "Joined"];
    const rows = sorted.map((c) => [
      c.id, c.name, c.email, c.phone,
      c.totalSpent, c.totalOrders,
      new Date(c.lastPurchase).toLocaleDateString(),
      c.status,
      new Date(c.joinedDate).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 text-white">Customers</h1>
          <p className="text-muted-foreground">Manage your customer base</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 self-start sm:self-auto" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className={`w-12 h-12 ${stat.bgClass} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.textClass}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-extrabold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        {/* Search + Status filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-10 bg-[#16161a]"
            />
          </div>
          <div className="flex gap-2">
            {(["All", "Active", "Inactive"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  statusFilter === s
                    ? "bg-[#dc143c] text-white"
                    : "bg-[#16161a] border border-border text-muted-foreground hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {/* Sortable headers */}
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("name")} className="flex items-center hover:text-white transition-colors">
                    Customer <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("totalSpent")} className="flex items-center hover:text-white transition-colors">
                    Total Spent <SortIcon field="totalSpent" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("totalOrders")} className="flex items-center hover:text-white transition-colors">
                    Orders <SortIcon field="totalOrders" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  <button onClick={() => toggleSort("lastPurchase")} className="flex items-center hover:text-white transition-colors">
                    Last Purchase <SortIcon field="lastPurchase" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((customer, i) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#dc143c]/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#dc143c]">
                          {customer.name.split(" ").map((n: string) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-white">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-white">{customer.email}</p>
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  </td>
                  <td className="py-4 px-4 font-bold text-white">
                    {formatPrice(customer.totalSpent)}
                  </td>
                  <td className="py-4 px-4 font-semibold text-white">
                    {customer.totalOrders}
                  </td>
                  <td className="py-4 px-4 text-sm text-white">
                    {new Date(customer.lastPurchase).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      className={
                        customer.status === "Active"
                          ? "bg-green-500/10 text-green-500 border-0"
                          : "bg-gray-500/10 text-gray-400 border-0"
                      }
                    >
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {new Date(customer.joinedDate).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {paginated.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-white font-semibold mb-1">No customers found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `No results for "${searchQuery}"` : "No customers match the selected filter."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sorted.length)} of {sorted.length} customers
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 py-1 text-muted-foreground text-sm">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(p as number)}
                      className={page === p ? "bg-[#dc143c] hover:bg-[#dc143c]/90 text-white border-0" : ""}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AdminCustomers;