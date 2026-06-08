import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/product";
import { formatPrice } from "@/utils/formatCurrency";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const isOpen = useCartStore((s) => s.isOpen);
  const toggleCart = useCartStore((s) => s.toggleCart);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product details if card is clicked
    const defaultSize = product.sizes[0] || 42;
    const defaultColor = product.colors[0] || { name: "Default", hex: "#e63946" };
    addItem(product, defaultSize, defaultColor);
    if (!isOpen) {
      toggleCart();
    }
  };

  // Determine badge label
  const isLimited = product.tags.includes("limited");
  const isNew = product.tags.includes("new");
  const isTrending = product.tags.includes("trending");

  let badgeLabel = "";
  if (isLimited) badgeLabel = "Limited";
  else if (isNew) badgeLabel = "New";
  else if (isTrending) badgeLabel = "Trending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col rounded-3xl bg-shoex-surface border border-shoex-border p-3.5 transition-all duration-300 hover:border-shoex-red hover:shadow-[0_0_30px_rgba(230,57,70,0.12)]"
    >
      {/* Image Section */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#151515] mb-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />

        {/* Badges */}
        {badgeLabel && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase bg-[#e63946] text-white">
            {badgeLabel}
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-[#0d0d0d]/40 border border-white/10 backdrop-blur-md text-white hover:bg-shoex-red hover:border-shoex-red transition-all duration-300"
        >
          <Heart
            size={14}
            className={isWishlisted ? "fill-white text-white" : "text-white"}
          />
        </button>
      </Link>

      {/* Info Section */}
      <div className="flex flex-col px-1 flex-1 relative">
        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <Star size={13} className="fill-shoex-red text-shoex-red" />
          <span className="text-[12px] font-bold text-shoex-red">
            {product.rating}
          </span>
          <span className="text-[12px] text-shoex-muted">
            ({product.reviewCount})
          </span>
        </div>

        {/* Title */}
        <Link
          to={`/product/${product.id}`}
          className="text-base font-black text-white group-hover:text-shoex-red transition-colors line-clamp-1 mb-0.5"
        >
          {product.name}
        </Link>

        {/* Category */}
        <span className="text-xs text-shoex-muted mb-4 font-semibold">{product.category}</span>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-shoex-muted line-through font-medium">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-shoex-red text-white hover:bg-shoex-red-dark hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_4px_12px_rgba(230,57,70,0.25)]"
            title="Add to Cart"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}