import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  Minus,
  Plus,
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { productsService } from "@/services/products.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/product";
import ProductCard from "@/components/products/ProductCard";
import { toast } from "sonner";
import { formatPrice } from "@/utils/formatCurrency";

// ─── Max quantity per item ───────────────────────────────────────────────────────
const MAX_QTY = 10;

// ─── Star Rating ────────────────────────────────────────────────────────────────
function StarRating({ rating, size = 15, onSelect }: { rating: number; size?: number; onSelect?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          onClick={() => onSelect && onSelect(star)}
          className={`${onSelect ? "cursor-pointer transition-transform hover:scale-110" : ""} ${
            star <= Math.round(rating)
              ? "fill-[#e63946] text-[#e63946]"
              : "fill-transparent text-[#444]"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [product,          setProduct]          = useState<Product | null>(null);
  const [activeImageIdx,   setActiveImageIdx]   = useState(0);
  const [selectedSize,     setSelectedSize]     = useState<number | null>(null);
  const [selectedColorName,setSelectedColorName]= useState<string>("");
  const [quantity,         setQuantity]         = useState(1);
  const [isWishlisted,     setIsWishlisted]     = useState(false);
  const [relatedProducts,  setRelatedProducts]  = useState<Product[]>([]);
  const [sizeError,        setSizeError]        = useState(false);

  // Reviews states
  const [reviews,          setReviews]          = useState<any[]>([]);
  const [reviewsLoading,   setReviewsLoading]   = useState(true);
  const [newRating,        setNewRating]        = useState(5);
  const [newComment,       setNewComment]       = useState("");
  const [commentError,     setCommentError]     = useState<string>("");   // ← NEW: inline error for comment
  const [submitLoading,    setSubmitLoading]    = useState(false);

  const addItem    = useCartStore((s) => s.addItem);
  const toggleCart = useCartStore((s) => s.toggleCart);

  const loadProductData = async () => {
    const targetId = id || "";
    if (!targetId) return;

    try {
      const fetched = await productsService.getProductById(targetId);
      if (fetched) {
        setProduct(fetched);
        setActiveImageIdx(0);
        setSelectedSize(null);
        setQuantity(1);
        if (fetched.colors?.length > 0) {
          setSelectedColorName(fetched.colors[0].name);
        }
      }

      // Check wishlist if user is authenticated
      if (isAuthenticated) {
        const wishlist = await authService.getWishlist();
        const found = wishlist.some((item: any) => item._id === targetId);
        setIsWishlisted(found);
      }
    } catch (err) {
      console.error("Failed to fetch product details:", err);
    }
  };

  const loadReviews = async () => {
    const targetId = id || "";
    if (!targetId) return;

    setReviewsLoading(true);
    try {
      const data = await productsService.getProductReviews(targetId);
      setReviews(data.data || []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadProductData();
    loadReviews();

    const loadRelated = async () => {
      try {
        const all = await productsService.getProducts();
        setRelatedProducts(all.filter((p) => p.id !== id).slice(0, 3));
      } catch (err) {
        console.error(err);
      }
    };
    loadRelated();
  }, [id, isAuthenticated]);

  // Wishlist toggle handler
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.info("Please login to manage your wishlist.");
      navigate("/login");
      return;
    }

    if (!product) return;

    try {
      if (isWishlisted) {
        await authService.removeFromWishlist(product.id);
        setIsWishlisted(false);
        toast.success("Removed from wishlist.");
      } else {
        await authService.addToWishlist(product.id);
        setIsWishlisted(true);
        toast.success("Added to wishlist.");
      }
    } catch (err: any) {
      const status    = err.response?.status;
      const serverMsg = err.response?.data?.error;

      if (serverMsg) {
        toast.error(serverMsg);
      } else if (status === 401) {
        toast.error("Please login to manage your wishlist.");
      } else {
        toast.error("Failed to update wishlist. Please try again.");
      }
    }
  };

  // ── Comment change handler — clears inline error live ──────────────────────
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    if (commentError && value.trim().length >= 10) {
      setCommentError("");
    }
  };

  // Submit review handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please login to write a review.");
      navigate("/login");
      return;
    }

    if (!product) return;

    // ── Inline validation ──────────────────────────────────────────────────────
    if (newComment.trim().length === 0) {
      setCommentError("Please write a comment before submitting.");
      return;
    }
    if (newComment.trim().length < 10) {
      setCommentError(`Comment is too short (${newComment.trim().length}/10 characters minimum).`);
      return;
    }

    setCommentError("");
    setSubmitLoading(true);

    try {
      await productsService.submitProductReview(product.id, {
        rating: newRating,
        comment: newComment,
      });
      toast.success("Review submitted successfully!");
      setNewComment("");
      setNewRating(5);
      // Reload reviews and product rating
      loadReviews();
      loadProductData();
    } catch (err: any) {
      const status    = err.response?.status;
      const serverMsg = err.response?.data?.error;

      if (serverMsg) {
        // Server returned a specific error message — show it inline under the comment field
        setCommentError(serverMsg);
      } else if (status === 403) {
        setCommentError("You must purchase this product before leaving a review.");
      } else if (status === 401) {
        toast.error("Please login to submit a review.");
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Not found ──
  if (!product) {
    return (
      <div className="pt-32 pb-20 px-4 text-center text-white">
        <p className="text-[#888] mb-4">Product not found.</p>
        <Link to="/shop" className="text-[#e63946] hover:underline font-bold">
          Back to Shop
        </Link>
      </div>
    );
  }

  // ── Derived values ──
  const isOutOfStock = product.stock === 0;
  const isLowStock   = product.stock > 0 && product.stock <= 5;

  // Use product's real sizes; fallback to default list if not provided
  const availableSizes: number[] = product.sizes?.length
    ? product.sizes
    : [38, 39, 40, 41, 42, 43, 44, 45];

  // Use product's real colors; fallback to defaults
  const availableColors = product.colors?.length
    ? product.colors
    : [
        { name: "Black/White", hex: "#111111" },
        { name: "Blue/Orange", hex: "#2b4c7e" },
        { name: "Grey/Green",  hex: "#7a8b7b" },
      ];

  // Only show real product images
  const images = product.images.filter(Boolean);

  // ── Handlers ──
  const handleAddToCart = () => {
    if (!selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    const chosenColor = availableColors.find((c) => c.name === selectedColorName)
      ?? availableColors[0];
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize, chosenColor);
    }
    toggleCart();
  };

  const handleBuyNow = () => {
    if (!selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    const chosenColor = availableColors.find((c) => c.name === selectedColorName)
      ?? availableColors[0];
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize, chosenColor);
    }
    navigate("/checkout");
  };

  return (
    <div className="pt-24 lg:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-screen text-white">

      {/* Back Link */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-1 text-sm font-bold text-[#888] hover:text-white mb-8 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">

        {/* ── Left: Images ── */}
        <div className="lg:col-span-6 flex flex-col gap-4">

          {/* Main image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[#151515] border border-shoex-border">
            <img
              src={images[activeImageIdx] ?? images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {product.tags?.includes("limited") && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase bg-[#e63946] text-white">
                  Limited
                </span>
              )}
              {isOutOfStock && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase bg-black/70 text-white border border-white/10">
                  Out of Stock
                </span>
              )}
              {isLowStock && !isOutOfStock && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase bg-amber-500/90 text-white">
                  Only {product.stock} left
                </span>
              )}
            </div>

            {/* Original price badge */}
            {product.originalPrice && (
              <div className="absolute top-4 right-16 z-10 px-3 py-1.5 rounded-lg text-xs font-black bg-green-500/90 text-white">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
              </div>
            )}

            {/* Wishlist Heart Toggle */}
            <button
              onClick={handleWishlistToggle}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#0d0d0d]/40 border border-white/10 backdrop-blur-md text-white hover:bg-[#e63946] hover:border-[#e63946] transition-all duration-300"
            >
              <Heart
                size={16}
                className={isWishlisted ? "fill-white text-white" : "text-white"}
              />
            </button>
          </div>

          {/* Thumbnails — only real images */}
          {images.length > 1 && (
            <div className={`grid gap-4 ${images.length >= 4 ? "grid-cols-4" : `grid-cols-${images.length}`}`}>
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`aspect-square w-full overflow-hidden rounded-2xl border bg-[#151515] transition-all duration-300 ${
                    activeImageIdx === idx
                      ? "border-[#e63946] ring-1 ring-[#e63946]"
                      : "border-shoex-border hover:border-white/20"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Details ── */}
        <div className="lg:col-span-6 flex flex-col">

          {/* Category */}
          <span className="text-xs font-black tracking-widest uppercase text-[#e63946] mb-3">
            {product.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-6">
            <StarRating rating={product.rating} />
            <span className="text-sm font-bold text-white">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-[#888]">({product.reviewCount} reviews)</span>
          </div>

          {/* Description */}
          <p className="text-[#888] leading-relaxed font-medium mb-6">
            {product.description}
          </p>

          {/* Price */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl font-black text-white">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-lg font-bold text-[#555] line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="h-px bg-shoex-border mb-8" />

          {/* Out of Stock Banner */}
          {isOutOfStock && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-400">Out of Stock</p>
                <p className="text-xs text-[#888]">This product is currently unavailable.</p>
              </div>
            </div>
          )}

          {/* Select Size */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-white">
                Select Size
                {sizeError && (
                  <span className="ml-2 text-xs text-red-500 font-semibold normal-case tracking-normal">
                    — Please select a size
                  </span>
                )}
              </span>
              <span className="text-xs text-[#888] hover:text-white cursor-pointer transition-colors">
                Size Guide
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(false); }}
                    disabled={isOutOfStock}
                    className={`h-11 rounded-xl border font-black text-sm flex items-center justify-center transition-all duration-200 ${
                      isOutOfStock
                        ? "border-[#1e1e1e] text-[#333] cursor-not-allowed"
                        : isSelected
                        ? "bg-[#e63946] border-[#e63946] text-white shadow-[0_4px_12px_rgba(230,57,70,0.25)]"
                        : "border-[#2a2a2a] text-[#888] hover:border-white hover:text-white cursor-pointer"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Color */}
          {availableColors.length > 0 && (
            <div className="mb-8">
              <span className="text-sm font-bold uppercase tracking-wider text-white block mb-4">
                Select Color
              </span>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((color) => {
                  const isSelected = selectedColorName === color.name;
                  return (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColorName(color.name)}
                      disabled={isOutOfStock}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-black transition-all duration-200 flex items-center gap-2 ${
                        isOutOfStock
                          ? "border-[#1e1e1e] text-[#333] cursor-not-allowed"
                          : isSelected
                          ? "bg-white/10 border-white text-white"
                          : "border-[#2a2a2a] text-[#888] hover:border-white/20 hover:text-white cursor-pointer"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/10 block flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <span className="text-sm font-bold uppercase tracking-wider text-white block mb-4">
              Quantity
            </span>
            <div className="inline-flex items-center bg-[#161619] border border-[#2a2a2a] rounded-xl p-1 gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isOutOfStock}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#888] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-black text-white w-4 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
                disabled={isOutOfStock}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#888] hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
              </button>
            </div>
            {quantity === MAX_QTY && (
              <p className="text-xs text-amber-500 mt-2">Max {MAX_QTY} items per order.</p>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 h-14 bg-[#e63946] hover:bg-[#c1121f] text-white rounded-xl font-bold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(230,57,70,0.35)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ShoppingBag size={18} />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Buy Now
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 border-t border-shoex-border pt-8 mb-8">
            {[
              { icon: Truck,       label: "Free Shipping"  },
              { icon: RotateCcw,   label: "30-Day Returns" },
              { icon: ShieldCheck, label: "2-Year Warranty"},
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center p-3">
                <Icon className="text-[#e63946] mb-2" size={20} />
                <span className="text-xs font-bold text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reviews & Ratings Section ── */}
      <section className="border-t border-shoex-border pt-16 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Reviews list */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare size={22} className="text-[#e63946]" />
              Customer Reviews ({reviews.length})
            </h2>

            {reviewsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#161619] border border-shoex-border rounded-2xl p-5 animate-pulse h-28" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-[#161619] border border-dashed border-white/10 rounded-2xl p-8 text-center text-gray-500 text-sm">
                No reviews yet for this product. Be the first to buy and write a review!
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {reviews.map((rev, i) => (
                  <motion.div
                    key={rev.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#161619] border border-shoex-border rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-bold text-sm flex items-center gap-2">
                        {rev.userName || "Customer"}
                        {rev.verified && (
                          <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full font-black">
                            Verified Purchase
                          </span>
                        )}
                      </p>
                      <span className="text-[#555] text-xs font-semibold">
                        {new Date(rev.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="mb-3">
                      <StarRating rating={rev.rating} size={12} />
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{rev.comment}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Review form */}
          <div className="lg:col-span-5 bg-[#161619] border border-shoex-border rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl font-black text-white mb-2">Write a Review</h3>
            <p className="text-gray-500 text-xs mb-6">Share your experience with other shoppers.</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Your Rating</label>
                <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-3 inline-flex">
                  <StarRating rating={newRating} size={20} onSelect={setNewRating} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Comment</label>
                <textarea
                  value={newComment}
                  onChange={handleCommentChange}
                  rows={4}
                  placeholder="Tell us about the fit, comfort, quality (min 10 characters)..."
                  className={`w-full bg-[#0d0d0d] border rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder:text-gray-600 resize-none ${
                    commentError
                      ? "border-red-500/60 focus:border-red-500"
                      : "border-white/8 focus:border-[#e63946]/50 hover:border-white/12"
                  }`}
                />
                {/* ── Inline error message ── */}
                {commentError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs text-red-400 font-semibold flex items-center gap-1.5"
                  >
                    <AlertTriangle size={12} className="flex-shrink-0" />
                    {commentError}
                  </motion.p>
                )}
                {/* ── Live character counter ── */}
                {newComment.length > 0 && newComment.trim().length < 10 && !commentError && (
                  <p className="mt-1.5 text-xs text-[#555]">
                    {newComment.trim().length}/10 characters minimum
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#e63946]/20"
              >
                {submitLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  "Submit Review"
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-shoex-border pt-16">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}