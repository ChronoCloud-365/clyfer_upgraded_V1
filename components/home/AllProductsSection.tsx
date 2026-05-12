"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShoppingCart, Filter } from "lucide-react";
import type { Product } from "@/types";

interface Props {
  products: Product[];
}

const CATEGORIES = ["All", "Casual", "Running", "Formal", "Sports", "Limited"];

function ProductCard({ product, index }: { product: Product; index: number }) {
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/shop/${product.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 aspect-square mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images?.[0] ?? ""}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {discount && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                -{discount}%
              </span>
            )}
            {product.tags?.includes("new") && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-zinc-900">
                NEW
              </span>
            )}
            {product.tags?.includes("limited") && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white">
                LIMITED
              </span>
            )}
          </div>
          {/* Quick add hover overlay */}
          <div className="absolute inset-x-3 bottom-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: "oklch(0.78 0.18 72)",
                color: "oklch(0.09 0 0)",
              }}
            >
              <ShoppingCart className="size-4" />
              Quick Add
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {product.brand}
          </p>
          <h3 className="font-semibold text-foreground group-hover:text-brand transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`size-3 ${
                    i < Math.round(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-zinc-300 dark:text-zinc-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.review_count})
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-lg font-bold text-foreground">
              ৳{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="text-sm text-muted-foreground line-through">
                ৳{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function AllProductsSection({ products }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter
    if (activeCategory !== "All") {
      result = result.filter(
        (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      // Default: newest (assuming products array is already sorted by newest from DB)
      // If not, we could parse created_at here.
      return 0;
    });

    return result;
  }, [products, activeCategory, sortBy]);

  if (!products.length) return null;

  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground mb-4">
            Discover Our Collection
          </h2>
          <p className="text-muted-foreground">
            Explore our full range of premium footwear designed for style, comfort, and performance.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
          {/* Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-foreground text-background"
                    : "bg-background border border-border text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="size-4 text-muted-foreground hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand/50"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <AnimatePresence>
              {filteredAndSortedProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found in this category.</p>
            <button
              onClick={() => setActiveCategory("All")}
              className="mt-4 text-brand font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
