// src/components/layout/AdminLayout.tsx
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, Package, BarChart2,
  Users, Warehouse, Truck, Settings, LogOut,
  Menu, X, ChevronRight, Tag,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { to: "/admin",           icon: LayoutDashboard, label: "Dashboard",  end: true },
  { to: "/admin/orders",    icon: ShoppingBag,     label: "Orders" },
  { to: "/admin/products",  icon: Package,         label: "Products" },
  { to: "/admin/inventory", icon: Warehouse,       label: "Inventory" },
  { to: "/admin/customers", icon: Users,           label: "Customers" },
  { to: "/admin/analytics", icon: BarChart2,       label: "Analytics" },
  { to: "/admin/shipping",  icon: Truck,           label: "Shipping" },
  { to: "/admin/promos",    icon: Tag,             label: "Promo Codes" },
  { to: "/admin/settings",  icon: Settings,        label: "Settings" },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed && !mobile ? "justify-center" : ""}`}>
        <div className="w-8 h-8 bg-[#dc143c] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-sm">S</span>
        </div>
        {(!collapsed || mobile) && (
          <span className="font-extrabold text-lg tracking-tight">SHOEX Admin</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group relative ${
                isActive
                  ? "bg-[#dc143c] text-white shadow-lg shadow-[#dc143c]/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              } ${collapsed && !mobile ? "justify-center" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || mobile) && <span>{label}</span>}
                {(!collapsed || mobile) && isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                )}
                {/* Tooltip when collapsed */}
                {collapsed && !mobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        {(!collapsed || mobile) && user && (
          <div className="px-3 py-2 rounded-xl bg-white/5 mb-2">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium ${collapsed && !mobile ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-[#f5f5f5] overflow-hidden">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:flex flex-col bg-[#111111] border-r border-white/10 flex-shrink-0 relative"
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-6 w-6 h-6 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center hover:bg-[#dc143c] hover:border-[#dc143c] transition-all z-10"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </motion.aside>

      {/* ── Mobile Sidebar ──────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#111111] border-r border-white/10 z-50"
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-[#111111] flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#dc143c] to-red-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.name?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}