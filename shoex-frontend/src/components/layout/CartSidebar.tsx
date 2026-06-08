import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";

export default function CartSidebar() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, totalPrice } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
          />
          <motion.aside
            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#111] z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#e63946]" />
                <h2 className="font-bold text-white text-lg">Your Cart</h2>
                {items.length > 0 && (
                  <span className="bg-[#e63946] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                )}
              </div>
              <button
                onClick={toggleCart}
                className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#888] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                    <ShoppingBag size={24} className="text-[#555]" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Your cart is empty</p>
                    <p className="text-sm text-[#888] mt-1">Looks like you haven't added anything yet</p>
                  </div>
                  <button
                    onClick={toggleCart}
                    className="mt-2 bg-[#e63946] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#c1121f] transition-colors"
                  >
                    Start Shopping →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.product.id}-${item.selectedSize}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 bg-[#1a1a1a] rounded-xl p-3"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg bg-[#222]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-[#888] mt-0.5">Size: {item.selectedSize}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-[#0d0d0d] rounded-lg px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                              className="text-[#888] hover:text-white"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-white text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                              className="text-[#888] hover:text-white"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeItem(item.product.id, item.selectedSize)}
                              className="text-[#555] hover:text-[#e63946] transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-[#2a2a2a] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#888]">Subtotal</span>
                  <span className="text-white font-black text-xl">${totalPrice().toFixed(2)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={toggleCart}
                  className="block w-full bg-[#e63946] hover:bg-[#c1121f] text-white font-bold py-4 rounded-xl text-center transition-colors"
                >
                  Checkout →
                </Link>
                <Link
                  to="/cart"
                  onClick={toggleCart}
                  className="block w-full bg-[#1a1a1a] text-white font-medium py-3 rounded-xl text-center hover:bg-[#222] transition-colors"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}