import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  DollarSign,
} from "lucide-react";
import { products } from "../../data/products";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { formatPrice } from "@/utils/formatCurrency";

// ─── Types ─────────────────────────────────────────────────────────────────────
type StockStatus  = "All" | "In Stock" | "Low Stock" | "Out of Stock";
type SortField    = "name" | "stock" | "movement" | "value";
type SortDir      = "asc" | "desc";

interface InventoryItem {
  id: string | number;
  name: string;
  category: string;
  price: number;
  images?: string[];
  sku?: string;
  stock: number;
  movement: number;
}

// ─── Fixed mock data (replaces Math.random()) ──────────────────────────────────
// TODO: replace entirely with API response — GET /api/inventory
const MOCK_STOCK: number[]    = [3, 24, 0, 12, 7, 35, 2, 18, 5, 41, 8, 22, 0, 15, 6, 30, 4, 19, 11, 27];
const MOCK_MOVEMENT: number[] = [5, -3, 0, 8, -2, 12, -5, 7, 3, -8, 6, -1, 0, 4, -6, 9, 2, -4, 7, -3];

const inventoryData: InventoryItem[] = products.map((p, i) => ({
  ...p,
  stock:    MOCK_STOCK[i % MOCK_STOCK.length],
  movement: MOCK_MOVEMENT[i % MOCK_MOVEMENT.length],
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

function getStockStatus(stock: number): StockStatus {
  if (stock === 0)  return "Out of Stock";
  if (stock < 10)   return "Low Stock";
  return "In Stock";
}

function getStockStyle(stock: number) {
  if (stock === 0)  return { badge: "bg-red-500/10 text-red-500",   text: "text-red-500"   };
  if (stock < 10)   return { badge: "bg-amber-500/10 text-amber-500", text: "text-amber-500" };
  return              { badge: "bg-green-500/10 text-green-500",   text: "text-white"     };
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 inline ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp   className="w-3.5 h-3.5 inline ml-1 text-[#dc143c]" />
    : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-[#dc143c]" />;
}

// ─── Adjust Stock Modal ────────────────────────────────────────────────────────
function AdjustStockModal({
  item,
  onClose,
  onSave,
}: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (id: string | number, newStock: number) => void;
}) {
  const [stock, setStock] = useState(item.stock);

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
        <h3 className="text-lg font-extrabold mb-1 text-white">Adjust Stock</h3>
        <p className="text-sm text-muted-foreground mb-6">{item.name}</p>

        <div className="flex items-center gap-4 mb-4 justify-center">
          <button
            onClick={() => setStock((s) => Math.max(0, s - 1))}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg font-bold text-white transition-colors"
          >
            −
          </button>
          <input
            type="number"
            value={stock}
            min={0}
            onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
            className="w-24 text-center text-2xl font-extrabold bg-transparent border-b-2 border-[#dc143c] outline-none py-1 text-white"
          />
          <button
            onClick={() => setStock((s) => s + 1)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg font-bold text-white transition-colors"
          >
            +
          </button>
        </div>

        <p className={`text-center text-sm mb-6 ${
          stock === 0 ? "text-red-500" : stock <= 10 ? "text-amber-500" : "text-green-500"
        }`}>
          {stock === 0 ? "Out of Stock" : stock <= 10 ? "Low Stock — consider restocking" : "In Stock ✓"}
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#dc143c] hover:bg-[#dc143c]/90 text-white"
            onClick={() => { onSave(item.id, stock); onClose(); }}
          >
            Save
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function AdminInventory() {
  const [searchQuery,  setSearchQuery]  = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus>("All");
  const [sortField,    setSortField]    = useState<SortField>("stock");
  const [sortDir,      setSortDir]      = useState<SortDir>("asc");
  const [page,         setPage]         = useState(1);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);

  // Local stock overrides (from Adjust Stock modal)
  // TODO: replace with API call — PATCH /api/inventory/:id
  const [stockOverrides, setStockOverrides] = useState<Record<string | number, number>>({});

  const items = useMemo(() =>
    inventoryData.map((item) => ({
      ...item,
      stock: stockOverrides[item.id] ?? item.stock,
    })),
    [stockOverrides]
  );

  // ── Stat values ──
  const totalItems   = items.reduce((sum, i) => sum + i.stock, 0);
  const lowStockCount = items.filter((i) => i.stock > 0 && i.stock < 10).length;
  const outOfStock   = items.filter((i) => i.stock === 0).length;
  const totalValue   = items.reduce((sum, i) => sum + i.price * i.stock, 0);

  const statCards = [
    { icon: Package,       label: "Total Units",       value: totalItems.toLocaleString(),    bgClass: "bg-blue-500/10",   textClass: "text-blue-500"   },
    { icon: AlertTriangle, label: "Low Stock Alerts",  value: lowStockCount.toString(),       bgClass: "bg-amber-500/10",  textClass: "text-amber-500"  },
    { icon: DollarSign,    label: "Inventory Value",   value: formatPrice(totalValue), bgClass: "bg-green-500/10",  textClass: "text-green-500"  },
    { icon: Package,       label: "Product SKUs",      value: products.length.toString(),     bgClass: "bg-purple-500/10", textClass: "text-purple-500" },
  ];

  // ── Toggle sort ──
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  // ── Filter + sort + paginate ──
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || getStockStatus(item.stock) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if      (sortField === "name")     { aVal = a.name;              bVal = b.name;              }
      else if (sortField === "stock")    { aVal = a.stock;             bVal = b.stock;             }
      else if (sortField === "movement") { aVal = a.movement;          bVal = b.movement;          }
      else                              { aVal = a.price * a.stock;   bVal = b.price * b.stock;   }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated  = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSaveStock = (id: string | number, newStock: number) => {
    setStockOverrides((prev) => ({ ...prev, [id]: newStock }));
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold mb-2 text-white">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage stock levels</p>
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
          <h2 className="text-xl font-extrabold mb-6 text-white">Inventory Status</h2>

          {/* Search + Status filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name or category..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10 bg-[#16161a]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["All", "In Stock", "Low Stock", "Out of Stock"] as StockStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                    statusFilter === s
                      ? "bg-[#dc143c] text-white"
                      : "bg-[#16161a] border border-border text-muted-foreground hover:text-white"
                  }`}
                >
                  {s}
                  {s !== "All" && (
                    <span className="ml-1.5 text-xs opacity-70">
                      ({items.filter((i) => getStockStatus(i.stock) === s).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <button onClick={() => toggleSort("name")} className="flex items-center hover:text-white transition-colors">
                      Product <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <button onClick={() => toggleSort("stock")} className="flex items-center hover:text-white transition-colors">
                      Stock <SortIcon field="stock" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <button onClick={() => toggleSort("movement")} className="flex items-center hover:text-white transition-colors">
                      Movement (7d) <SortIcon field="movement" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <button onClick={() => toggleSort("value")} className="flex items-center hover:text-white transition-colors">
                      Value <SortIcon field="value" sortField={sortField} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item, i) => {
                  const style = getStockStyle(item.stock);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border hover:bg-white/5 transition-colors"
                    >
                      {/* Product */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100"}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-sm text-white">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-4">
                        <p className="text-sm font-mono text-white">
                          {item.sku ?? `SKU-${item.id.toString().padStart(4, "0")}`}
                        </p>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4">
                        <p className={`font-bold ${style.text}`}>
                          {item.stock} units
                        </p>
                      </td>

                      {/* Movement */}
                      <td className="py-4 px-4">
                        <div className={`flex items-center gap-1 ${item.movement > 0 ? "text-green-500" : item.movement < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {item.movement > 0
                            ? <TrendingUp  className="w-4 h-4" />
                            : item.movement < 0
                            ? <TrendingDown className="w-4 h-4" />
                            : <span className="w-4 h-4 flex items-center justify-center text-xs">—</span>
                          }
                          <span className="text-sm font-semibold">
                            {item.movement === 0 ? "No change" : `${Math.abs(item.movement)} units`}
                          </span>
                        </div>
                      </td>

                      {/* Value */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-white">
                          {formatPrice(item.price * item.stock)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
                          {getStockStatus(item.stock)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustTarget(item)}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {paginated.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-white font-semibold mb-1">No items found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : `No products match the "${statusFilter}" filter.`}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, sorted.length)} of {sorted.length} products
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

      {/* Adjust Stock Modal */}
      <AnimatePresence>
        {adjustTarget && (
          <AdjustStockModal
            item={adjustTarget}
            onClose={() => setAdjustTarget(null)}
            onSave={handleSaveStock}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default AdminInventory;