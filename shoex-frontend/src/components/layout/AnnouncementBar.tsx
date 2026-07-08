import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { formatPrice } from "@/utils/formatCurrency";

interface PromoData {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
}

export default function AnnouncementBar({
  promo,
}: {
  promo: PromoData;
}) {
  if (!promo) return null;

  const discountText =
    promo.discountType === "percentage"
      ? `${promo.discountValue}% OFF`
      : `${formatPrice(promo.discountValue)} OFF`;

  const minOrderText =
    promo.minOrderValue && promo.minOrderValue > 0
      ? ` ON ORDERS OVER ${formatPrice(promo.minOrderValue)}`
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d] border-b border-white/5 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto h-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full flex items-center justify-center gap-4">
          <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex items-center justify-center whitespace-nowrap text-[11px] sm:text-xs md:text-[13px] font-semibold tracking-[0.18em] uppercase text-gray-300 select-none">
            <Tag className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mr-2" />

            <span className="text-gray-400">
              Use Code{" "}
            </span>

            <span
              className="
                mx-2
                font-black
                text-[#e63946]
                hover:text-[#ff4d5a]
                transition-colors
                duration-200
                cursor-pointer
              "
            >
              {promo.code}
            </span>

            <span className="text-gray-400">
              — {discountText}
              {minOrderText}
            </span>
          </div>

          <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}