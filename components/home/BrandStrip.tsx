"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const BRAND_LOGOS = [
  { name: "Nike", logo: "N" },
  { name: "Adidas", logo: "A" },
  { name: "New Balance", logo: "NB" },
  { name: "Puma", logo: "P" },
  { name: "Reebok", logo: "R" },
  { name: "Converse", logo: "C" },
  { name: "Vans", logo: "V" },
  { name: "Jordan", logo: "J" },
];

const CATEGORIES = [
  {
    id: "running",
    label: "Running",
    href: "/shop/running",
    emoji: "🏃",
    count: "42 styles",
    color: "oklch(0.78 0.18 72)",
  },
  {
    id: "casual",
    label: "Casual",
    href: "/shop/casual",
    emoji: "👟",
    count: "86 styles",
    color: "oklch(0.60 0.20 260)",
  },
  {
    id: "formal",
    label: "Formal",
    href: "/shop/formal",
    emoji: "👞",
    count: "31 styles",
    color: "oklch(0.65 0.15 145)",
  },
  {
    id: "limited",
    label: "Limited",
    href: "/shop/limited",
    emoji: "⭐",
    count: "12 styles",
    color: "oklch(0.65 0.22 20)",
  },
];

// ── Brand Strip ───────────────────────────────────────────────────────────
function BrandLogoStrip() {
  return (
    <div className="py-12 border-y bg-muted/30 overflow-hidden">
      <div className="flex gap-12 animate-[scroll_20s_linear_infinite]">
        {[...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
          <div
            key={`${brand.name}-${i}`}
            className="flex items-center gap-2 shrink-0 opacity-30 hover:opacity-70 transition-opacity cursor-default"
          >
            <span className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-black">
              {brand.logo}
            </span>
            <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Category Cards ─────────────────────────────────────────────────────────
function CategoryCards() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-10 text-center"
      >
        <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-2">
          Browse
        </p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
          Shop by Category
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Link
              href={cat.href}
              id={`category-${cat.id}-card`}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border hover:border-transparent transition-all duration-300 text-center relative overflow-hidden"
              style={
                {
                  "--cat-color": cat.color,
                } as React.CSSProperties
              }
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"
                style={{ background: cat.color }}
              />

              <span className="text-4xl">{cat.emoji}</span>
              <div>
                <p className="font-bold text-base">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.count}</p>
              </div>
              <ArrowRight
                className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Banner ────────────────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <section className="mx-4 sm:mx-6 lg:mx-8 my-8 max-w-7xl lg:mx-auto rounded-3xl overflow-hidden relative">
      <div className="bg-[oklch(0.08_0_0)] text-white py-16 px-8 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-8 relative">
        {/* bg glow */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ background: "oklch(0.78 0.18 72)" }}
        />

        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.82 0.20 72)" }}>
            Exclusive Offer
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-3">
            Get 20% Off Your
            <br />
            First Order
          </h2>
          <p className="text-white/50 max-w-sm text-sm">
            Sign up to Clyfer and unlock your welcome discount instantly. No
            code needed.
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="relative z-10 shrink-0"
        >
          <Link
            href="/register"
            id="promo-banner-cta"
            className="inline-flex items-center gap-2 font-bold text-sm px-8 py-4 rounded-xl transition-all"
            style={{
              background: "oklch(0.78 0.18 72)",
              color: "oklch(0.09 0 0)",
            }}
          >
            Claim Offer
            <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Export ────────────────────────────────────────────────────────────────
export function BrandStrip() {
  return (
    <>
      <BrandLogoStrip />
      <CategoryCards />
      <PromoBanner />
    </>
  );
}
