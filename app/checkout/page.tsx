"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 0 ? 60 : 0;
  const total = subtotal + shipping;

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError("");

    try {
      // Submit one order per cart item (simplified)
      for (const item of items) {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            product_id: item.product.id,
            product_name: item.product.name,
            size: item.size,
            color: item.color?.name ?? "",
            quantity: item.quantity,
            total_price: item.product.price * item.quantity + shipping,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Order failed");
        }
      }
      clearCart();
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="size-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="size-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-3">
            Order Placed!
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you! Your order has been placed. We'll call you on{" "}
            <strong>{form.phone}</strong> to confirm.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm"
            style={{
              background: "oklch(0.78 0.18 72)",
              color: "oklch(0.09 0 0)",
            }}
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/shop"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground">Checkout</h1>
            <p className="text-muted-foreground text-sm">Cash on Delivery</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{
                background: "oklch(0.78 0.18 72)",
                color: "oklch(0.09 0 0)",
              }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Truck className="size-4" /> Delivery Information
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="checkout-label">Full Name *</label>
                      <input
                        required
                        value={form.customer_name}
                        onChange={(e) => update("customer_name", e.target.value)}
                        className="checkout-input"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="checkout-label">Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="checkout-input"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="checkout-label">City / District *</label>
                      <input
                        required
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className="checkout-input"
                        placeholder="Dhaka"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="checkout-label">Full Address *</label>
                      <textarea
                        required
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        rows={2}
                        className="checkout-input resize-none"
                        placeholder="House, Road, Area, City"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="checkout-label">Order Notes (optional)</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        rows={2}
                        className="checkout-input resize-none"
                        placeholder="Any special instructions?"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-amber-500/5 border-amber-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <Truck className="size-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Cash on Delivery
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pay when your order arrives. No upfront payment needed.
                        Delivery: 2-5 business days.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm disabled:opacity-70"
                  style={{
                    background: "oklch(0.78 0.18 72)",
                    color: "oklch(0.09 0 0)",
                  }}
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {loading ? "Placing Order…" : `Confirm Order · ৳${total.toLocaleString()}`}
                </button>
              </form>
            </div>

            {/* Order summary */}
            <div>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 sticky top-24">
                <h2 className="text-base font-semibold text-foreground">
                  Order Summary
                </h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
                      <div className="size-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.images?.[0] ?? ""}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Size: {item.size} · Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span>৳{shipping}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2">
                    <span>Total</span>
                    <span>৳{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
