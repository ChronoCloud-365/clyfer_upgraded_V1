"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Package, Truck, Clock, CheckCircle, XCircle, LogOut, Phone } from "lucide-react";

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

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?from=/account");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      const savedPhone = (user.user_metadata?.phone as string | undefined) ?? "";
      if (savedPhone) {
        setManualPhone(savedPhone);
        fetchOrders(savedPhone);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchOrders(phone: string) {
    if (!phone.trim()) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      setOrders(res.ok ? data.orders : []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchOrders(phoneInput);
    setManualPhone(phoneInput);
  }

  if (authLoading) {
    return (
      <main className="min-h-screen pt-24 flex items-center justify-center">
        <div className="size-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) return null;

  const savedPhone = (user.user_metadata?.phone as string | undefined) ?? "";

  return (
    <main className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">My Account</h1>
            <p className="text-muted-foreground mt-1 text-sm">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>

        {!savedPhone && (
          <div className="rounded-2xl border bg-card p-5 mb-8">
            <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              Enter your order phone number to view orders
            </p>
            <form onSubmit={handlePhoneSubmit} className="flex gap-3">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="flex-1 px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 ring-ring"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-900 hover:opacity-90 transition-all"
                style={{ background: "oklch(0.78 0.18 72)" }}
              >
                Look up
              </button>
            </form>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Your Orders</h2>

          {ordersLoading && (
            <div className="flex items-center gap-3 text-muted-foreground py-10">
              <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading orders…</span>
            </div>
          )}

          {!ordersLoading && orders === null && savedPhone && (
            <p className="text-sm text-muted-foreground py-6">Loading your orders…</p>
          )}

          {!ordersLoading && orders !== null && orders.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No orders found.</p>
              <p className="text-sm mt-1">Orders placed with phone {manualPhone || savedPhone} will appear here.</p>
              <Link href="/shop" className="mt-4 inline-block text-sm text-brand hover:underline font-medium">
                Start Shopping →
              </Link>
            </div>
          )}

          {!ordersLoading && orders && orders.length > 0 && (
            <div className="space-y-4">
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
      </div>
    </main>
  );
}
