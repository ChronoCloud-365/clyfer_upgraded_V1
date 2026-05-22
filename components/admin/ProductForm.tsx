"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, X } from "lucide-react";
import type { CatalogConfig, Product, ProductCategory } from "@/types";
import { CloudinaryUpload } from "./CloudinaryUpload";
import { DEFAULT_CATALOG } from "@/lib/config-defaults";

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
  const [subcategory, setSubcategory] = useState(initial.subcategory ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [images, setImages] = useState<string[]>(initial.images ?? []);
  const [sizes, setSizes] = useState<number[]>(initial.sizes ?? []);
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [isFeatured, setIsFeatured] = useState(initial.is_featured ?? false);
  const [inStock, setInStock] = useState(initial.in_stock ?? true);
  const [catalog, setCatalog] = useState<CatalogConfig>(DEFAULT_CATALOG);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [newSubLabel, setNewSubLabel] = useState("");
  const [savingSub, setSavingSub] = useState(false);
  const catInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/site-config?key=catalog")
      .then((r) => r.json())
      .then((d) => {
        if (active && d.value) setCatalog(d.value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const categories = catalog.categories.length ? catalog.categories : DEFAULT_CATALOG.categories;
  const activeCategory = useMemo(
    () => categories.find((item) => item.id === category) ?? categories[0],
    [categories, category]
  );
  const subcategoryOptions = activeCategory?.subcategories ?? [];

  function autoSlug(n: string) {
    return n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function slugify(text: string) {
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function saveCatalog(updated: CatalogConfig) {
    await fetch("/api/admin/site-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "catalog", value: updated }),
    });
    setCatalog(updated);
  }

  async function handleAddCategory() {
    const label = newCatLabel.trim();
    if (!label) return;
    const id = slugify(label);
    if (catalog.categories.some((c) => c.id === id)) return;
    setSavingCat(true);
    const updated: CatalogConfig = {
      categories: [
        ...catalog.categories,
        { id, label, href: `/shop?category=${id}`, description: "", subcategories: [] },
      ],
    };
    await saveCatalog(updated);
    setCategory(id as ProductCategory);
    setSubcategory("");
    setNewCatLabel("");
    setAddingCat(false);
    setSavingCat(false);
  }

  async function handleAddSubcategory() {
    const label = newSubLabel.trim();
    if (!label) return;
    const id = slugify(label);
    setSavingSub(true);
    const updated: CatalogConfig = {
      categories: catalog.categories.map((c) =>
        c.id !== category
          ? c
          : {
              ...c,
              subcategories: [
                ...(c.subcategories ?? []),
                { id, label, href: `/shop?category=${category}&subcategory=${id}`, desc: "" },
              ],
            }
      ),
    };
    await saveCatalog(updated);
    setSubcategory(id);
    setNewSubLabel("");
    setAddingSub(false);
    setSavingSub(false);
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
      subcategory: subcategory || null,
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
          <div className="col-span-2 space-y-3">
            <label className="admin-label">Category *</label>
            <div className="flex flex-wrap gap-2 items-center">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setCategory(item.id as ProductCategory); setSubcategory(""); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    category === item.id
                      ? "border-brand bg-brand/15 text-brand"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {addingCat ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={catInputRef}
                    autoFocus
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } if (e.key === "Escape") { setAddingCat(false); setNewCatLabel(""); } }}
                    placeholder="Category name"
                    className="h-9 px-3 rounded-xl border border-brand/50 bg-brand/5 text-sm text-foreground outline-none w-36 focus:ring-1 focus:ring-brand/40"
                  />
                  <button type="button" onClick={handleAddCategory} disabled={savingCat || !newCatLabel.trim()} className="p-2 rounded-lg bg-brand/15 text-brand hover:bg-brand/25 transition-colors disabled:opacity-50">
                    {savingCat ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  </button>
                  <button type="button" onClick={() => { setAddingCat(false); setNewCatLabel(""); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAddingCat(true); setTimeout(() => catInputRef.current?.focus(), 50); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-brand/40 hover:text-brand transition-all"
                >
                  <Plus className="size-3.5" /> New
                </button>
              )}
            </div>

            <div className="space-y-2 pl-1">
              <label className="admin-label">Subcategory</label>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setSubcategory("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    subcategory === ""
                      ? "border-brand/50 bg-brand/10 text-brand"
                      : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  None
                </button>
                {subcategoryOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubcategory(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      subcategory === item.id
                        ? "border-brand/50 bg-brand/10 text-brand"
                        : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                {addingSub ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={subInputRef}
                      autoFocus
                      value={newSubLabel}
                      onChange={(e) => setNewSubLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubcategory(); } if (e.key === "Escape") { setAddingSub(false); setNewSubLabel(""); } }}
                      placeholder="Subcategory name"
                      className="h-8 px-2.5 rounded-lg border border-brand/50 bg-brand/5 text-xs text-foreground outline-none w-32 focus:ring-1 focus:ring-brand/40"
                    />
                    <button type="button" onClick={handleAddSubcategory} disabled={savingSub || !newSubLabel.trim()} className="p-1.5 rounded-lg bg-brand/15 text-brand hover:bg-brand/25 transition-colors disabled:opacity-50">
                      {savingSub ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    </button>
                    <button type="button" onClick={() => { setAddingSub(false); setNewSubLabel(""); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingSub(true); setTimeout(() => subInputRef.current?.focus(), 50); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-brand/40 hover:text-brand transition-all"
                  >
                    <Plus className="size-3" /> New
                  </button>
                )}
              </div>
            </div>
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
          onAddImage={(url) => setImages((prev) => [...prev, url])}
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
