"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product, ProductColor, ProductSize } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Computed
  totalItems: () => number;
  totalPrice: () => number;

  // Actions
  addItem: (product: Product, size: ProductSize, color: ProductColor) => void;
  removeItem: (productId: string, size: ProductSize, colorName: string) => void;
  updateQuantity: (
    productId: string,
    size: ProductSize,
    colorName: string,
    qty: number
  ) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),

      addItem: (product, size, color) => {
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.product.id === product.id &&
              String(i.size) === String(size) &&
              i.color.name === color.name
          );
          const available = product.inventory_managed ? product.variants?.find((variant) => variant.size === String(size) && variant.color.toLowerCase() === color.name.toLowerCase())?.quantity ?? 0 : Infinity;
          if ((existing?.quantity ?? 0) >= available) return state;

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id &&
                String(i.size) === String(size) &&
                i.color.name === color.name
                  ? { ...i, product, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity: 1, size, color }],
          };
        });
      },

      removeItem: (productId, size, colorName) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.product.id === productId &&
                String(i.size) === String(size) &&
                i.color.name === colorName
              )
          ),
        }));
      },

      updateQuantity: (productId, size, colorName, qty) => {
        if (qty < 1) {
          get().removeItem(productId, size, colorName);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId &&
            String(i.size) === String(size) &&
            i.color.name === colorName
              ? { ...i, quantity: Math.min(qty, i.product.inventory_managed ? i.product.variants?.find((variant) => variant.size === String(size) && variant.color.toLowerCase() === colorName.toLowerCase())?.quantity ?? 0 : qty) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: "clyfer-cart",
      storage: createJSONStorage(() => localStorage),
      // Only persist items — UI state stays ephemeral
      partialize: (state) => ({ items: state.items }),
    }
  )
);
