"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { CatalogConfig, CatalogCategory, CatalogSubcategory } from "@/types";
import { DEFAULT_CATALOG } from "@/lib/config-defaults";

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeUiKey() {
  return crypto.randomUUID();
}

type UiSub = CatalogSubcategory & { uiKey: string };
type UiCat = Omit<CatalogCategory, "subcategories"> & { uiKey: string; subcategories: UiSub[] };
type UiConfig = { categories: UiCat[] };

function withUiKeys(config: CatalogConfig): UiConfig {
  return {
    categories: (config.categories ?? []).map((cat) => ({
      ...cat,
      uiKey: makeUiKey(),
      subcategories: (cat.subcategories ?? []).map((sub) => ({ ...sub, uiKey: makeUiKey() })),
    })),
  };
}

function stripUiKeys(config: UiConfig): CatalogConfig {
  return {
    categories: config.categories.map(({ uiKey: _u, subcategories, ...cat }) => ({
      ...cat,
      href: `/shop?category=${cat.id}`,
      subcategories: subcategories.map(({ uiKey: _su, ...sub }) => ({
        ...sub,
        href: `/shop?category=${cat.id}&subcategory=${sub.id}`,
      })),
    })),
  };
}

export default function AdminCatalogPage() {
  const [config, setConfig] = useState<UiConfig>(withUiKeys(DEFAULT_CATALOG));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Track which IDs were manually edited (don't auto-overwrite those)
  const manualIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/site-config?key=catalog")
      .then((r) => r.json())
      .then((d) => {
        const loaded = withUiKeys(d.value ?? DEFAULT_CATALOG);
        // All loaded categories have real IDs — mark them as manual so we don't overwrite
        loaded.categories.forEach((c) => {
          manualIds.current.add(c.uiKey);
          c.subcategories.forEach((s) => manualIds.current.add(s.uiKey));
        });
        setConfig(loaded);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleCollapse(uiKey: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(uiKey)) next.delete(uiKey);
      else next.add(uiKey);
      return next;
    });
  }

  function addCategory() {
    const uiKey = makeUiKey();
    setConfig((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { uiKey, id: "", label: "", href: "/shop", description: "", subcategories: [] },
      ],
    }));
  }

  function updateCatLabel(uiKey: string, label: string) {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.uiKey !== uiKey) return c;
        const next = { ...c, label };
        if (!manualIds.current.has(uiKey)) next.id = slugify(label);
        return next;
      }),
    }));
  }

  function updateCatId(uiKey: string, id: string) {
    manualIds.current.add(uiKey);
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.uiKey === uiKey ? { ...c, id } : c)),
    }));
  }

  function updateCatDesc(uiKey: string, description: string) {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.uiKey === uiKey ? { ...c, description } : c)),
    }));
  }

  function removeCategory(uiKey: string) {
    setConfig((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.uiKey !== uiKey) }));
  }

  function addSubcategory(catUiKey: string) {
    const subUiKey = makeUiKey();
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.uiKey !== catUiKey
          ? c
          : {
              ...c,
              subcategories: [
                ...c.subcategories,
                { uiKey: subUiKey, id: "", label: "", href: "/shop", desc: "" },
              ],
            }
      ),
    }));
  }

  function updateSubLabel(catUiKey: string, subUiKey: string, label: string) {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.uiKey !== catUiKey
          ? c
          : {
              ...c,
              subcategories: c.subcategories.map((s) => {
                if (s.uiKey !== subUiKey) return s;
                const next = { ...s, label };
                if (!manualIds.current.has(subUiKey)) next.id = slugify(label);
                return next;
              }),
            }
      ),
    }));
  }

  function updateSubId(catUiKey: string, subUiKey: string, id: string) {
    manualIds.current.add(subUiKey);
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.uiKey !== catUiKey
          ? c
          : { ...c, subcategories: c.subcategories.map((s) => (s.uiKey === subUiKey ? { ...s, id } : s)) }
      ),
    }));
  }

  function updateSubDesc(catUiKey: string, subUiKey: string, desc: string) {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.uiKey !== catUiKey
          ? c
          : { ...c, subcategories: c.subcategories.map((s) => (s.uiKey === subUiKey ? { ...s, desc } : s)) }
      ),
    }));
  }

  function removeSubcategory(catUiKey: string, subUiKey: string) {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.uiKey !== catUiKey
          ? c
          : { ...c, subcategories: c.subcategories.filter((s) => s.uiKey !== subUiKey) }
      ),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "catalog", value: stripUiKeys(config) }),
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalog Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Categories and subcategories — URLs are auto-generated from IDs.
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

      {/* How it works note */}
      <div className="rounded-2xl bg-brand/5 border border-brand/15 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">How it works:</span> Type a category label — the ID auto-fills as a slug.
        URLs are auto-generated: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/shop?category=ID</code> and{" "}
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">/shop?category=CAT&subcategory=SUB</code>. No manual URL selection needed.
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Categories ({config.categories.length})
        </h2>
        <button
          onClick={addCategory}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <Plus className="size-4" /> Add Category
        </button>
      </div>

      <div className="space-y-4">
        {config.categories.map((cat) => {
          const isCollapsed = collapsed.has(cat.uiKey);
          const catUrl = cat.id ? `/shop?category=${cat.id}` : null;

          return (
            <div key={cat.uiKey} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Category header row */}
              <div className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => toggleCollapse(cat.uiKey)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
                >
                  {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                </button>

                <div className="flex-1 grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Label</label>
                    <input
                      value={cat.label}
                      onChange={(e) => updateCatLabel(cat.uiKey, e.target.value)}
                      className="admin-input"
                      placeholder="e.g. Running"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      ID (slug) {!manualIds.current.has(cat.uiKey) && cat.label && <span className="text-brand normal-case font-normal">· auto</span>}
                    </label>
                    <div className="relative">
                      <input
                        value={cat.id}
                        onChange={(e) => updateCatId(cat.uiKey, e.target.value)}
                        className="admin-input font-mono text-xs"
                        placeholder="e.g. running"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeCategory(cat.uiKey)}
                  type="button"
                  className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Auto-generated URL badge */}
              {catUrl && (
                <div className="px-4 pb-2 -mt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-brand bg-brand/8 border border-brand/15 px-2.5 py-1 rounded-lg">
                    🔗 {catUrl}
                  </span>
                </div>
              )}

              {!isCollapsed && (
                <div className="px-4 pb-4 space-y-4 border-t border-border mt-2 pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Description</label>
                    <textarea
                      value={cat.description ?? ""}
                      onChange={(e) => updateCatDesc(cat.uiKey, e.target.value)}
                      className="admin-input resize-none"
                      rows={2}
                      placeholder="Short description shown in navbar dropdown"
                    />
                  </div>

                  {/* Subcategories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Subcategories ({cat.subcategories.length})
                      </h3>
                      <button
                        onClick={() => addSubcategory(cat.uiKey)}
                        type="button"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <Plus className="size-3" /> Add Subcategory
                      </button>
                    </div>

                    {cat.subcategories.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                        No subcategories yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cat.subcategories.map((sub) => {
                          const subUrl = cat.id && sub.id
                            ? `/shop?category=${cat.id}&subcategory=${sub.id}`
                            : null;

                          return (
                            <div key={sub.uiKey} className="rounded-xl border border-border bg-background p-3 space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 grid sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Label</label>
                                    <input
                                      value={sub.label}
                                      onChange={(e) => updateSubLabel(cat.uiKey, sub.uiKey, e.target.value)}
                                      className="admin-input"
                                      placeholder="e.g. Road Running"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                      ID (slug) {!manualIds.current.has(sub.uiKey) && sub.label && <span className="text-brand normal-case font-normal">· auto</span>}
                                    </label>
                                    <input
                                      value={sub.id}
                                      onChange={(e) => updateSubId(cat.uiKey, sub.uiKey, e.target.value)}
                                      className="admin-input font-mono text-xs"
                                      placeholder="e.g. road-running"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeSubcategory(cat.uiKey, sub.uiKey)}
                                  type="button"
                                  className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors shrink-0 mt-5"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>

                              {subUrl && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-brand bg-brand/8 border border-brand/15 px-2.5 py-1 rounded-lg">
                                  🔗 {subUrl}
                                </span>
                              )}

                              <textarea
                                value={sub.desc}
                                onChange={(e) => updateSubDesc(cat.uiKey, sub.uiKey, e.target.value)}
                                className="admin-input resize-none"
                                rows={2}
                                placeholder="Short description shown in navbar dropdown"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {config.categories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No categories yet. Click &quot;Add Category&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
}
