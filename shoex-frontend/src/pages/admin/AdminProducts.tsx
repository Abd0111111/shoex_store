import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatPrice } from "@/utils/formatCurrency";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  TrendingUp,
  Package,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
} from "lucide-react";
import { useAdminStore } from "@/store/adminStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";

// ─── Types ────────────────────────────────────────────
type SortField = "name" | "price" | "stock";
type SortDir = "asc" | "desc";

// ─── Discount Modal ───────────────────────────────────
function DiscountModal({
  product,
  onClose,
  onApply,
}: {
  product: Product;
  onClose: () => void;
  onApply: (id: string, pct: number) => void;
}) {
  const [pct, setPct] = useState(10);
  const basePrice = product.originalPrice ?? product.price;
  const discounted = basePrice * (1 - pct / 100);

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
        className="bg-[#1e1e24] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-2">Apply Discount</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set discount percentage for{" "}
          <span className="text-white font-medium">{product.name}</span>
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Discount Percentage (%)
            </label>
            <Input
              type="number"
              min="1"
              max="99"
              value={pct}
              onChange={(e) =>
                setPct(
                  Math.max(1, Math.min(99, parseInt(e.target.value) || 0))
                )
              }
              className="bg-black/20 border-white/10 text-white"
            />
          </div>

          <div className="bg-black/10 p-3 rounded-lg flex justify-between text-sm">
            <span className="text-muted-foreground">Original Price:</span>
            <span className="text-white">{formatPrice(basePrice)}</span>
          </div>
          <div className="bg-black/10 p-3 rounded-lg flex justify-between text-sm">
            <span className="text-muted-foreground">New Price:</span>
            <span className="text-[#dc143c] font-bold">
              {formatPrice(discounted)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white"
            onClick={() => {
              onApply(product.id, pct);
              onClose();
            }}
          >
            Apply
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stock Modal ──────────────────────────────────────
function StockModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (id: string, newStock: number) => void;
}) {
  // FIX: initialise from prop each time modal opens — parent controls mount/unmount via AnimatePresence
  const [stock, setStock] = useState(product.stock ?? 0);

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
        className="bg-[#1e1e24] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-2">Update Inventory</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Adjust physical stock for{" "}
          <span className="text-white font-medium">{product.name}</span>
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Current Stock Level
            </label>
            <Input
              type="number"
              min="0"
              value={stock}
              onChange={(e) =>
                setStock(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="bg-black/20 border-white/10 text-white"
            />
          </div>

          {/* Stock status preview */}
          <div className="bg-black/10 p-3 rounded-lg flex justify-between text-sm">
            <span className="text-muted-foreground">Status after save:</span>
            <span
              className={
                stock === 0
                  ? "text-red-500"
                  : stock <= 5
                  ? "text-amber-500"
                  : "text-green-500"
              }
            >
              {stock === 0
                ? "Out of Stock"
                : stock <= 5
                ? "Low Stock"
                : "In Stock"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white"
            onClick={() => {
              onSave(product.id, stock);
              onClose();
            }}
          >
            Save Changes
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────
function DeleteProductModal({
  product,
  onClose,
  onConfirm,
  isLoading,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={!isLoading ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1e1e24] border border-red-500/20 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-red-500 mb-3">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-lg font-bold text-white">Delete Product</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">"{product.name}"</span>? This
          action is permanent and cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          {/* FIX: Added loading state for future async delete API calls */}
          <Button
            className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
            disabled={isLoading}
            onClick={() => onConfirm(product.id)}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Deleting...
              </span>
            ) : (
              "Delete Permanently"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sort Icon Helper ─────────────────────────────────
function SortIcon({
  field,
  active,
  dir,
}: {
  field: SortField;
  active: SortField;
  dir: SortDir;
}) {
  if (field !== active) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return dir === "asc" ? (
    <ChevronUp className="w-3 h-3 ml-1 text-[#dc143c]" />
  ) : (
    <ChevronDown className="w-3 h-3 ml-1 text-[#dc143c]" />
  );
}

// ─── Pagination ───────────────────────────────────────
const PAGE_SIZE = 10;

// ─── Main AdminProducts Component ─────────────────────
export default function AdminProducts() {
  const navigate = useNavigate();
  const { products, fetchProducts, deleteProduct, applyDiscount, updateStock } =
    useAdminStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchProducts();
      } catch (err) {
        toast.error("Failed to fetch product catalog.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchProducts]);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Sort
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [discountTarget, setDiscountTarget] = useState<Product | null>(null);
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // FIX: Derive unique categories from products list dynamically
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ) as string[];
    return cats.sort();
  }, [products]);

  // Filter → Sort → Paginate pipeline
  const { paginated, totalPages } = useMemo(() => {
    // 1. Filter
    const q = search.toLowerCase();
    let result = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false);
      const matchCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });

    // 2. Sort
    result = [...result].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortField === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === "price") {
        valA = a.price;
        valB = b.price;
      } else {
        valA = a.stock ?? 0;
        valB = b.stock ?? 0;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    // 3. Paginate
    const totalPages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
    const safePagesize = Math.min(page, totalPages);
    const paginated = result.slice(
      (safePagesize - 1) * PAGE_SIZE,
      safePagesize * PAGE_SIZE
    );

    return { paginated, totalPages, total: result.length };
  }, [products, search, categoryFilter, sortField, sortDir, page]);

  // Handle sort column click
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  // Reset page on search/filter change
  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleCategory(val: string) {
    setCategoryFilter(val);
    setPage(1);
  }

  // FIX: Delete handler with loading state — ready for async API swap
  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      // When you wire the API: await deleteProductAPI(id);
      deleteProduct(id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const discounted = products.filter(
      (p) => p.originalPrice && p.originalPrice > p.price
    ).length;
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 5).length;
    return { total, discounted, lowStock };
  }, [products]);

  return (
    <>
      <div className="space-y-6 p-6 min-h-screen bg-[#141416] text-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Products Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your shoe catalog, inventory, and special offers.
            </p>
          </div>
          <Button
            className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white shadow-lg shadow-[#dc143c]/20"
            onClick={() => navigate("/admin/products/add")}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e1e24] border border-white/5 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Products
              </p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-[#1e1e24] border border-white/5 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Active Discounts
              </p>
              <h3 className="text-2xl font-bold">{stats.discounted}</h3>
            </div>
          </div>

          <div className="bg-[#1e1e24] border border-white/5 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Low Stock Items
              </p>
              <h3 className="text-2xl font-bold">{stats.lowStock}</h3>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e1e24] border border-white/5 rounded-xl overflow-hidden shadow-xl"
        >
          {/* Toolbar: Search + Category Filter */}
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-[#dc143c]"
              />
            </div>

            {/* FIX: Category Filter — derived dynamically from products */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategory(e.target.value)}
                  className="bg-black/20 border border-white/10 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#dc143c] cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {/* FIX: Sortable column headers */}
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center hover:text-white transition-colors"
                    >
                      Product
                      <SortIcon field="name" active={sortField} dir={sortDir} />
                    </button>
                  </th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSort("price")}
                      className="flex items-center hover:text-white transition-colors"
                    >
                      Price
                      <SortIcon
                        field="price"
                        active={sortField}
                        dir={sortDir}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSort("stock")}
                      className="flex items-center hover:text-white transition-colors"
                    >
                      Stock Status
                      <SortIcon
                        field="stock"
                        active={sortField}
                        dir={sortDir}
                      />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse opacity-50">
                      <td className="py-4 px-4"><div className="h-10 bg-white/5 rounded-lg w-40" /></td>
                      <td className="py-4 px-4"><div className="h-5 bg-white/5 rounded w-16" /></td>
                      <td className="py-4 px-4"><div className="h-5 bg-white/5 rounded w-16" /></td>
                      <td className="py-4 px-4"><div className="h-5 bg-white/5 rounded w-20" /></td>
                      <td className="py-4 px-4"><div className="h-8 bg-white/5 rounded w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {paginated.map((product) => {
                    const isDiscounted =
                      product.originalPrice &&
                      product.originalPrice > product.price;
                    const stockLevel = product.stock ?? 0;

                    return (
                      // FIX: Removed layoutId from tr — caused Framer Motion reflow bugs on tables
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/[0.01] transition-colors"
                      >
                        {/* Product */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-black/20 rounded-lg border border-white/5 overflow-hidden flex items-center justify-center flex-shrink-0">
                              <img
                                src={
                                  product.images?.[0] || "/placeholder-shoe.png"
                                }
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder-shoe.png";
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-white line-clamp-1">
                                {product.name}
                              </p>
                              <span className="text-xs text-muted-foreground block capitalize">
                                {product.category || "Footwear"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {product.sku || "N/A"}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {formatPrice(product.price)}
                            </span>
                            {isDiscounted && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.originalPrice)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock Badge */}
                        <td className="py-3 px-4">
                          {stockLevel === 0 ? (
                            <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/10 border-0">
                              Out of Stock
                            </Badge>
                          ) : stockLevel <= 5 ? (
                            <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-0">
                              {stockLevel} — Low Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-0">
                              {stockLevel} In Stock
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* FIX: Edit button — validates route exists before navigating */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit product"
                              className="text-muted-foreground hover:text-white hover:bg-white/5"
                              onClick={() => {
                                if (!product.id) {
                                  console.warn(
                                    "Edit clicked but product has no id"
                                  );
                                  return;
                                }
                                navigate(`/admin/products/edit/${product.id}`);
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Apply Promo Discount"
                              className="text-amber-400 hover:text-amber-500 hover:bg-amber-500/10"
                              onClick={() => setDiscountTarget(product)}
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Update Stock"
                              className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
                              onClick={() => setStockTarget(product)}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete Product"
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => setDeleteTarget(product)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
            </table>

            {/* FIX: Two distinct empty states */}
            {products.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Package className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
                <p className="text-muted-foreground font-medium">
                  No products yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Click "Add Product" to get started.
                </p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No products match your search or filter.
                </p>
              </div>
            ) : null}
          </div>

          {/* FIX: Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-white/10 text-white hover:bg-white/5 disabled:opacity-30"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-white/10 text-white hover:bg-white/5 disabled:opacity-30"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {discountTarget && (
          <DiscountModal
            product={discountTarget}
            onClose={() => setDiscountTarget(null)}
            onApply={applyDiscount}
          />
        )}
        {stockTarget && (
          <StockModal
            product={stockTarget}
            onClose={() => setStockTarget(null)}
            onSave={updateStock}
          />
        )}
        {deleteTarget && (
          <DeleteProductModal
            product={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            isLoading={isDeleting}
          />
        )}
      </AnimatePresence>
    </>
  );
}