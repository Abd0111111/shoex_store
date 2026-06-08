import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, Search, User, Heart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { productsService } from "@/services/products.service";
import type { Product } from "@/types/product";
import { formatPrice } from "@/utils/formatCurrency";
import MobileNav from "./MobileNav";

const navLinks = [
  { label: "Products", path: "/shop" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  // Update suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim()) {
        try {
          const list = await productsService.getProducts({ search: searchQuery });
          setSuggestions(list.slice(0, 5));
          setShowSuggestions(true);
        } catch (err) {
          console.error("Failed to load search suggestions:", err);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceId);
  }, [searchQuery]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigate to product detail page
  const handleSelectSuggestion = (product: Product) => {
    navigate(`/product/${product.id}`);
    setSearchQuery("");
    setSearchOpen(false);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle search input on Enter key or search icon click
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setSearchOpen(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submit on button click
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setSearchOpen(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#2a2a2a]"
            : "bg-transparent"
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Left Group (Logo + Nav Links) */}
            <div className="flex items-center gap-10">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-[#e63946] rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-sm">S</span>
                </div>
                <span className="text-xl font-black tracking-tight text-white">
                  SHOEX
                </span>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium transition-colors relative group ${
                      pathname === link.path
                        ? "text-white"
                        : "text-[#888] hover:text-white"
                    }`}
                  >
                    {link.label}
                    {pathname === link.path && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#e63946]"
                      />
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Actions (Right Group) */}
            <div className="flex items-center gap-1">
              {/* Search Button + Expandable Input + Dropdown */}
              <div ref={searchRef} className="hidden lg:flex items-center gap-1 relative">
                <AnimatePresence mode="wait">
                  {searchOpen && (
                    <motion.input
                      key="search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => searchQuery && setShowSuggestions(true)}
                      placeholder="Search products..."
                      autoFocus
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 180 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-full px-3 py-1 text-xs outline-none transition-all focus:border-[#e63946]/60 placeholder:text-gray-500"
                    />
                  )}
                </AnimatePresence>

                {/* Autocomplete Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 right-0 w-64 max-h-60 overflow-y-auto bg-[#1a1a1a]/95 backdrop-blur-md border border-[#2a2a2a] rounded-xl shadow-2xl z-50"
                    >
                      {suggestions.map((product, idx) => (
                        <motion.button
                          key={product.id}
                          onClick={() => handleSelectSuggestion(product)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#25252b] transition-colors text-left text-xs border-b border-[#25252b] last:border-b-0"
                        >
                          {/* Product Image */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#222]">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate text-xs">
                              {product.name}
                            </p>
                            <p className="text-gray-500 text-[10px] truncate">
                              {product.category}
                            </p>
                          </div>
                          {/* Price */}
                          <span className="text-white font-bold text-xs flex-shrink-0">
                            {formatPrice(product.price)}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Button */}
                <button
                  onClick={() => {
                    if (searchOpen && searchQuery.trim()) {
                      handleSearchSubmit();
                    } else {
                      setSearchOpen(!searchOpen);
                      if (searchOpen) {
                        setSearchQuery("");
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }
                  }}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                    searchOpen
                      ? "text-[#e63946] bg-[#1a1a1a]"
                      : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Wishlist Button */}
              <Link
                to="/account?tab=wishlist"
                className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1a1a1a] transition-colors text-[#888] hover:text-white"
              >
                <Heart size={18} />
              </Link>

              {isAuthenticated ? (
                <Link
                  to={user?.role === "admin" ? "/admin" : "/account"}
                  className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1a1a1a] transition-colors text-[#888] hover:text-white"
                >
                  <User size={18} />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1a1a1a] transition-colors text-[#888] hover:text-white"
                >
                  <User size={18} />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1a1a1a] text-[#888] hover:text-white transition-colors"
              >
                <ShoppingBag size={18} />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-[#e63946] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Mobile Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1a1a1a] transition-colors text-white ml-1"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}