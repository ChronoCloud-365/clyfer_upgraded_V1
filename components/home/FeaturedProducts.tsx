"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ShoppingCart, ArrowRight } from "lucide-react";
import type { FeaturedConfig, Product } from "@/types";

interface Props {
  config: FeaturedConfig;
  products: Product[];
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
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

export function FeaturedProducts({ config, products }: Props) {
  if (!products.length) return null;

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <span className="text-xs font-bold text-brand uppercase tracking-[0.2em] mb-2 block">
              {config.subtitle}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
              {config.title}
            </h2>
            {config.description && (
              <p className="text-muted-foreground mt-2">{config.description}</p>
            )}
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            View All <ArrowRight className="size-4" />
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
            style={{
              background: "oklch(0.78 0.18 72)",
              color: "oklch(0.09 0 0)",
            }}
          >
            View All Products <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
