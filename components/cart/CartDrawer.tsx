"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
  const { items, isOpen, setCartOpen, updateQuantity, removeItem, totalPrice, totalItems } = useCartStore();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!mounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l border-border bg-background">
        <SheetHeader className="px-6 py-5 border-b border-border flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-xl font-black tracking-tighter flex items-center gap-2">
            <ShoppingBag className="size-5" />
            CART <span className="text-brand">({totalItems()})</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <ShoppingBag className="size-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-[240px]">
              Looks like you haven&apos;t added any premium footwear to your cart yet.
              </p>
            <button
              onClick={() => setCartOpen(false)}
              className="px-8 py-3 rounded-xl bg-foreground text-background text-sm font-bold transition-all hover:opacity-90"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color.name}`} className="flex gap-4 group">
                    <div className="size-24 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
                      <img
                        src={item.product.images?.[0] ?? ""}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-foreground truncate">{item.product.name}</h4>
                        <button
                          onClick={() => removeItem(item.product.id, item.size, item.color.name)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        {item.size} · {item.color.name}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border border-border">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.color.name, item.quantity - 1)}
                            className="size-7 flex items-center justify-center hover:bg-background rounded-md transition-all"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.color.name, item.quantity + 1)}
                            className="size-7 flex items-center justify-center hover:bg-background rounded-md transition-all"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="text-sm font-black text-foreground">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-border bg-card/50 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="text-foreground font-bold">৳{totalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground font-medium">Calculated at checkout</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold">Total Est.</span>
                <span className="text-2xl font-black text-foreground">৳{totalPrice().toLocaleString()}</span>
              </div>

              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-brand/10"
                style={{
                  background: "oklch(0.78 0.18 72)",
                  color: "oklch(0.09 0 0)",
                }}
              >
                PROCEED TO CHECKOUT <ArrowRight className="size-4" />
              </Link>
              
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                Secure Payment · Cash on Delivery
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
