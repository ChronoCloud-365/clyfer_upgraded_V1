import { getAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { getInventoryDatabase, readInventory } from "@/lib/inventory/database";
import { readInventoryOrders } from "@/lib/inventory/orders";

export const dynamic = "force-dynamic";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Navigation,
  Image,
  AlignLeft,
  MapPin,
} from "lucide-react";

async function getStats() {
  const db = getInventoryDatabase();
  const localOrders = readInventoryOrders(db);
  const localProducts = readInventory(db).items;
  const local = { totalProducts: localProducts.length, totalOrders: localOrders.length,
    pendingOrders: localOrders.filter((order) => order.status === "pending").length,
    revenue: localOrders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total_price, 0) };
  try {
    const supabase = getAdminClient();
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("id, in_stock", { count: "exact" }),
      supabase.from("orders").select("id, status, total_price", { count: "exact" }),
    ]);

    const products = (productsRes.data ?? []) as { id: string }[];
    const orders = (ordersRes.data ?? []) as {
      id: string;
      status?: string;
      total_price?: number;
    }[];
    const revenue = orders.reduce((sum, o) => sum + (o.total_price ?? 0), 0);
    const pending = orders.filter((o) => o.status === "pending").length;

    return {
      totalProducts: products.length + local.totalProducts,
      totalOrders: orders.length + local.totalOrders,
      pendingOrders: pending + local.pendingOrders,
      revenue: revenue + local.revenue,
    };
  } catch {
    return local;
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Item Profiles",
      value: stats.totalProducts,
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      href: "/admin/items",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      href: "/admin/orders",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      href: "/admin/orders?status=pending",
    },
    {
      label: "Revenue (৳)",
      value: `৳${stats.revenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      href: "/admin/orders",
    },
  ];

  const quickLinks = [
    { label: "Inventory", desc: "Stock by item, color and size", href: "/admin/inventory", icon: Package },
    { label: "Edit Navbar", desc: "Manage categories & links", href: "/admin/navbar", icon: Navigation },
    { label: "Edit Hero", desc: "Slider images & text", href: "/admin/hero", icon: Image },
    { label: "Edit Footer", desc: "Links, social & tagline", href: "/admin/footer", icon: AlignLeft },
    { label: "Create Item Profile", desc: "Prices, images and child variants", href: "/admin/items", icon: Package },
    { label: "Store Locator", desc: "Map URL & address", href: "/admin/store-locator", icon: MapPin },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Welcome back to Clyfar Admin</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-2xl border p-5 transition-all hover:scale-[1.02] ${card.bg}`}
          >
            <div className="flex items-start justify-between mb-3">
              <card.icon className={`size-5 ${card.color}`} />
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-zinc-400 text-xs mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-zinc-800/50 hover:bg-zinc-800 hover:border-white/10 transition-all group"
            >
              <div className="size-10 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                <item.icon className="size-4 text-zinc-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
              <ArrowRight className="size-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
