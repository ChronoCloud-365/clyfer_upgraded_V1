"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star,
  ShoppingCart,
  CreditCard,
  ChevronLeft,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart";

interface Props {
  product: Product;
}

export function ProductDetailClient({ product }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedSize, setSelectedSize] = useState<number | null>(
    product.sizes?.[0] ?? null
  );
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  function handleAddToCart() {
    if (!selectedSize) return alert("Please select a size");
    // Call addItem qty times or just once + handle qty via store
    for (let i = 0; i < quantity; i++) {
      addItem(
        product,
        selectedSize,
        selectedColor ?? { name: "Default", hex: "#000" }
      );
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!selectedSize) return alert("Please select a size");
    addItem(
      product,
      selectedSize,
      selectedColor ?? { name: "Default", hex: "#000" }
    );
    router.push("/checkout");
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image gallery */}
          <div>
            <div className="relative overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-800 aspect-square mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={product.images?.[activeImage] ?? ""}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount && (
                <span className="absolute top-4 left-4 text-sm font-bold px-3 py-1 rounded-full bg-red-500 text-white">
                  -{discount}%
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative size-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border-2 transition-all ${
                      i === activeImage ? "border-brand" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium mb-1">
                {product.brand}
              </p>
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                {product.name}
              </h1>
              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < Math.round(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} · {product.review_count} reviews
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-foreground">
                ৳{product.price.toLocaleString()}
              </span>
              {product.original_price && (
                <span className="text-lg text-muted-foreground line-through">
                  ৳{product.original_price.toLocaleString()}
                </span>
              )}
              {discount && (
                <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  {discount}% OFF
                </span>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Color: <span className="text-muted-foreground">{selectedColor?.name}</span>
                </p>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      title={color.name}
                      className={`size-9 rounded-full border-2 transition-all ${
                        selectedColor?.name === color.name
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ background: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Size: <span className="text-muted-foreground">{selectedSize ?? "Select a size"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-10 px-3 rounded-xl text-sm font-medium transition-all border ${
                        selectedSize === size
                          ? "border-transparent text-zinc-900"
                          : "border-border text-muted-foreground hover:border-zinc-400 hover:text-foreground"
                      }`}
                      style={
                        selectedSize === size
                          ? { background: "oklch(0.78 0.18 72)" }
                          : {}
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="size-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="size-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border font-semibold text-sm transition-all hover:bg-accent"
              >
                {added ? (
                  <>
                    <Check className="size-4 text-green-500" />
                    <span className="text-green-500">Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-4" />
                    Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                style={{
                  background: "oklch(0.78 0.18 72)",
                  color: "oklch(0.09 0 0)",
                }}
              >
                <CreditCard className="size-4" />
                Buy Now · ৳{(product.price * quantity).toLocaleString()}
              </button>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground capitalize"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
