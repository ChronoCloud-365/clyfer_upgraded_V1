"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product, ProductColor, ProductSize } from "@/types";
interface CartState {
  items: CartItem[]; isOpen: boolean;
  totalItems: () => number; totalPrice: () => number;
  addItem: (product: Product, size: ProductSize, color: ProductColor, model?: string, variantId?: string) => void;
  removeItem: (productId: string, size: ProductSize, colorName: string, model?: string, variantId?: string) => void;
  updateQuantity: (productId: string, size: ProductSize, colorName: string, qty: number, model?: string, variantId?: string) => void;
  clearCart: () => void; toggleCart: () => void; setCartOpen: (open: boolean) => void;
}
function matches(item: CartItem, productId: string, size: ProductSize, color: string, model = "", variantId?: string) {
  return item.product.id === productId && (variantId && item.variant_id ? variantId === item.variant_id
    : String(item.size).toLowerCase() === String(size).toLowerCase() && item.color.name.toLowerCase() === color.toLowerCase() && (item.model || "").toLowerCase() === model.toLowerCase());
}
export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [], isOpen: false,
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  totalPrice: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  addItem: (product, size, color, model = "", variantId) => {
    set((state) => {
      const variant = product.variants?.find((entry) => variantId ? entry.id === variantId : entry.size.toLowerCase() === String(size).toLowerCase() && entry.color.toLowerCase() === color.name.toLowerCase() && entry.model.toLowerCase() === model.toLowerCase());
      if (product.inventory_managed && !variant) return state;
      const chosenId = variant?.id;
      const existing = state.items.find((item) => matches(item, product.id, size, color.name, model, chosenId));
      const limit = product.allow_negative_stock ? 1000 : product.inventory_managed ? Math.min(1000, Math.max(0, variant?.quantity ?? 0)) : 1000;
      if ((existing?.quantity ?? 0) >= limit) return state;
      const pricedProduct = variant ? { ...product, price: variant.price, original_price: variant.original_price } : product;
      return { items: existing ? state.items.map((item) => matches(item, product.id, size, color.name, model, chosenId) ? { ...item, product: pricedProduct, quantity: item.quantity + 1, model, variant_id: chosenId } : item)
        : [...state.items, { product: pricedProduct, size, color, model, variant_id: chosenId, quantity: 1 }] };
    });
  },
  removeItem: (productId, size, color, model = "", variantId) => set((state) => ({ items: state.items.filter((item) => !matches(item, productId, size, color, model, variantId)) })),
  updateQuantity: (productId, size, color, quantity, model = "", variantId) => {
    if (quantity < 1) { get().removeItem(productId, size, color, model, variantId); return; }
    set((state) => ({ items: state.items.map((item) => {
      if (!matches(item, productId, size, color, model, variantId)) return item;
      const variant = item.product.variants?.find((entry) => item.variant_id ? entry.id === item.variant_id : entry.size === String(size) && entry.color.toLowerCase() === color.toLowerCase() && (entry.model || "") === model);
      const limit = item.product.allow_negative_stock || !item.product.inventory_managed ? 1000 : Math.min(1000, Math.max(0, variant?.quantity ?? 0));
      return { ...item, quantity: Math.min(quantity, limit) };
    }).filter((item) => item.quantity > 0) }));
  },
  clearCart: () => set({ items: [] }), toggleCart: () => set((state) => ({ isOpen: !state.isOpen })), setCartOpen: (isOpen) => set({ isOpen }),
}), { name: "clyfer-cart", storage: createJSONStorage(() => localStorage), partialize: (state) => ({ items: state.items }) }));
