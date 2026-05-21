"use client";

import { useState } from "react";
import { Search, Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";

interface Order {
  id: string;
  product_name: string;
  size: number;
  color: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  notes?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-500" },
  processing: { label: "Processing", icon: Package, color: "text-blue-500" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-500" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-500" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: Package, color: "text-muted-foreground" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold capitalize ${cfg.color}`}>
      <Icon className="size-3.5" />
      {cfg.label}
    </span>
  );
}

export default function TrackOrderPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (trimmed.length < 5) {
      setError("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    setError("");
    setOrders(null);

    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setOrders(data.orders);
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Track Your Order</h1>
          <p className="text-muted-foreground mt-1.5">Enter your phone number to see all your orders and their current status.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 ring-ring"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl text-sm font-bold text-zinc-900 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "oklch(0.78 0.18 72)" }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-500 mb-6 px-1">{error}</p>
        )}

        {orders !== null && orders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="size-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No orders found for this number.</p>
            <p className="text-sm mt-1">Double-check the number you used when placing the order.</p>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""} found</p>
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{order.product_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  {order.size && <span>Size: <span className="text-foreground font-medium">{order.size}</span></span>}
                  {order.color && <span>Color: <span className="text-foreground font-medium">{order.color}</span></span>}
                  <span>Qty: <span className="text-foreground font-medium">{order.quantity}</span></span>
                  <span>Total: <span className="text-foreground font-semibold">৳{order.total_price.toLocaleString()}</span></span>
                </div>
                {order.notes && (
                  <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{order.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
