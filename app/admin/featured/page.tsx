"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import type { FeaturedConfig, Product } from "@/types";
import { DEFAULT_FEATURED } from "@/lib/config-defaults";

export default function AdminFeaturedPage() {
  const [config, setConfig] = useState<FeaturedConfig>(DEFAULT_FEATURED);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-config?key=featured").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
    ]).then(([cfg, prods]) => {
      setConfig(cfg.value ?? DEFAULT_FEATURED);
      setProducts(prods.products ?? []);
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/site-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "featured", value: config }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleFeatured(product: Product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !product.is_featured }),
    });
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_featured: !p.is_featured } : p
      )
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Featured Section Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edit section heading and choose which products are featured
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-70"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Section Text"}
        </button>
      </div>

      {/* Section text */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-8 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Section Heading</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="admin-label">Badge Label</label>
            <input
              value={config.subtitle}
              onChange={(e) => setConfig((c) => ({ ...c, subtitle: e.target.value }))}
              className="admin-input"
              placeholder="Featured"
            />
          </div>
          <div>
            <label className="admin-label">Section Title</label>
            <input
              value={config.title}
              onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
              className="admin-input"
              placeholder="This Season's Picks"
            />
          </div>
          <div className="col-span-2">
            <label className="admin-label">Description</label>
            <input
              value={config.description ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, description: e.target.value }))}
              className="admin-input"
              placeholder="Handpicked by our style team"
            />
          </div>
        </div>
      </div>

      {/* Product toggle */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Featured Products ({products.filter((p) => p.is_featured).length} selected)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => toggleFeatured(product)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all shadow-sm ${
                product.is_featured
                  ? "border-brand/40 bg-brand/10"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="size-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                {product.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">৳{product.price.toLocaleString()}</p>
              </div>
              <div
                className={`size-5 rounded-full border-2 shrink-0 transition-all ${
                  product.is_featured
                    ? "bg-brand border-brand"
                    : "border-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
