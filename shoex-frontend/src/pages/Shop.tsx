import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { productsService } from "@/services/products.service";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types/product";
import { formatPrice } from "@/utils/formatCurrency";

// ─── Constants ──────────────────────────────────────────────────────────────────
const ALL_SIZES = [38, 39, 40, 41, 42, 43, 44, 45];

const SORT_OPTIONS = [
  { label: "Default",        value: "default"      },
  { label: "Price: Low → High", value: "price-asc" },
  { label: "Price: High → Low", value: "price-desc"},
  { label: "Top Rated",      value: "rating"       },
  { label: "Name: A → Z",   value: "name-asc"     },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ─── Sidebar content (shared between desktop + mobile drawer) ───────────────────
function FilterPanel({
  categories,
  selectedCategory,
  setSelectedCategory,
  availableSizes,
  selectedSize,
  setSelectedSize,
  maxPrice,
  priceRange,
  setPriceRange,
  onClose,
}: {
  categories: { name: string; count: number }[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  availableSizes: number[];
  selectedSize: number | null;
  setSelectedSize: (s: number | null) => void;
  maxPrice: number;
  priceRange: number;
  setPriceRange: (v: number) => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header (mobile only) */}
      {onClose && (
        <div className="flex items-center justify-between">
          <span className="text-white font-black text-lg">Filters</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Category */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3">Category</h3>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#e63946] text-white shadow-[0_4px_12px_rgba(230,57,70,0.25)]"
                    : "text-[#888] hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-xs ${isActive ? "text-white/80" : "text-[#555]"}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-shoex-border" />

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Max Price</h3>
          <span className="text-sm font-bold text-[#e63946]">{formatPrice(priceRange)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={maxPrice}
          step={10}
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-[#e63946] cursor-pointer"
        />
        <div className="flex justify-between text-xs text-[#555] mt-1">
          <span>0 EGP</span>
          <span>{formatPrice(maxPrice)}</span>
        </div>
      </div>

      <div className="h-px bg-shoex-border" />

      {/* Sizes */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3">Size</h3>
        <div className="grid grid-cols-4 gap-2">
          {ALL_SIZES.map((size) => {
            const isSelected  = selectedSize === size;
            const isAvailable = availableSizes.includes(size);
            return (
              <button
                key={size}
                onClick={() => isAvailable && setSelectedSize(isSelected ? null : size)}
                title={!isAvailable ? "Not available" : undefined}
                className={`aspect-square w-full rounded-xl border text-xs font-black flex items-center justify-center transition-all duration-200 relative ${
                  isSelected
                    ? "bg-[#e63946] border-[#e63946] text-white shadow-[0_4px_10px_rgba(230,57,70,0.2)]"
                    : isAvailable
                    ? "border-[#2a2a2a] text-[#888] hover:border-white hover:text-white cursor-pointer"
                    : "border-[#1e1e1e] text-[#333] cursor-not-allowed"
                }`}
              >
                {size}
                {/* Strike-through line for unavailable sizes */}
                {!isAvailable && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-full h-px bg-[#333] rotate-45 absolute" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#555] mt-2">Greyed sizes not available for current filters</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Shop() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize,     setSelectedSize]     = useState<number | null>(null);
  const [sortBy,           setSortBy]           = useState<SortValue>("default");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showSortMenu,     setShowSortMenu]     = useState(false);

  // Maximum boundary price
  const maxPrice = 500;
  const [priceRange, setPriceRange] = useState(maxPrice);

  // Fetch categories list
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await productsService.getCategories();
        const totalCount = data.reduce((sum, c) => sum + c.count, 0);
        setCategories([
          { name: "All", count: totalCount },
          ...data
        ]);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCats();
  }, []);

  // Fetch filtered products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory && selectedCategory !== "All") params.category = selectedCategory;
        if (selectedSize) params.size = selectedSize;
        if (sortBy && sortBy !== "default") params.sort = sortBy;
        if (priceRange < maxPrice) params.maxPrice = priceRange;

        const data = await productsService.getProducts(params);
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategory, selectedSize, priceRange, sortBy, searchQuery]);

  // Derived available sizes from loaded products (all unique sizes in result set)
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<number>();
    for (const p of products) {
      if (p.sizes) {
        for (const s of p.sizes) sizeSet.add(s);
      }
    }
    return Array.from(sizeSet);
  }, [products]);

  const hasFilters = selectedCategory !== "All" || selectedSize !== null || priceRange < maxPrice;

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedSize(null);
    setPriceRange(maxPrice);
  };

  const filterPanelProps = {
    categories,
    selectedCategory,
    setSelectedCategory,
    availableSizes,
    selectedSize,
    setSelectedSize,
    maxPrice,
    priceRange,
    setPriceRange,
  };

  return (
    <div className="pt-24 lg:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-screen text-white">

      {/* Mobile Filter Button */}
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <span className="text-sm text-shoex-muted font-medium">
          {products.length} results
        </span>
        <button
          onClick={() => setShowMobileFilter(true)}
          className="flex items-center gap-2 px-4 py-2 bg-shoex-surface border border-shoex-border rounded-xl text-sm font-bold text-white hover:border-white/20 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-[#e63946]" />
          )}
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showMobileFilter && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setShowMobileFilter(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-80 max-w-[90vw] bg-[#111114] border-r border-shoex-border z-50 p-6 overflow-y-auto lg:hidden"
            >
              <FilterPanel
                {...filterPanelProps}
                onClose={() => setShowMobileFilter(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-shoex-surface border border-shoex-border p-6 rounded-3xl sticky top-28">
          <FilterPanel {...filterPanelProps} />
        </aside>

        {/* Products Section */}
        <section className="lg:col-span-9 flex flex-col gap-6">

          {/* Toolbar: results count + sort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-shoex-muted tracking-wider uppercase">
                {loading ? "Loading results..." : `Showing ${products.length} results`}
              </span>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-[#e63946] hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-shoex-surface border border-shoex-border rounded-xl text-sm font-bold text-white hover:border-white/20 transition-colors"
              >
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-[#111114] border border-shoex-border rounded-2xl shadow-2xl z-20 overflow-hidden"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors ${
                          sortBy === opt.value
                            ? "text-[#e63946] bg-[#e63946]/5"
                            : "text-[#888] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active filters chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2">
              {selectedCategory !== "All" && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#e63946]/10 border border-[#e63946]/30 rounded-full text-xs font-bold text-[#e63946]">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("All")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedSize !== null && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#e63946]/10 border border-[#e63946]/30 rounded-full text-xs font-bold text-[#e63946]">
                  Size {selectedSize}
                  <button onClick={() => setSelectedSize(null)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {priceRange < maxPrice && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#e63946]/10 border border-[#e63946]/30 rounded-full text-xs font-bold text-[#e63946]">
                  Max {formatPrice(priceRange)}
                  <button onClick={() => setPriceRange(maxPrice)}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[4/5] w-full bg-[#161619] border border-shoex-border rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#2a2a2a] rounded-3xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-7 h-7 text-[#555]" />
              </div>
              <p className="text-white font-bold mb-2">No products found</p>
              <p className="text-sm text-shoex-muted mb-6">
                Try adjusting your filters to find what you're looking for.
              </p>
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-[#161619] hover:bg-[#202024] border border-[#2a2a2a] text-white rounded-xl text-sm font-bold transition-all"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}