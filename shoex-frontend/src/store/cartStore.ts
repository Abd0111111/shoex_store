import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types/cart";
import type { Product, ProductColor } from "../types/product";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, size: number, color: ProductColor) => void;
  removeItem: (productId: string, size: number) => void;
  updateQuantity: (productId: string, size: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, size, color) => {
        const existing = get().items.find(
          (i) => i.product.id === product.id && i.selectedSize === size
        );
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.product.id === product.id && i.selectedSize === size
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              { product, quantity: 1, selectedSize: size, selectedColor: color },
            ],
          }));
        }
      },

      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product.id === productId && i.selectedSize === size)
          ),
        })),

      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId && i.selectedSize === size
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    { name: "shoex-cart" }
  )
);