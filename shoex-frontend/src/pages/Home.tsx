import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Package, Sparkles, ArrowRight } from "lucide-react";
import { productsService } from "@/services/products.service";
import ProductCarousel from "@/components/products/ProductCarousel";
import type { Product } from "@/types/product";

// ─── Hero Shoes ─────────────────────────────────────────────────────────────────
const HERO_SHOES = [
  {
    colorName: "Arctic White",
    hex: "#ffffff",
    image: "/shoes/Arctic%20White.png",
    glowColor: "rgba(255, 255, 255, 0.15)",
    title: "Apex Runner Nitro",
    subtitle: "Engineered for speed, built for style.",
  },
  {
    colorName: "Blush Rose",
    hex: "#f4a7a3",
    image: "/shoes/Blush%20Rose.png",
    glowColor: "rgba(244, 167, 163, 0.2)",
    title: "Quantum React Volt",
    subtitle: "Lightweight cushion that feels like flying.",
  },
  {
    colorName: "Phantom Black",
    hex: "#1a1a1a",
    image: "/shoes/Phantom%20Black.png",
    glowColor: "rgba(255, 255, 255, 0.05)",
    title: "Court Classic Retro",
    subtitle: "Premium street vibe meets all-day fit.",
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [limitedProducts, setLimitedProducts] = useState<Product[]>([]);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      const [trending, arrivals, limited] = await Promise.all([
        productsService.getProductsByTag("trending"),
        productsService.getProductsByTag("new"),
        productsService.getProductsByTag("limited"),
      ]);
      setTrendingProducts(trending);
      setNewProducts(arrivals);
      setLimitedProducts(limited);
    };
    loadProducts();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      // TODO: connect to newsletter API — POST /api/newsletter/subscribe
      setIsSubscribed(true);
      setEmailInput("");
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  const activeHero = HERO_SHOES[activeHeroIdx];

  return (
    <div className="flex flex-col w-full bg-shoex-bg text-shoex-text overflow-x-hidden">

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] lg:min-h-[95vh] flex flex-col items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Background glow */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div
            className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full blur-[100px] transition-all duration-700"
            style={{ backgroundColor: activeHero.glowColor }}
          />
        </div>

        <div className="flex flex-col items-center text-center w-full z-10 max-w-4xl mx-auto">

          {/* Title */}
          <motion.h1
            key={activeHero.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none text-white mb-6"
          >
            Step Into <br />
            <span className="text-[#e63946]">The Future</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-shoex-muted max-w-2xl mb-10 leading-relaxed font-medium"
          >
            Premium sneakers for the modern generation. Clean design meets ultimate comfort.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 w-full sm:w-auto px-4 sm:px-0"
          >
            <Link
              to="/shop"
              className="px-6 py-3.5 bg-[#e63946] hover:bg-[#c1121f] text-white rounded-xl font-bold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto text-center"
            >
              Explore Collection <ArrowRight size={16} />
            </Link>
            <Link
              to="/shop"
              className="px-6 py-3.5 bg-[#161619] border border-[#2a2a2a] hover:bg-[#202024] text-white rounded-xl font-bold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto text-center"
            >
              New Arrivals
            </Link>
          </motion.div>

          {/* Sneaker Image */}
          <motion.div
            key={activeHeroIdx}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl relative border border-white/5 aspect-[16/10] sm:aspect-[21/9] bg-[#0c0c0e]"
          >
            <img
              src={activeHero.image}
              alt={activeHero.title}
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* Color Switcher Dots */}
          <div className="flex items-center gap-3 mt-6">
            {HERO_SHOES.map((shoe, idx) => (
              <button
                key={shoe.colorName}
                onClick={() => setActiveHeroIdx(idx)}
                title={shoe.colorName}
                className={`transition-all duration-300 rounded-full border-2 ${activeHeroIdx === idx
                  ? "w-8 h-4 border-white/40"
                  : "w-4 h-4 border-transparent hover:scale-110"
                  }`}
                style={{ backgroundColor: shoe.hex }}
              />
            ))}
          </div>
          <p className="text-xs text-shoex-muted mt-2 font-medium tracking-wide">
            {activeHero.colorName}
          </p>

        </div>
      </section>

      {/* ── 2. VALUE PROPS ──────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: TrendingUp, title: "Trending Styles", desc: "Latest drops everyone loves", delay: 0 },
            { icon: Package, title: "Fast Delivery", desc: "Free shipping over $100", delay: 0.15 },
            { icon: Sparkles, title: "Premium Quality", desc: "Authentic sneakers only", delay: 0.3 },
          ].map(({ icon: Icon, title, desc, delay }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay }}
              className="flex items-center gap-5 p-6 rounded-2xl bg-shoex-surface border border-shoex-border hover:border-white/10 transition-all duration-300"
            >
              <div className="text-shoex-red flex-shrink-0">
                <Icon size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">{title}</h3>
                <p className="text-xs text-shoex-muted leading-relaxed font-medium">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 3. TRENDING NOW ─────────────────────────────────────────────────── */}
      {trendingProducts.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Trending Now
              </h2>
              <p className="text-sm text-shoex-muted mt-2">Most popular picks this week</p>
            </div>
            <Link
              to="/shop"
              className="flex items-center gap-1 text-sm font-bold text-shoex-red hover:text-shoex-red-dark transition-colors"
            >
              View All <ArrowRight size={14} className="mt-0.5" />
            </Link>
          </div>
          <ProductCarousel products={trendingProducts} />
        </section>
      )}

      {/* ── 4. NEW ARRIVALS ─────────────────────────────────────────────────── */}
      {newProducts.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
                New Arrivals
              </h2>
              <p className="text-sm text-shoex-muted mt-2">Fresh drops just landed</p>
            </div>
            <Link
              to="/shop"
              className="flex items-center gap-1 text-sm font-bold text-shoex-red hover:text-shoex-red-dark transition-colors"
            >
              View All <ArrowRight size={14} className="mt-0.5" />
            </Link>
          </div>
          <ProductCarousel products={newProducts} />
        </section>
      )}

      {/* ── 5. LIMITED EDITION ──────────────────────────────────────────────── */}
      {limitedProducts.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Limited Edition
              </h2>
              <p className="text-sm text-shoex-muted mt-2">Exclusive drops, limited stock</p>
            </div>
            <Link
              to="/shop"
              className="flex items-center gap-1 text-sm font-bold text-shoex-red hover:text-shoex-red-dark transition-colors"
            >
              View All <ArrowRight size={14} className="mt-0.5" />
            </Link>
          </div>
          <ProductCarousel products={limitedProducts} />
        </section>
      )}

      {/* ── 6. NEWSLETTER ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-shoex-surface border border-shoex-border p-8 sm:p-12 lg:p-16 flex flex-col items-center text-center overflow-hidden shadow-2xl"
        >
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-shoex-red/10 rounded-full blur-[80px] pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 uppercase tracking-tight z-10">
            Join SHOEX Club
          </h2>
          <p className="text-base text-shoex-muted max-w-xl mb-10 z-10 leading-relaxed font-medium">
            Get exclusive access to limited drops, early releases, and members-only discounts.
          </p>

          <AnimatePresence mode="wait">
            {!isSubscribed ? (
              <motion.form
                key="form"
                onSubmit={handleSubscribe}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col sm:flex-row items-stretch w-full max-w-lg gap-4 z-10"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 px-6 py-4 rounded-xl bg-[#0d0d0d] border border-shoex-border text-white placeholder-shoex-muted outline-none focus:border-shoex-red focus:shadow-[0_0_15px_rgba(230,57,70,0.15)] transition-all duration-300"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-shoex-red hover:bg-shoex-red-dark text-white rounded-xl font-bold tracking-wide shadow-[0_4px_15px_rgba(230,57,70,0.25)] hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Subscribe
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="z-10 bg-shoex-red/10 border border-shoex-red/30 px-8 py-6 rounded-2xl max-w-md"
              >
                <Sparkles className="mx-auto text-shoex-red mb-3" size={32} />
                <h4 className="text-white font-bold text-lg mb-1">You're on the list!</h4>
                <p className="text-sm text-shoex-muted leading-relaxed">
                  Welcome to SHOEX Club. Check your inbox soon for your exclusive early access code.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

    </div>
  );
}