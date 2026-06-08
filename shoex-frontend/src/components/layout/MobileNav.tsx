import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, User, Heart, Home, Grid3X3, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const mobileLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Products", path: "/shop", icon: Grid3X3 },
  { label: "New Arrivals", path: "/shop?tag=new", icon: TrendingUp },
  { label: "Trending", path: "/shop?tag=trending", icon: TrendingUp },
];

export default function MobileNav({ isOpen, onClose }: Props) {
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-72 bg-[#111] z-50 lg:hidden flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#e63946] rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">S</span>
                </div>
                <span className="font-black text-white">SHOEX</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#888] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 p-5 space-y-1">
              {mobileLinks.map((link, i) => {
                const Icon = link.icon;
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        pathname === link.path
                          ? "bg-[#e63946] text-white"
                          : "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-[#2a2a2a] space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full py-3 rounded-xl bg-[#1a1a1a] text-[#888] font-medium hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="block w-full py-3 rounded-xl bg-[#1a1a1a] text-center text-white font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={onClose}
                    className="block w-full py-3 rounded-xl bg-[#e63946] text-center text-white font-bold"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}