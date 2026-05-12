"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, Globe } from "lucide-react";
import type { FooterConfig, FooterColumn } from "@/types";
import { DEFAULT_FOOTER } from "@/lib/config-defaults";
import { LinkPicker } from "@/components/admin/LinkPicker";

export default function AdminFooterPage() {
  const [config, setConfig] = useState<FooterConfig>(DEFAULT_FOOTER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-config?key=footer")
      .then((r) => r.json())
      .then((d) => setConfig(d.value ?? DEFAULT_FOOTER))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/site-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "footer", value: config }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateColumn(idx: number, field: keyof FooterColumn, val: string) {
    setConfig((c) => ({
      ...c,
      columns: c.columns.map((col, i) =>
        i === idx ? { ...col, [field]: val } : col
      ),
    }));
  }

  function addColumn() {
    setConfig((c) => ({
      ...c,
      columns: [
        ...c.columns,
        { heading: "New Column", links: [{ label: "Link", href: "/" }] },
      ],
    }));
  }

  function removeColumn(idx: number) {
    setConfig((c) => ({ ...c, columns: c.columns.filter((_, i) => i !== idx) }));
  }

  function updateLink(colIdx: number, lIdx: number, field: "label" | "href", val: string) {
    setConfig((c) => ({
      ...c,
      columns: c.columns.map((col, i) =>
        i !== colIdx
          ? col
          : {
              ...col,
              links: col.links.map((l, j) =>
                j === lIdx ? { ...l, [field]: val } : l
              ),
            }
      ),
    }));
  }

  function addLink(colIdx: number) {
    setConfig((c) => ({
      ...c,
      columns: c.columns.map((col, i) =>
        i !== colIdx
          ? col
          : { ...col, links: [...col.links, { label: "New Link", href: "/" }] }
      ),
    }));
  }

  function removeLink(colIdx: number, lIdx: number) {
    setConfig((c) => ({
      ...c,
      columns: c.columns.map((col, i) =>
        i !== colIdx
          ? col
          : { ...col, links: col.links.filter((_, j) => j !== lIdx) }
      ),
    }));
  }

  function updateSocial(idx: number, field: "label" | "href", val: string) {
    setConfig((c) => ({
      ...c,
      socialLinks: c.socialLinks.map((s, i) =>
        i === idx ? { ...s, [field]: val } : s
      ),
    }));
  }

  function addSocial() {
    setConfig((c) => ({
      ...c,
      socialLinks: [...c.socialLinks, { label: "Instagram", href: "https://instagram.com/" }],
    }));
  }

  function removeSocial(idx: number) {
    setConfig((c) => ({
      ...c,
      socialLinks: c.socialLinks.filter((_, i) => i !== idx),
    }));
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
          <h1 className="text-2xl font-bold text-foreground">Footer Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edit footer tagline, link columns, and social links
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-70"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Tagline */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6 shadow-sm">
        <label className="admin-label">Footer Tagline</label>
        <textarea
          value={config.tagline}
          onChange={(e) => setConfig((c) => ({ ...c, tagline: e.target.value }))}
          rows={2}
          className="admin-input resize-none mt-1"
          placeholder="Brand tagline shown in footer…"
        />
      </div>

      {/* Link columns */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Link Columns
          </h2>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="size-3" /> Add Column
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.columns.map((col, colIdx) => (
            <div key={colIdx} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={col.heading}
                  onChange={(e) => updateColumn(colIdx, "heading", e.target.value)}
                  className="admin-input flex-1 font-medium"
                  placeholder="Column heading"
                />
                <button onClick={() => removeColumn(colIdx)} className="text-destructive hover:text-destructive/80 p-1 transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="space-y-2">
                {col.links.map((link, lIdx) => (
                  <div key={lIdx} className="flex gap-1.5">
                    <input
                      value={link.label}
                      onChange={(e) => updateLink(colIdx, lIdx, "label", e.target.value)}
                      className="admin-input text-xs flex-1"
                      placeholder="Label"
                    />
                    <LinkPicker
                      value={link.href}
                      onChange={(val) => updateLink(colIdx, lIdx, "href", val)}
                      className="w-32"
                    />
                    <button onClick={() => removeLink(colIdx, lIdx)} className="text-destructive hover:text-destructive/80 px-1 transition-colors">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addLink(colIdx)}
                  className="text-xs text-brand hover:opacity-80 flex items-center gap-1 mt-1 bg-brand/10 px-2 py-1 rounded-md transition-opacity"
                >
                  <Plus className="size-3" /> Add Link
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social links */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Social Links
          </h2>
          <button
            onClick={addSocial}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="size-3" /> Add Social
          </button>
        </div>
        <div className="space-y-3">
          {config.socialLinks.map((s, idx) => {
            const Icon = Globe;
            return (
              <div key={idx} className="flex gap-3 items-center bg-muted/20 p-3 rounded-xl border border-border">
                <div className="size-8 rounded-lg bg-background flex items-center justify-center border border-border shrink-0">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <input
                  value={s.label}
                  onChange={(e) => updateSocial(idx, "label", e.target.value)}
                  className="admin-input w-32 text-xs"
                  placeholder="Platform"
                />
                <input
                  value={s.href}
                  onChange={(e) => updateSocial(idx, "href", e.target.value)}
                  className="admin-input flex-1 text-xs"
                  placeholder="https://..."
                />
                <button
                  onClick={() => removeSocial(idx)}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          {config.socialLinks.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No social links added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
