"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, GripVertical, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { NavbarConfig, NavCategory, NavLink, NavSubcategory } from "@/types";
import { DEFAULT_NAVBAR } from "@/lib/config-defaults";

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function AdminNavbarPage() {
  const [config, setConfig] = useState<NavbarConfig>(DEFAULT_NAVBAR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>("shop");

  useEffect(() => {
    fetch("/api/admin/site-config?key=navbar")
      .then((r) => r.json())
      .then((d) => setConfig(d.value ?? DEFAULT_NAVBAR))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/site-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "navbar", value: config }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Category helpers
  function addCategory() {
    const id = generateId();
    setConfig((c) => ({
      ...c,
      categories: [
        ...c.categories,
        { id, label: "New Category", href: "/shop/new", subcategories: [] },
      ],
    }));
    setExpandedCat(id);
  }

  function updateCategory(id: string, field: keyof NavCategory, value: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === id ? { ...cat, [field]: value } : cat
      ),
    }));
  }

  function removeCategory(id: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.filter((cat) => cat.id !== id),
    }));
  }

  // Subcategory helpers
  function addSubcategory(catId: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              subcategories: [
                ...cat.subcategories,
                { label: "New Sub", href: "/shop/new-sub", desc: "" },
              ],
            }
          : cat
      ),
    }));
  }

  function updateSubcategory(catId: string, idx: number, field: keyof NavSubcategory, value: string) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((sub, i) =>
                i === idx ? { ...sub, [field]: value } : sub
              ),
            }
          : cat
      ),
    }));
  }

  function removeSubcategory(catId: string, idx: number) {
    setConfig((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === catId
          ? { ...cat, subcategories: cat.subcategories.filter((_, i) => i !== idx) }
          : cat
      ),
    }));
  }

  // Top-level link helpers
  function addLink() {
    setConfig((c) => ({
      ...c,
      links: [...c.links, { label: "New Link", href: "/new" }],
    }));
  }

  function updateLink(idx: number, field: keyof NavLink, value: string) {
    setConfig((c) => ({
      ...c,
      links: c.links.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    }));
  }

  function removeLink(idx: number) {
    setConfig((c) => ({ ...c, links: c.links.filter((_, i) => i !== idx) }));
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-400">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Navbar Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage dropdown categories and navigation links
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-70"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Dropdown Categories */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Dropdown Categories
          </h2>
          <button
            onClick={addCategory}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="size-3" /> Add Category
          </button>
        </div>

        <div className="space-y-3">
          {config.categories.map((cat) => (
            <div key={cat.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Category header */}
              <div className="flex items-center gap-3 p-4">
                <GripVertical className="size-4 text-muted-foreground shrink-0" />
                <button
                  onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  className="flex items-center gap-2 flex-1 text-left hover:opacity-80"
                >
                  {expandedCat === cat.id ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-semibold text-card-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground ml-1 font-medium bg-muted px-2 py-0.5 rounded-full">
                    {cat.subcategories.length} subcategories
                  </span>
                </button>
                <button
                  onClick={() => removeCategory(cat.id)}
                  className="text-destructive hover:text-destructive/80 transition-colors p-1"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Category fields + subcategories */}
              {expandedCat === cat.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  className="border-t border-border p-4 space-y-4 bg-muted/30"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="admin-label">Label</label>
                      <input
                        value={cat.label}
                        onChange={(e) => updateCategory(cat.id, "label", e.target.value)}
                        className="admin-input"
                        placeholder="Category label"
                      />
                    </div>
                    <div>
                      <label className="admin-label">Href</label>
                      <input
                        value={cat.href}
                        onChange={(e) => updateCategory(cat.id, "href", e.target.value)}
                        className="admin-input"
                        placeholder="/shop/category"
                      />
                    </div>
                  </div>

                  {/* Subcategories */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subcategories</span>
                      <button
                        onClick={() => addSubcategory(cat.id)}
                        className="text-xs font-semibold text-brand hover:opacity-80 flex items-center gap-1 bg-brand/10 px-2 py-1 rounded-md"
                      >
                        <Plus className="size-3" /> Add Subcategory
                      </button>
                    </div>
                    <div className="space-y-3">
                      {cat.subcategories.map((sub, idx) => (
                        <div key={idx} className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border shadow-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="admin-label text-[10px]">Subcategory Label</label>
                              <input
                                value={sub.label}
                                onChange={(e) => updateSubcategory(cat.id, idx, "label", e.target.value)}
                                className="admin-input text-xs"
                                placeholder="e.g. Running Shoes"
                              />
                            </div>
                            <div>
                              <label className="admin-label text-[10px]">URL Path</label>
                              <input
                                value={sub.href}
                                onChange={(e) => updateSubcategory(cat.id, idx, "href", e.target.value)}
                                className="admin-input text-xs"
                                placeholder="/shop/running"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="admin-label text-[10px]">Short Description</label>
                              <input
                                value={sub.desc}
                                onChange={(e) => updateSubcategory(cat.id, idx, "desc", e.target.value)}
                                className="admin-input text-xs"
                                placeholder="Brief description for the dropdown..."
                              />
                            </div>
                            <button
                              onClick={() => removeSubcategory(cat.id, idx)}
                              className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground p-2 rounded-lg transition-colors h-[34px]"
                              title="Delete subcategory"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {cat.subcategories.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
                          No subcategories yet. Click "Add Subcategory" to create one.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Top-level Links */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Navigation Links
          </h2>
          <button
            onClick={addLink}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="size-3" /> Add Link
          </button>
        </div>
        <div className="space-y-2">
          {config.links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
              <GripVertical className="size-4 text-muted-foreground shrink-0" />
              <input
                value={link.label}
                onChange={(e) => updateLink(idx, "label", e.target.value)}
                className="admin-input flex-1"
                placeholder="Label"
              />
              <input
                value={link.href}
                onChange={(e) => updateLink(idx, "href", e.target.value)}
                className="admin-input flex-1"
                placeholder="/path"
              />
              <button onClick={() => removeLink(idx)} className="text-destructive hover:text-destructive/80 p-1">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
