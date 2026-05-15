"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Search } from "lucide-react";
import type { Product, CatalogCategory } from "@/types";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
];

interface Props {
  initialProducts: Product[];
  params: { category?: string; search?: string; filter?: string };
  categories: CatalogCategory[];
}

export function ShopClient({ initialProducts, params, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(params.search ?? "");
  const [activeCategory, setActiveCategory] = useState(params.category ?? "all");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest");

  const visibleCategories = useMemo(
    () => [
      { label: "All", value: "all", href: "/shop" },
      ...categories.map((category) => ({
        label: category.label,
        value: category.id,
        href: category.href,
      })),
    ],
    [categories]
  );

  const filtered = useMemo(() => {
    let list = [...initialProducts];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.brand.toLowerCase().includes(q) ||
          product.tags.some((tag) => tag.includes(q))
      );
    }

    if (activeCategory !== "all") {
      list = list.filter((product) => product.category === activeCategory);
    }

    switch (sort) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return list;
  }, [initialProducts, search, activeCategory, sort]);

  function updateUrl(next: { search?: string; category?: string }) {
    const query = new URLSearchParams(searchParams.toString());

    if (next.search !== undefined) {
      if (next.search) query.set("search", next.search);
      else query.delete("search");
    }

    if (next.category !== undefined) {
      if (next.category && next.category !== "all") query.set("category", next.category);
      else query.delete("category");
    }

    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateUrl({ search: search.trim() });
  }

  function handleCategoryClick(category: string) {
    setActiveCategory(category);
    updateUrl({ category });
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Shop All</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} products</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shoes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 ring-ring"
            />
          </form>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {visibleCategories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryClick(category.value)}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeCategory === category.value
                  ? "border-transparent text-zinc-900 dark:text-zinc-900"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-zinc-400"
              }`}
              style={
                activeCategory === category.value
                  ? { background: "oklch(0.78 0.18 72)" }
                  : {}
              }
            >
              {category.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {filtered.map((product, index) => {
              const discount = product.original_price
                ? Math.round((1 - product.price / product.original_price) * 100)
                : null;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link href={`/shop/${product.slug}`} className="group block">
                    <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 aspect-square mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images?.[0] ?? ""}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {discount && (
                        <span className="absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.brand}</p>
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-brand transition-colors mt-0.5 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-muted-foreground">
                          {product.rating} ({product.review_count})
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-bold text-foreground">৳{product.price.toLocaleString()}</span>
                        {product.original_price && (
                          <span className="text-xs text-muted-foreground line-through">
                            ৳{product.original_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
