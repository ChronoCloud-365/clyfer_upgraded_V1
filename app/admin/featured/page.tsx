"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Plus, Trash2, Search, X } from "lucide-react";
import type { FeaturedConfig, FeaturedSectionConfig, Product } from "@/types";
import { DEFAULT_FEATURED } from "@/lib/config-defaults";
import { cn } from "@/lib/utils";

export default function AdminFeaturedPage() {
  const [config, setConfig] = useState<FeaturedConfig>(DEFAULT_FEATURED);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-config?key=featured").then((r) => r.json()),
      fetch("/api/admin/products").then((r) => r.json()),
    ]).then(([cfg, prods]) => {
      // Handle legacy config (single section) or missing config
      let val = cfg.value;
      if (!val || !val.sections) {
        val = { sections: [] };
      }
      setConfig(val);
      setProducts(prods.products ?? []);
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "featured", value: config }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  }

  const addSection = () => {
    const newSection: FeaturedSectionConfig = {
      id: crypto.randomUUID(),
      title: "New Featured Section",
      subtitle: "Collection",
      description: "",
      productIds: [],
    };
    setConfig((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const removeSection = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
  };

  const updateSection = (id: string, updates: Partial<FeaturedSectionConfig>) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const toggleProductInSection = (sectionId: string, productId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const exists = s.productIds.includes(productId);
        return {
          ...s,
          productIds: exists
            ? s.productIds.filter((id) => id !== productId)
            : [...s.productIds, productId],
        };
      }),
    }));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Featured Sections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage multiple featured product blocks for your homepage
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addSection}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted transition-all"
          >
            <Plus className="size-4" /> Add Section
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-70 shadow-lg shadow-brand/10"
            style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saved ? "Saved Changes!" : saving ? "Saving…" : "Save All Sections"}
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {config.sections.map((section) => (
          <div
            key={section.id}
            className="rounded-[2.5rem] border border-border bg-card overflow-hidden shadow-sm"
          >
            {/* Section Header Editor */}
            <div className="p-6 lg:p-8 border-b border-border bg-muted/30">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 max-w-md space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="admin-label">Badge</label>
                      <input
                        value={section.subtitle}
                        onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                        className="admin-input"
                        placeholder="Collection"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="admin-label">Title</label>
                      <input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        className="admin-input"
                        placeholder="Trending Products"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="admin-label">Description (Optional)</label>
                    <input
                      value={section.description ?? ""}
                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                      className="admin-input"
                      placeholder="Showcase your best items"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeSection(section.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>

              {/* Product Selection Area */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Selected Products ({section.productIds.length})
                  </h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-border bg-background focus:ring-1 focus:ring-brand"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="size-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Products Preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {section.productIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No products selected for this section.</p>
                  ) : (
                    section.productIds.map((pid) => {
                      const p = products.find((x) => x.id === pid);
                      if (!p) return null;
                      return (
                        <div key={pid} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs font-bold text-brand">
                          {p.name}
                          <button onClick={() => toggleProductInSection(section.id, pid)}>
                            <X className="size-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Scrollable Product Picker */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-2 border border-border/50 rounded-2xl bg-background/50">
                  {filteredProducts.map((p) => {
                    const isSelected = section.productIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProductInSection(section.id, p.id)}
                        className={cn(
                          "flex flex-col gap-2 p-2 rounded-xl border text-left transition-all group",
                          isSelected ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-border bg-card hover:border-zinc-400"
                        )}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                          {p.images?.[0] && (
                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="px-1">
                          <p className="text-[10px] font-bold truncate text-foreground">{p.name}</p>
                          <p className="text-[9px] text-muted-foreground">৳{p.price.toLocaleString()}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {config.sections.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-[3rem]">
            <Plus className="size-10 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">No sections created yet.</p>
            <button
              onClick={addSection}
              className="mt-4 text-sm font-bold text-brand hover:underline"
            >
              Create your first section
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
