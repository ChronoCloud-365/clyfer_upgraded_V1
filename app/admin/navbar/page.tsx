"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown, Check } from "lucide-react";
import type { CatalogConfig, NavbarSettings, NavLink } from "@/types";
import { DEFAULT_CATALOG, DEFAULT_NAVBAR_SETTINGS } from "@/lib/config-defaults";
import { LinkPicker } from "@/components/admin/LinkPicker";

export default function AdminNavbarPage() {
  const [settings, setSettings] = useState<NavbarSettings>(DEFAULT_NAVBAR_SETTINGS);
  const [catalog, setCatalog] = useState<CatalogConfig>(DEFAULT_CATALOG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-config?key=navbar").then((r) => r.json()),
      fetch("/api/admin/site-config?key=catalog").then((r) => r.json()),
    ])
      .then(([nav, cat]) => {
        if (nav.value?.categoryIds || nav.value?.links) {
          setSettings({
            categoryIds: nav.value.categoryIds ?? DEFAULT_NAVBAR_SETTINGS.categoryIds,
            links: nav.value.links ?? [],
          });
        }
        if (cat.value?.categories) {
          setCatalog(cat.value);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const availableCategories = catalog.categories.length ? catalog.categories : DEFAULT_CATALOG.categories;
  const selectedCategories = useMemo(
    () =>
      settings.categoryIds
        .map((id) => availableCategories.find((category) => category.id === id))
        .filter((category): category is CatalogConfig["categories"][number] => Boolean(category)),
    [availableCategories, settings.categoryIds]
  );

  function toggleCategory(id: string) {
    setSettings((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id)
        ? current.categoryIds.filter((item) => item !== id)
        : [...current.categoryIds, id],
    }));
  }

  function moveCategory(id: string, direction: -1 | 1) {
    setSettings((current) => {
      const index = current.categoryIds.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.categoryIds.length) return current;
      const next = [...current.categoryIds];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return { ...current, categoryIds: next };
    });
  }

  function addLink() {
    setSettings((current) => ({
      ...current,
      links: [...current.links, { label: "New Link", href: "/shop" }],
    }));
  }

  function updateLink(index: number, field: keyof NavLink, value: string) {
    setSettings((current) => ({
      ...current,
      links: current.links.map((link, idx) =>
        idx === index ? { ...link, [field]: value } : link
      ),
    }));
  }

  function removeLink(index: number) {
    setSettings((current) => ({
      ...current,
      links: current.links.filter((_, idx) => idx !== index),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "navbar", value: settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-400">
        <Loader2 className="size-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Navbar Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pick categories from the shared catalog and manage top-level links.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-70"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Available Categories
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Categories are created in the catalog manager first, then selected here.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
            {selectedCategories.length} selected
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableCategories.map((category) => {
            const active = settings.categoryIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? "border-brand bg-brand/5 shadow-sm"
                    : "border-border bg-background hover:border-border/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{category.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">/shop?category={category.id}</p>
                  </div>
                  {active && (
                    <span className="text-brand">
                      <Check className="size-4" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  {category.subcategories.length} subcategories
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Selected Order
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Reorder the categories shown in the public navbar.
            </p>
          </div>
        </div>

        {selectedCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Select one or more categories from the catalog above.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedCategories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{category.label}</p>
                  <p className="text-xs text-muted-foreground">/shop?category={category.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveCategory(category.id, -1)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    disabled={index === 0}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCategory(category.id, 1)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    disabled={index === selectedCategories.length - 1}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Top-Level Links
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Add utility links like privacy, contact, or about pages.
            </p>
          </div>
          <button
            onClick={addLink}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="size-3" /> Add Link
          </button>
        </div>

        <div className="space-y-3">
          {settings.links.map((link, index) => (
            <div key={`${link.label}-${index}`} className="grid sm:grid-cols-[1fr_220px_auto] gap-3 items-center">
              <input
                value={link.label}
                onChange={(e) => updateLink(index, "label", e.target.value)}
                className="admin-input"
                placeholder="Label"
              />
              <LinkPicker
                value={link.href}
                onChange={(value) => updateLink(index, "href", value)}
              />
              <button
                onClick={() => removeLink(index)}
                className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors"
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {settings.links.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No top-level links yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
