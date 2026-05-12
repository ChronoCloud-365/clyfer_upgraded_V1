"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    phone2: "",
    address: "",
    city: "",
    shipping_area: "inside" as "inside" | "outside",
    notes: "",
  });

  const [shippingRates, setShippingRates] = useState({ inside: 80, outside: 120 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch("/api/admin/site-config?key=shipping");
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            setShippingRates({
              inside: data.value.insideDhaka || 80,
              outside: data.value.outsideDhaka || 120,
            });
          }
        }
      } catch (e) {
        console.error("Failed to load shipping rates", e);
      }
    }
    loadRates();
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const shippingCost = subtotal > 0
    ? (form.shipping_area === "inside" ? shippingRates.inside : shippingRates.outside)
    : 0;

  const total = subtotal + shippingCost;

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError("");

    try {
      for (const item of items) {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            phone: `${form.phone}${form.phone2 ? ` / ${form.phone2}` : ""}`,
            product_id: item.product.id,
            product_name: item.product.name,
            size: item.size,
            color: item.color?.name ?? "",
            quantity: item.quantity,
            total_price: item.product.price * item.quantity + (shippingCost / items.length),
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
          <h1 className="text-2xl font-bold text-foreground mb-3">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/shop"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-normal">CHECKOUT</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Cash on Delivery</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl">
            <ShoppingBag className="size-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground mb-6 font-medium">Your cart is empty</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "oklch(0.78 0.18 72)",
                color: "oklch(0.09 0 0)",
              }}
            >
              Back to Shop
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-amber-700">
                      <User className="size-4" />
                      <h2 className="text-xs font-bold uppercase tracking-wide">Personal Details</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          value={form.customer_name}
                          onChange={(e) => update("customer_name", e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 transition-all"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1 flex items-center gap-1">
                            Phone Number 1 <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            type="tel"
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 transition-all"
                            placeholder="01XXXXXXXXX"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1">
                            Phone Number 2 (Optional)
                          </label>
                          <input
                            type="tel"
                            value={form.phone2}
                            onChange={(e) => update("phone2", e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 transition-all"
                            placeholder="Alternative number"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-amber-700">
                      <MapPin className="size-4" />
                      <h2 className="text-xs font-bold uppercase tracking-wide">Shipping Address</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => update("shipping_area", "inside")}
                          className={cn(
                            "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                            form.shipping_area === "inside"
                              ? "border-amber-500 bg-amber-500/5 shadow-inner"
                              : "border-border bg-muted/20 hover:border-amber-500/40"
                          )}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className={cn("text-sm font-bold tracking-normal", form.shipping_area === "inside" ? "text-amber-700" : "text-foreground")}>
                              INSIDE DHAKA
                            </span>
                            {form.shipping_area === "inside" && <div className="size-2 rounded-full bg-amber-500" />}
                          </div>
                          <span className="text-xs font-bold text-muted-foreground tracking-wide">৳{shippingRates.inside} FLAT RATE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => update("shipping_area", "outside")}
                          className={cn(
                            "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group",
                            form.shipping_area === "outside"
                              ? "border-amber-500 bg-amber-500/5 shadow-inner"
                              : "border-border bg-muted/20 hover:border-amber-500/40"
                          )}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className={cn("text-sm font-bold tracking-normal", form.shipping_area === "outside" ? "text-amber-700" : "text-foreground")}>
                              OUTSIDE DHAKA
                            </span>
                            {form.shipping_area === "outside" && <div className="size-2 rounded-full bg-amber-500" />}
                          </div>
                          <span className="text-xs font-bold text-muted-foreground tracking-wide">৳{shippingRates.outside} FLAT RATE</span>
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1">
                          Full Delivery Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          value={form.address}
                          onChange={(e) => update("address", e.target.value)}
                          rows={3}
                          className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                          placeholder="House, Road, Area, City"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1">
                          Order Notes (Optional)
                        </label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => update("notes", e.target.value)}
                          rows={2}
                          className="w-full bg-muted/30 border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                          placeholder="Special instructions for delivery"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl px-5 py-4 font-medium">
                    ⚠️ {error}
                  </div>
                )}

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <div className="flex items-start gap-4">
                    <Truck className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-foreground">CASH ON DELIVERY (COD)</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Pay total amount at your doorstep when you receive the product.
                        Delivery timeline: 2-3 days (Dhaka), 3-5 days (Outside).
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-sm disabled:opacity-70 transition-all hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wide"
                  style={{
                    background: "oklch(0.78 0.18 72)",
                    color: "oklch(0.09 0 0)",
                  }}
                >
                  {loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>CONFIRM ORDER · ৳{total.toLocaleString()}</>
                  )}
                </button>
              </form>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-border bg-card overflow-hidden sticky top-24 shadow-sm">
                <div className="px-6 py-5 border-b border-border bg-muted/10">
                  <h2 className="text-xs font-bold uppercase tracking-wide">Order Summary</h2>
                </div>
                
                <div className="p-6 space-y-6 max-h-[40vh] overflow-y-auto">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.size}-${item.color?.name ?? ""}`} className="flex gap-4">
                      <div className="size-20 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border">
                        <img
                          src={item.product.images?.[0] ?? ""}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-sm font-bold text-foreground truncate uppercase tracking-tight">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">
                          SIZE: {item.size} · QTY: {item.quantity}
                        </p>
                        <p className="text-sm font-bold mt-auto">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-muted/5 space-y-3 border-t border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="text-foreground font-bold">৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Delivery Cost</span>
                    <span className="font-bold">
                      {shippingCost > 0 ? `+ ৳${shippingCost}` : "FREE"}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-dashed border-border flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-wide">Total Amount</span>
                    <span className="text-3xl font-bold text-foreground tracking-normal">
                      ৳{total.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-muted/20 border-t border-border text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Estimated Delivery: {form.shipping_area === "inside" ? "24-48 Hours" : "3-5 Days"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
