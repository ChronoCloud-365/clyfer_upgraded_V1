"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { FeaturedSectionConfig, Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface Props {
  section: FeaturedSectionConfig;
  products: Product[];
}

export function FeaturedProducts({ section, products }: Props) {
  if (!products.length) return null;

  return (
    <section className="py-20 lg:py-28 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div className="max-w-xl">
            <span className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] mb-3 block">
              {section.subtitle}
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-normal text-foreground leading-[1.1]">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground mt-4 text-sm font-medium leading-relaxed italic opacity-80">
                {section.description}
              </p>
            )}
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:text-brand transition-colors group"
          >
            Explore All <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
 
        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-wide shadow-xl"
            style={{
              background: "oklch(0.78 0.18 72)",
              color: "oklch(0.09 0 0)",
            }}
          >
            View All Products <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
