import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/layout/CartSidebar";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import api from "@/services/api";

export default function RootLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const [activePromo, setActivePromo] = useState<any>(null);

  useEffect(() => {
    if (isAdmin) return;
    const fetchActivePromo = async () => {
      try {
        const { data } = await api.get("/promo/active");
        if (data.success && data.data) {
          setActivePromo(data.data);
        } else {
          setActivePromo(null);
        }
      } catch (err) {
        console.error("Failed to load active promo:", err);
        setActivePromo(null);
      }
    };
    fetchActivePromo();
  }, [pathname, isAdmin]);

  const hasBanner = !isAdmin && !!activePromo;

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d] text-[#f5f5f5]">
      {hasBanner && <AnnouncementBar promo={activePromo} />}
      {!isAdmin && <Navbar hasBanner={hasBanner} />}
      <CartSidebar />
      <main className={`flex-1 transition-all duration-300 ${hasBanner ? "pt-10" : ""}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}