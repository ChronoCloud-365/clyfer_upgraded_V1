"use client";

import { useEffect, useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  shipped: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
  cancelled: "bg-destructive/10 text-destructive dark:text-red-400 border-destructive/30",
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const url =
      filter === "all"
        ? "/api/admin/orders"
        : `/api/admin/orders?status=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    setUpdatingId(null);
  }

  const counts = STATUS_OPTIONS.reduce(
    (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
    {} as Record<string, number>
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {orders.length} {filter === "all" ? "total" : filter} orders
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => {
              setLoading(true);
              setFilter(s);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize border ${
              filter === s
                ? "bg-brand/10 text-brand border-brand/30"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {s === "all" ? "All Orders" : s}
            {s !== "all" && counts[s] > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({counts[s]})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="size-5 animate-spin" /> Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <ShoppingCart className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden sm:table-cell">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.phone}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {order.address}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-foreground">{order.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.size && `Size: ${order.size}`}
                      {order.color && ` · ${order.color}`}
                      {` · Qty: ${order.quantity}`}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand">
                      ৳{order.total_price.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-BD", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value as OrderStatus)
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium bg-transparent cursor-pointer appearance-none capitalize ${STATUS_STYLES[order.status]}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-card text-foreground capitalize">
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
