"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the product page
    
    // Use first available size and color, or fallbacks
    const size = product.sizes?.[0] || 40;
    const color = product.colors?.[0] || { name: "Default", value: "#000" };

    addItem(product, size, color);
    setCartOpen(true);
    toast.success("Added to cart", {
      description: `${product.name} has been added to your bag.`
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        delay: index * 0.03, 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.4 }
      }}
    >
      <Link href={`/shop/${product.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900/50 aspect-square mb-5 ring-1 ring-border/50 group-hover:ring-brand/20 transition-all duration-500 shadow-sm group-hover:shadow-2xl">
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images?.[0] ?? ""}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          
          {/* Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-5 left-5 flex flex-col gap-2 z-10">
            {discount && (
              <span className="text-[10px] font-bold tracking-normal px-3 py-1.5 rounded-xl bg-red-500 text-white shadow-xl backdrop-blur-md">
                -{discount}%
              </span>
            )}
            {product.tags?.includes("new") && (
              <span className="text-[10px] font-bold tracking-normal px-3 py-1.5 rounded-xl bg-foreground text-background shadow-xl">
                NEW
              </span>
            )}
            {product.tags?.includes("limited") && (
              <span className="text-[10px] font-bold tracking-normal px-3 py-1.5 rounded-xl bg-brand text-brand-foreground shadow-xl">
                LIMITED
              </span>
            )}
          </div>

          {/* Quick add hover overlay */}
          <div className="absolute inset-x-5 bottom-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out z-20">
            <button
              onClick={handleQuickAdd}
              className="w-full py-4 rounded-3xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-transform hover:opacity-90"
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

        <div className="space-y-1.5 px-2">
          <div className="flex items-center justify-between">
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">
              {product.brand}
            </p>
            <div className="flex items-center gap-1">
              <Star className="size-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px] text-muted-foreground font-bold">
                {product.rating}
              </span>
            </div>
          </div>

          <h3 className="text-base font-bold text-foreground group-hover:text-brand transition-colors leading-tight truncate">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-3 pt-1">
            <span className="text-lg font-bold text-foreground tabular-nums">
              ৳{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="text-sm text-muted-foreground line-through opacity-40 tabular-nums">
                ৳{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
