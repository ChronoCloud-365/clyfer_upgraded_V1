"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Type,
} from "lucide-react";
import type { FooterConfig, FooterColumn, FooterItem } from "@/types";
import { DEFAULT_FOOTER } from "@/lib/config-defaults";
import { LinkPicker } from "@/components/admin/LinkPicker";

const ICON_OPTIONS = ["Instagram", "Facebook", "YouTube", "Email"];

function createItem(type: FooterItem["type"]): FooterItem {
  switch (type) {
    case "link":
      return { type, label: "Link", href: "/shop" };
    case "text":
      return { type, content: "Footer text block" };
    case "icon":
      return { type, label: "Instagram", iconName: "Instagram", href: "https://instagram.com/" };
    case "image":
      return { type, label: "Image", imageUrl: "/logo.jpeg", alt: "Footer image" };
    default:
      return { type: "text", content: "" };
  }
}

function footerIconForName(name: string) {
  return name === "Facebook" ? "f" : name === "YouTube" ? ">" : name === "Email" ? "@" : "o";
}

function FooterPreview({ config }: { config: FooterConfig }) {
  return (
    <div className="rounded-[2rem] border border-border bg-background overflow-hidden">
      <div className="border-b border-border px-5 py-4 bg-muted/20">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Live Preview
        </p>
      </div>
      <footer className="bg-background text-muted-foreground">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.jpeg" alt="Clyfer logo" width={42} height={42} className="rounded-xl object-cover" />
                <span className="text-2xl font-bold tracking-normal text-foreground">
                  CLY<span className="text-brand">FER</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">{config.tagline || "Footer tagline preview"}</p>
              <div className="flex gap-2 flex-wrap">
                {config.socialLinks.map((link) => (
                  <span
                    key={link.label + link.href}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {link.label}
                  </span>
                ))}
              </div>
            </div>

            {config.columns.map((column) => (
              <div key={column.heading}>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
                  {column.heading}
                </h3>
                <div className="space-y-2">
                  {column.items.map((item, idx) => {
                    if (item.type === "link") {
                      return (
                        <div key={idx} className="text-sm text-foreground">
                          {item.label}
                        </div>
                      );
                    }
                    if (item.type === "text") {
                      return (
                        <p key={idx} className="text-sm leading-relaxed">
                          {item.content}
                        </p>
                      );
                    }
                    if (item.type === "icon") {
                      return (
                        <div key={idx} className="inline-flex items-center gap-2 text-sm">
                          <span className="size-7 rounded-full bg-muted flex items-center justify-center">
                            {footerIconForName(item.iconName)}
                          </span>
                          {item.label}
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Image src={item.imageUrl} alt={item.alt ?? item.label} width={28} height={28} className="rounded-lg object-cover" />
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

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
    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "footer", value: config }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function updateColumn(idx: number, field: keyof FooterColumn, value: string) {
    setConfig((current) => ({
      ...current,
      columns: current.columns.map((column, i) =>
        i === idx ? { ...column, [field]: value } : column
      ),
    }));
  }

  function addColumn() {
    setConfig((current) => ({
      ...current,
      columns: [...current.columns, { heading: "New Column", items: [createItem("text")] }],
    }));
  }

  function removeColumn(idx: number) {
    setConfig((current) => ({
      ...current,
      columns: current.columns.filter((_, i) => i !== idx),
    }));
  }

  function addItem(colIdx: number, type: FooterItem["type"] = "link") {
    setConfig((current) => ({
      ...current,
      columns: current.columns.map((column, i) =>
        i === colIdx ? { ...column, items: [...column.items, createItem(type)] } : column
      ),
    }));
  }

  function updateItem(colIdx: number, itemIdx: number, updater: (item: FooterItem) => FooterItem) {
    setConfig((current) => ({
      ...current,
      columns: current.columns.map((column, i) =>
        i === colIdx
          ? {
              ...column,
              items: column.items.map((item, idx) => (idx === itemIdx ? updater(item) : item)),
            }
          : column
      ),
    }));
  }

  function removeItem(colIdx: number, itemIdx: number) {
    setConfig((current) => ({
      ...current,
      columns: current.columns.map((column, i) =>
        i === colIdx
          ? { ...column, items: column.items.filter((_, idx) => idx !== itemIdx) }
          : column
      ),
    }));
  }

  function updateSocial(idx: number, field: "label" | "href", value: string) {
    setConfig((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((link, i) =>
        i === idx ? { ...link, [field]: value } : link
      ),
    }));
  }

  function addSocial() {
    setConfig((current) => ({
      ...current,
      socialLinks: [...current.socialLinks, { label: "Instagram", href: "https://instagram.com/" }],
    }));
  }

  function removeSocial(idx: number) {
    setConfig((current) => ({
      ...current,
      socialLinks: current.socialLinks.filter((_, i) => i !== idx),
    }));
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
          <h1 className="text-2xl font-bold text-foreground">Footer Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mix text, links, icons, and images inside footer columns. Preview updates live.
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

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Type className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Tagline
          </h2>
        </div>
        <textarea
          value={config.tagline}
          onChange={(e) => setConfig((current) => ({ ...current, tagline: e.target.value }))}
          rows={3}
          className="admin-input resize-none"
          placeholder="Footer tagline shown alongside the logo"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Footer Columns
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Add text blocks, links, icons, or images to each column.
            </p>
          </div>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="size-3" /> Add Column
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {config.columns.map((column, colIdx) => (
            <div key={column.heading + colIdx} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <input
                  value={column.heading}
                  onChange={(e) => updateColumn(colIdx, "heading", e.target.value)}
                  className="admin-input flex-1 font-medium"
                  placeholder="Column heading"
                />
                <button
                  onClick={() => removeColumn(colIdx)}
                  className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors"
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="space-y-3">
                {column.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="rounded-2xl border border-border bg-background p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <select
                        value={item.type}
                        onChange={(e) => updateItem(colIdx, itemIdx, () => createItem(e.target.value as FooterItem["type"]))}
                        className="admin-input w-40"
                      >
                        <option value="text">Text</option>
                        <option value="link">Link</option>
                        <option value="icon">Icon</option>
                        <option value="image">Image</option>
                      </select>
                      <button
                        onClick={() => removeItem(colIdx, itemIdx)}
                        type="button"
                        className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {item.type === "text" && (
                      <textarea
                        value={item.content}
                        onChange={(e) => updateItem(colIdx, itemIdx, (current) =>
                          current.type === "text" ? { ...current, content: e.target.value } : current
                        )}
                        rows={3}
                        className="admin-input resize-none"
                        placeholder="Text block content"
                      />
                    )}

                    {item.type === "link" && (
                      <div className="grid sm:grid-cols-[1fr_220px] gap-3">
                        <input
                          value={item.label}
                          onChange={(e) => updateItem(colIdx, itemIdx, (current) =>
                            current.type === "link" ? { ...current, label: e.target.value } : current
                          )}
                          className="admin-input"
                          placeholder="Link label"
                        />
                        <LinkPicker
                          value={item.href}
                          onChange={(value) => updateItem(colIdx, itemIdx, (current) =>
                            current.type === "link" ? { ...current, href: value } : current
                          )}
                        />
                      </div>
                    )}

                    {item.type === "icon" && (
                      <div className="grid sm:grid-cols-[1fr_1fr] gap-3">
                        <input
                          value={item.label}
                          onChange={(e) => updateItem(colIdx, itemIdx, (current) =>
                            current.type === "icon" ? { ...current, label: e.target.value } : current
                          )}
                          className="admin-input"
                          placeholder="Label"
                        />
                        <input
                          value={item.href ?? ""}
                          onChange={(e) => updateItem(colIdx, itemIdx, (current) =>
                            current.type === "icon" ? { ...current, href: e.target.value } : current
                          )}
                          className="admin-input"
                          placeholder="https://..."
                        />
                        <select
                          value={item.iconName}
                          onChange={(e) => updateItem(colIdx, itemIdx, (current) =>
                            current.type === "icon" ? { ...current, iconName: e.target.value } : current
                          )}
                          className="admin-input sm:col-span-2"
                        >
                          {ICON_OPTIONS.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {item.type === "image" && (
                      <div className="grid sm:grid-cols-[1fr_1fr] gap-3">
                        <input
                          value={item.label}
                          onChange={(e) => updateItem(colIdx, itemIdx, (current) =>
                            current.type === "image" ? { ...current, label: e.target.value } : current
                          )}
                          className="admin-input"
                          placeholder="Label"
                        />
                        <input
                          value={item.imageUrl}
                          onChange={(e) => updateItem(colIdx, itemIdx, (current) =>
                            current.type === "image" ? { ...current, imageUrl: e.target.value } : current
                          )}
                          className="admin-input"
                          placeholder="/logo.jpeg"
                        />
                        <input
                          value={item.alt ?? ""}
                          onChange={(e) => updateItem(colIdx, itemIdx, (current) =>
                            current.type === "image" ? { ...current, alt: e.target.value } : current
                          )}
                          className="admin-input sm:col-span-2"
                          placeholder="Alt text"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => addItem(colIdx, "link")}
                className="text-xs text-brand hover:opacity-80 flex items-center gap-1 mt-1 bg-brand/10 px-2 py-1 rounded-md transition-opacity"
                type="button"
              >
                <Plus className="size-3" /> Add Item
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Social Links
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              These still render in the footer&apos;s social row.
            </p>
          </div>
          <button
            onClick={addSocial}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            type="button"
          >
            <Plus className="size-3" /> Add Social
          </button>
        </div>

        <div className="space-y-3">
          {config.socialLinks.map((social, idx) => (
            <div key={`${social.label}-${idx}`} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-center">
              <input
                value={social.label}
                onChange={(e) => updateSocial(idx, "label", e.target.value)}
                className="admin-input"
                placeholder="Platform"
              />
              <input
                value={social.href}
                onChange={(e) => updateSocial(idx, "href", e.target.value)}
                className="admin-input"
                placeholder="https://..."
              />
              <button
                onClick={() => removeSocial(idx)}
                className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10 transition-colors"
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <FooterPreview config={config} />
    </div>
  );
}
