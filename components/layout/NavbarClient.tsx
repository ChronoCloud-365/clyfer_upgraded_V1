"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, User, Menu, X, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import type { NavbarConfig } from "@/types";

interface Props {
  config: NavbarConfig;
}

const useMounted = () =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

export function NavbarClient({ config }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  function submitSearch() {
    const term = searchTerm.trim();
    const target = term ? `/shop?search=${encodeURIComponent(term)}` : "/shop";
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(target);
  }

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  const accountAction = user ? (
    <button
      onClick={handleSignOut}
      className="hidden sm:flex size-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
      aria-label="Sign out"
      title={user.email ?? "Sign out"}
    >
      <LogOut className="size-5" />
    </button>
  ) : (
    <Link
      href="/login"
      aria-label="Account"
      className="hidden sm:flex size-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
    >
      <User className="size-5" />
    </Link>
  );

  return (
    <>
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
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Image
                src="/logo.jpeg"
                alt="Clyfer logo"
                width={42}
                height={42}
                className="rounded-xl object-cover"
                priority
              />
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="text-2xl font-bold tracking-normal hidden sm:inline-block"
              >
                CLY<span className="text-brand">FER</span>
              </motion.span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <NavigationMenu>
                <NavigationMenuList>
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

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSearchTerm(searchParams.get("search") ?? "");
                  setSearchOpen(true);
                }}
                className="hidden sm:flex size-9 items-center justify-center rounded-md hover:bg-accent/50 transition-colors"
                aria-label="Search"
              >
                <Search className="size-5" />
              </button>

              {accountAction}

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
                      <div className="flex items-center gap-3">
                        <Image
                          src="/logo.jpeg"
                          alt="Clyfer logo"
                          width={36}
                          height={36}
                          className="rounded-lg object-cover"
                        />
                        <span className="text-xl font-bold tracking-normal">
                          CLY<span className="text-brand">FER</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setMobileOpen(false)}
                        className="flex size-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
                      >
                        <X className="size-5" />
                      </button>
                    </div>

                    <nav className="flex flex-col px-4 py-6 gap-1 flex-1 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSearchTerm(searchParams.get("search") ?? "");
                          setSearchOpen(true);
                          setMobileOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Search className="size-4" />
                        Search
                      </button>

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
                      {user ? (
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileOpen(false);
                          }}
                          className="flex items-center justify-center w-full py-3 px-6 rounded-xl font-semibold text-sm border transition-all hover:bg-accent"
                        >
                          Sign Out
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center w-full py-3 px-6 rounded-xl font-semibold text-sm border transition-all hover:bg-accent"
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg w-full">
          <DialogTitle>Search products</DialogTitle>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
            className="space-y-4"
          >
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shoes, brands, or styles..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: "oklch(0.78 0.18 72)",
                  color: "oklch(0.09 0 0)",
                }}
              >
                Search
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
