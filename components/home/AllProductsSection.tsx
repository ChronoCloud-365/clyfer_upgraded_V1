"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter } from "lucide-react";
import type { CatalogCategory, Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface Props {
  products: Product[];
  categories?: CatalogCategory[];
}

export function AllProductsSection({ products, categories = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const visibleCategories = categories.length
    ? [
        { label: "All", value: "All" },
        ...categories.map((category) => ({ label: category.label, value: category.id })),
      ]
    : [
        { label: "All", value: "All" },
        { label: "Casual", value: "casual" },
        { label: "Running", value: "running" },
        { label: "Formal", value: "formal" },
        { label: "Sports", value: "sports" },
        { label: "Limited", value: "limited" },
      ];

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());
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
          <h2 className="text-3xl lg:text-4xl font-bold tracking-normal text-foreground mb-4">
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
            {visibleCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
                  activeCategory === cat.value
                    ? "bg-foreground text-background shadow-lg scale-105"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="size-4 text-muted-foreground hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "price_asc" | "price_desc")}
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
