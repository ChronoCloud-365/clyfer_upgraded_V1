"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { FeaturedConfig, Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface Props {
  config: FeaturedConfig;
  products: Product[];
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
