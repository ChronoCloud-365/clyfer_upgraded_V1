"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Navigation,
  Image,
  Star,
  Package,
  ShoppingCart,
  AlignLeft,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Navbar", href: "/admin/navbar", icon: Navigation },
  { label: "Hero Slider", href: "/admin/hero", icon: Image },
  { label: "Featured", href: "/admin/featured", icon: Star },
  { label: "Footer", href: "/admin/footer", icon: AlignLeft },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handleLogout() {
    setLogoutLoading(true);
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-5 py-6 border-b border-border", collapsed && "justify-center px-3")}>
        <div className="size-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
          <span className="text-brand font-black text-xs">C</span>
        </div>
        {!collapsed && (
          <span className="text-lg font-black tracking-tight text-foreground">
            CLY<span className="text-brand">FER</span>
            <span className="text-muted-foreground text-xs font-normal ml-1">Admin</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-brand/10 text-brand border border-brand/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("size-4 shrink-0", active ? "text-brand" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && active && <ChevronRight className="ml-auto size-3.5 text-brand/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/"
          target="_blank"
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all", collapsed && "justify-center")}
        >
          <Navigation className="size-4 shrink-0" />
          {!collapsed && "View Site"}
        </Link>
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all", collapsed && "justify-center")}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && (logoutLoading ? "Logging out…" : "Logout")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-background border-r border-border transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3 z-10 size-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors lg:flex hidden"
        >
          <ChevronRight className={cn("size-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
        {SidebarContent}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <span className="text-base font-black text-foreground">CLY<span className="text-brand">FER</span> <span className="text-muted-foreground text-xs font-normal">Admin</span></span>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="size-8 flex items-center justify-center text-muted-foreground">
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden fixed inset-y-0 left-0 z-40 w-72 bg-background border-r border-border pt-14"
          >
            {SidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
}
