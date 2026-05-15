"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import type { CatalogConfig, CatalogCategory, CatalogSubcategory } from "@/types";
import { DEFAULT_CATALOG } from "@/lib/config-defaults";
import { LinkPicker } from "@/components/admin/LinkPicker";

function makeId() {
  return crypto.randomUUID();
}

export default function AdminCatalogPage() {
  const [config, setConfig] = useState<CatalogConfig>(DEFAULT_CATALOG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-config?key=catalog")
      .then((r) => r.json())
      .then((d) => setConfig(d.value ?? DEFAULT_CATALOG))
      .finally(() => setLoading(false));
  }, []);

  function addCategory() {
    setConfig((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id: makeId(),
          label: "New Category",
          href: "/shop",
          description: "",
          subcategories: [],
        },
      ],
    }));
  }

  function updateCategory(id: string, field: keyof CatalogCategory, value: string) {
    setConfig((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === id ? { ...category, [field]: value } : category
      ),
    }));
  }

  function removeCategory(id: string) {
    setConfig((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== id),
    }));
  }

  function addSubcategory(categoryId: string) {
    setConfig((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              subcategories: [
                ...category.subcategories,
                {
                  id: makeId(),
                  label: "New Subcategory",
                  href: "/shop",
                  desc: "",
                },
              ],
            }
          : category
      ),
    }));
  }

  function updateSubcategory(
    categoryId: string,
    subcategoryId: string,
    field: keyof CatalogSubcategory,
    value: string
  ) {
    setConfig((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              subcategories: category.subcategories.map((subcategory) =>
                subcategory.id === subcategoryId
                  ? { ...subcategory, [field]: value }
                  : subcategory
              ),
            }
      ),
    }));
  }

  function removeSubcategory(categoryId: string, subcategoryId: string) {
    setConfig((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              subcategories: category.subcategories.filter((subcategory) => subcategory.id !== subcategoryId),
            }
      ),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "catalog", value: config }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalog Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create categories and subcategories here first. Navbar and products read from this source.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-70"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <section className="flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Categories
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Every product category should be created here before it can be selected in the navbar.
          </p>
        </div>
        <button
          onClick={addCategory}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <Plus className="size-4" /> Add Category
        </button>
      </section>

      <div className="space-y-6">
        {config.categories.map((category) => (
          <div key={category.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="grid lg:grid-cols-[1.2fr_1fr_1fr_auto] gap-3 items-center">
              <input
                value={category.label}
                onChange={(e) => updateCategory(category.id, "label", e.target.value)}
                className="admin-input"
                placeholder="Category label"
              />
              <input
                value={category.id}
                onChange={(e) => updateCategory(category.id, "id", e.target.value)}
                className="admin-input font-mono text-xs"
                placeholder="category-id"
              />
              <LinkPicker
                value={category.href}
                onChange={(value) => updateCategory(category.id, "href", value)}
              />
              <button
                onClick={() => removeCategory(category.id)}
                type="button"
                className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="mt-3">
              <textarea
                value={category.description ?? ""}
                onChange={(e) => updateCategory(category.id, "description", e.target.value)}
                className="admin-input resize-none"
                rows={2}
                placeholder="Category description"
              />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Subcategories
                </h3>
                <button
                  onClick={() => addSubcategory(category.id)}
                  type="button"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Plus className="size-3" /> Add Subcategory
                </button>
              </div>

              {category.subcategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  No subcategories yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="grid lg:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                        <input
                          value={subcategory.label}
                          onChange={(e) =>
                            updateSubcategory(category.id, subcategory.id, "label", e.target.value)
                          }
                          className="admin-input"
                          placeholder="Subcategory label"
                        />
                        <input
                          value={subcategory.id}
                          onChange={(e) =>
                            updateSubcategory(category.id, subcategory.id, "id", e.target.value)
                          }
                          className="admin-input font-mono text-xs"
                          placeholder="subcategory-id"
                        />
                        <LinkPicker
                          value={subcategory.href}
                          onChange={(value) =>
                            updateSubcategory(category.id, subcategory.id, "href", value)
                          }
                        />
                        <button
                          onClick={() => removeSubcategory(category.id, subcategory.id)}
                          type="button"
                          className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-3">
                        <textarea
                          value={subcategory.desc}
                          onChange={(e) =>
                            updateSubcategory(category.id, subcategory.id, "desc", e.target.value)
                          }
                          className="admin-input resize-none"
                          rows={2}
                          placeholder="Subcategory description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {config.categories.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No categories yet. Add your first category to start building the catalog.
          </div>
        )}
      </div>
    </div>
  );
}
