"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Save, Loader2, ChevronDown, ChevronRight, Tag, Layers } from "lucide-react";
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

const CAT_COLORS = [
  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "bg-green-500/10 text-green-400 border-green-500/20",
  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "bg-orange-500/10 text-orange-400 border-orange-500/20",
];

export default function AdminCatalogPage() {
  const [config, setConfig] = useState<UiConfig>(withUiKeys(DEFAULT_CATALOG));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const manualIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/site-config?key=catalog")
      .then((r) => r.json())
      .then((d) => {
        const loaded = withUiKeys(d.value ?? DEFAULT_CATALOG);
        loaded.categories.forEach((c) => {
          manualIds.current.add(c.uiKey);
          c.subcategories.forEach((s) => manualIds.current.add(s.uiKey));
        });
        setConfig(loaded);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleExpand(uiKey: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uiKey)) next.delete(uiKey);
      else next.add(uiKey);
      return next;
    });
  }

  function addCategory() {
    const uiKey = makeUiKey();
    setExpanded((prev) => new Set(prev).add(uiKey));
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
          : { ...c, subcategories: [...c.subcategories, { uiKey: subUiKey, id: "", label: "", href: "/shop", desc: "" }] }
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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalog</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage categories and subcategories. URLs are auto-generated.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shrink-0 disabled:opacity-70 transition-all"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-brand/10 flex items-center justify-center">
            <Layers className="size-4 text-brand" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{config.categories.length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-brand/10 flex items-center justify-center">
            <Tag className="size-4 text-brand" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">
              {config.categories.reduce((sum, c) => sum + c.subcategories.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Subcategories</p>
          </div>
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Categories ({config.categories.length})
          </p>
          <button
            onClick={addCategory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="size-3.5" /> Add Category
          </button>
        </div>

        {config.categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No categories yet. Click &quot;Add Category&quot; to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {config.categories.map((cat, catIndex) => {
              const isOpen = expanded.has(cat.uiKey);
              const catUrl = cat.id ? `/shop?category=${cat.id}` : null;
              const colorClass = CAT_COLORS[catIndex % CAT_COLORS.length];

              return (
                <div
                  key={cat.uiKey}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
                >
                  {/* Collapsed header — always visible */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(cat.uiKey)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
                  >
                    <ChevronRight
                      className={`size-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />

                    {/* Color dot */}
                    <span className={`size-7 rounded-lg border flex items-center justify-center shrink-0 text-xs font-bold ${colorClass}`}>
                      {cat.label ? cat.label[0].toUpperCase() : "#"}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">
                          {cat.label || <span className="text-muted-foreground font-normal italic">Unnamed</span>}
                        </span>
                        {catUrl && (
                          <span className="font-mono text-[10px] text-brand bg-brand/8 border border-brand/15 px-2 py-0.5 rounded-md">
                            {catUrl}
                          </span>
                        )}
                      </div>
                      {cat.subcategories.length > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {cat.subcategories.length} subcategor{cat.subcategories.length === 1 ? "y" : "ies"}:{" "}
                          {cat.subcategories.map((s) => s.label).filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); removeCategory(cat.uiKey); }}
                      type="button"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </button>

                  {/* Expanded body */}
                  {isOpen && (
                    <div className="border-t border-border px-4 py-4 space-y-4">
                      {/* Label + ID */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                            Label
                          </label>
                          <input
                            value={cat.label}
                            onChange={(e) => updateCatLabel(cat.uiKey, e.target.value)}
                            className="admin-input"
                            placeholder="e.g. Running"
                            autoFocus={!cat.label}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            ID (slug)
                            {!manualIds.current.has(cat.uiKey) && cat.label && (
                              <span className="text-brand normal-case font-normal">· auto</span>
                            )}
                          </label>
                          <input
                            value={cat.id}
                            onChange={(e) => updateCatId(cat.uiKey, e.target.value)}
                            className="admin-input font-mono text-xs"
                            placeholder="e.g. running"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          Description <span className="normal-case font-normal">(shown in navbar dropdown)</span>
                        </label>
                        <textarea
                          value={cat.description ?? ""}
                          onChange={(e) => updateCatDesc(cat.uiKey, e.target.value)}
                          className="admin-input resize-none"
                          rows={2}
                          placeholder="Short description…"
                        />
                      </div>

                      {/* Subcategories */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                            Subcategories ({cat.subcategories.length})
                          </p>
                          <button
                            onClick={() => addSubcategory(cat.uiKey)}
                            type="button"
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:border-brand/40 hover:text-brand transition-all"
                          >
                            <Plus className="size-3" /> Add
                          </button>
                        </div>

                        {cat.subcategories.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border py-5 text-center text-xs text-muted-foreground">
                            No subcategories yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {cat.subcategories.map((sub) => {
                              const subUrl = cat.id && sub.id
                                ? `/shop?category=${cat.id}&subcategory=${sub.id}`
                                : null;

                              return (
                                <div key={sub.uiKey} className="rounded-xl border border-border bg-background/60 p-3 space-y-2.5">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 grid sm:grid-cols-2 gap-2">
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
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                          ID (slug)
                                          {!manualIds.current.has(sub.uiKey) && sub.label && (
                                            <span className="text-brand normal-case font-normal">· auto</span>
                                          )}
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
                                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 mt-5"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {subUrl && (
                                      <span className="font-mono text-[10px] text-brand bg-brand/8 border border-brand/15 px-2 py-0.5 rounded-md">
                                        {subUrl}
                                      </span>
                                    )}
                                  </div>

                                  <textarea
                                    value={sub.desc}
                                    onChange={(e) => updateSubDesc(cat.uiKey, sub.uiKey, e.target.value)}
                                    className="admin-input resize-none"
                                    rows={1}
                                    placeholder="Short description (optional)"
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
          </div>
        )}
      </div>
    </div>
  );
}
