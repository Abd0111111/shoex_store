import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types/product";

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      // Run once on load/resize
      checkScroll();
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      carouselRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group/carousel w-full">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-[#1a1a1a]/80 border border-[#2a2a2a] text-white hover:bg-shoex-red hover:border-shoex-red transition-all duration-300 shadow-xl opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-[#1a1a1a]/80 border border-[#2a2a2a] text-white hover:bg-shoex-red hover:border-shoex-red transition-all duration-300 shadow-xl opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="w-full flex items-stretch gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[280px] sm:w-[320px] md:w-[340px] flex-shrink-0"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}