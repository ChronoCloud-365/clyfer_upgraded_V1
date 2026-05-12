"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import type { Product, ProductCategory } from "@/types";
import { CloudinaryUpload } from "./CloudinaryUpload";

const SUGGESTED_CATEGORIES: ProductCategory[] = ["running", "casual", "formal", "sports", "limited", "sneakers", "boots"];
const SIZE_OPTIONS = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46];

interface Props {
  initial?: Partial<Product>;
  productId?: string; // if editing
}

export function ProductForm({ initial = {}, productId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initial.name ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "Clyfer");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [price, setPrice] = useState(String(initial.price ?? ""));
  const [originalPrice, setOriginalPrice] = useState(String(initial.original_price ?? ""));
  const [category, setCategory] = useState<ProductCategory>(initial.category ?? "casual");
  const [description, setDescription] = useState(initial.description ?? "");
  const [images, setImages] = useState<string[]>(initial.images ?? []);
  const [sizes, setSizes] = useState<number[]>(initial.sizes ?? []);
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [isFeatured, setIsFeatured] = useState(initial.is_featured ?? false);
  const [inStock, setInStock] = useState(initial.in_stock ?? true);

  function autoSlug(n: string) {
    return n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function toggleSize(size: number) {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size].sort((a, b) => a - b)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      slug: slug || autoSlug(name),
      price: Number(price),
      original_price: originalPrice ? Number(originalPrice) : null,
      category,
      description: description.trim(),
      images: images.filter(Boolean),
      sizes,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      colors: [], // colors simplified to [] for now
      is_featured: isFeatured,
      in_stock: inStock,
      rating: initial.rating ?? 5.0,
      review_count: initial.review_count ?? 0,
    };

    setSaving(true);
    try {
      const url = productId
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      const method = productId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Basic info */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Basic Info</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="admin-label">Product Name *</label>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!productId) setSlug(autoSlug(e.target.value));
              }}
              className="admin-input"
              placeholder="Air Clyfer Pro"
            />
          </div>
          <div>
            <label className="admin-label">Brand</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="admin-label">Slug (URL)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="admin-input font-mono text-xs"
              placeholder="air-clyfer-pro"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Auto-generated from name if left empty.</p>
          </div>
          <div>
            <label className="admin-label">Category *</label>
            <input
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="admin-input capitalize"
              placeholder="e.g. sneakers"
            />
            <datalist id="category-suggestions">
              {SUGGESTED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex items-center gap-6 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="size-4 accent-amber-400"
              />
              <span className="text-sm text-foreground font-medium">In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="size-4 accent-brand"
              />
              <span className="text-sm text-foreground font-medium">Featured</span>
            </label>
          </div>
        </div>
        <div>
          <label className="admin-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="admin-input resize-none"
            placeholder="Describe the product…"
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Pricing (৳)</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="admin-label">Sale Price *</label>
            <input
              required
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="admin-input"
              placeholder="8500"
            />
          </div>
          <div>
            <label className="admin-label">Original Price (for strike-through)</label>
            <input
              type="number"
              min="0"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="admin-input"
              placeholder="11000 (optional)"
            />
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Images</h2>
        <p className="text-xs text-muted-foreground">Upload product images via Cloudinary. The first image will be used as the thumbnail.</p>
        <CloudinaryUpload
          value={images}
          onChange={setImages}
          onRemove={(urlToRemove) => setImages(images.filter((url) => url !== urlToRemove))}
          maxFiles={6}
        />
      </section>

      {/* Sizes */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Available Sizes</h2>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`size-10 rounded-xl text-sm font-medium transition-all border ${
                sizes.includes(size)
                  ? "bg-brand/20 border-brand/50 text-brand"
                  : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground bg-muted/20"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      {/* Tags */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Tags</h2>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="admin-input"
          placeholder="featured, new, sale, bestseller (comma-separated)"
        />
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-70"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : productId ? "Update Product" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
