"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, User, Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import type { NavbarConfig } from "@/types";

interface Props {
  config: NavbarConfig;
}

export function NavbarClient({ config }: Props) {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
      style={{ animation: "slideDown 0.5s cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="text-2xl font-bold tracking-normal"
            >
              CLY<span className="text-brand">FER</span>
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Dynamic dropdown categories */}
                {config.categories.map((cat) => (
                  <NavigationMenuItem key={cat.id}>
                    <NavigationMenuTrigger
                      className={cn(
                        "text-sm font-medium bg-transparent hover:bg-accent/50",
                        isActive(cat.href) ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {cat.label}
                    </NavigationMenuTrigger>
                    {cat.subcategories.length > 0 && (
                      <NavigationMenuContent>
                        <ul className="grid grid-cols-2 gap-3 p-4 w-[440px]">
                          {cat.subcategories.map((sub) => (
                            <li key={sub.href}>
                              <NavigationMenuLink
                                href={sub.href}
                                className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="text-sm font-medium leading-none mb-1">
                                  {sub.label}
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {sub.desc}
                                </p>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    )}
                  </NavigationMenuItem>
                ))}

                {/* Simple nav links */}
                {config.links.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink
                      href={link.href}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        "hover:text-foreground hover:bg-accent/50",
                        isActive(link.href) ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-1">
            <button
              className="hidden sm:flex size-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
              aria-label="Search"
            >
              <Search className="size-5" />
            </button>

            <Link
              href="/login"
              aria-label="Account"
              className="hidden sm:flex size-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
            >
              <User className="size-5" />
            </Link>

            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex size-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </button>
            )}

            <button
              className="relative flex size-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
              aria-label={`Cart (${totalItems} items)`}
              onClick={toggleCart}
            >
              <ShoppingBag className="size-5" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.div
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge
                      className="size-5 p-0 flex items-center justify-center text-[10px] font-bold border-0"
                      style={{
                        background: "oklch(0.78 0.18 72)",
                        color: "oklch(0.09 0 0)",
                      }}
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden flex size-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-6 py-5 border-b">
                    <span className="text-xl font-bold tracking-normal">
                      CLY<span className="text-brand">FER</span>
                    </span>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="flex size-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  <nav className="flex flex-col px-4 py-6 gap-1 flex-1 overflow-y-auto">
                    {config.categories.map((cat, i) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <Link
                          href={cat.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors",
                            isActive(cat.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          {cat.label}
                        </Link>
                      </motion.div>
                    ))}

                    {config.links.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (config.categories.length + i) * 0.06 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors",
                            isActive(link.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}

                    <Separator className="my-3" />

                    {config.categories.flatMap((cat) => cat.subcategories).length > 0 && (
                      <>
                        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                          Categories
                        </p>
                        {config.categories.flatMap((cat) =>
                          cat.subcategories.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                              {sub.label}
                            </Link>
                          ))
                        )}
                      </>
                    )}
                  </nav>

                  <div className="px-4 pb-6 flex flex-col gap-2 border-t pt-4">
                    <Link
                      href="/shop"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full py-3 px-6 rounded-xl font-semibold text-sm"
                      style={{
                        background: "oklch(0.78 0.18 72)",
                        color: "oklch(0.09 0 0)",
                      }}
                    >
                      Shop Now
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full py-3 px-6 rounded-xl font-semibold text-sm border transition-all hover:bg-accent"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
