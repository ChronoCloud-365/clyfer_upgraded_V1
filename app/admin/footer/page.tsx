"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Save, Loader2, Type } from "lucide-react";
import type { FooterConfig, FooterColumn, FooterItem } from "@/types";
import { DEFAULT_FOOTER } from "@/lib/config-defaults";
import { LinkPicker } from "@/components/admin/LinkPicker";

const ICON_OPTIONS = ["Instagram", "Facebook", "YouTube", "Email"];

type UiFooterItem = FooterItem & { uiKey: string };
type UiFooterColumn = Omit<FooterColumn, "items"> & { uiKey: string; items: UiFooterItem[] };
type UiFooterConfig = {
  tagline: string;
  columns: UiFooterColumn[];
  socialLinks: Array<{ label: string; href: string; iconName?: string; uiKey: string }>;
};

function makeUiKey() {
  return crypto.randomUUID();
}

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

function withUiKeys(config: FooterConfig): UiFooterConfig {
  return {
    tagline: config.tagline ?? "",
    columns: (config.columns ?? []).map((column) => ({
      ...column,
      uiKey: makeUiKey(),
      items: (column.items ?? []).map((item) => ({ ...item, uiKey: makeUiKey() })),
    })),
    socialLinks: (config.socialLinks ?? []).map((social) => ({
      ...social,
      iconName: social.iconName ?? social.label,
      uiKey: makeUiKey(),
    })),
  };
}

function stripUiKeys(config: UiFooterConfig): FooterConfig {
  return {
    tagline: config.tagline,
    columns: config.columns.map(({ uiKey: _colUiKey, items, ...column }) => ({
      ...column,
      items: items.map(({ uiKey: _itemUiKey, ...item }) => item),
    })),
    socialLinks: config.socialLinks.map(({ uiKey: _socialUiKey, ...social }) => social),
  };
}

function footerIconForName(name: string) {
  return name === "Facebook" ? "f" : name === "YouTube" ? ">" : name === "Email" ? "@" : "o";
}

function FooterPreview({ config }: { config: UiFooterConfig }) {
  return (
    <div className="rounded-[2rem] border border-border bg-background overflow-hidden">
      <div className="border-b border-border px-5 py-4 bg-muted/20">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Preview</p>
      </div>
      <footer className="bg-background text-muted-foreground">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.jpeg" alt="Clyfar Fashion logo" width={42} height={42} className="rounded-xl object-cover" />
                <span className="text-2xl font-bold tracking-normal text-foreground">CLY<span className="text-brand">FAR</span></span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">{config.tagline || "Footer tagline preview"}</p>
            </div>

            {config.columns.map((column) => (
              <div key={column.uiKey}>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">{column.heading}</h3>
                <div className="space-y-2">
                  {column.items.map((item) => {
                    if (item.type === "link") return <div key={item.uiKey} className="text-sm text-foreground">{item.label}</div>;
                    if (item.type === "text") return <p key={item.uiKey} className="text-sm leading-relaxed">{item.content}</p>;
                    if (item.type === "icon") return <div key={item.uiKey} className="inline-flex items-center gap-2 text-sm"><span className="size-7 rounded-full bg-muted flex items-center justify-center">{footerIconForName(item.iconName)}</span>{item.label}</div>;
                    return <div key={item.uiKey} className="flex items-center gap-2 text-sm"><Image src={item.imageUrl} alt={item.alt ?? item.label} width={28} height={28} className="rounded-lg object-cover" />{item.label}</div>;
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
  const [config, setConfig] = useState<UiFooterConfig>(withUiKeys(DEFAULT_FOOTER));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-config?key=footer")
      .then((r) => r.json())
      .then((d) => setConfig(withUiKeys(d.value ?? DEFAULT_FOOTER)))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "footer", value: stripUiKeys(config) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function updateColumn(idx: number, field: keyof FooterColumn, value: string) { setConfig((c) => ({ ...c, columns: c.columns.map((col, i) => i === idx ? { ...col, [field]: value } : col) })); }
  function addColumn() { setConfig((c) => ({ ...c, columns: [...c.columns, { uiKey: makeUiKey(), heading: "New Column", items: [{ ...createItem("text"), uiKey: makeUiKey() }] }] })); }
  function removeColumn(idx: number) { setConfig((c) => ({ ...c, columns: c.columns.filter((_, i) => i !== idx) })); }
  function addItem(colIdx: number, type: FooterItem["type"] = "link") { setConfig((c) => ({ ...c, columns: c.columns.map((col, i) => i === colIdx ? { ...col, items: [...col.items, { ...createItem(type), uiKey: makeUiKey() }] } : col) })); }
  function updateItem(colIdx: number, itemIdx: number, updater: (item: FooterItem) => FooterItem) { setConfig((c) => ({ ...c, columns: c.columns.map((col, i) => i === colIdx ? { ...col, items: col.items.map((item, idx) => idx === itemIdx ? { ...updater(item), uiKey: item.uiKey } : item) } : col) })); }
  function removeItem(colIdx: number, itemIdx: number) { setConfig((c) => ({ ...c, columns: c.columns.map((col, i) => i === colIdx ? { ...col, items: col.items.filter((_, idx) => idx !== itemIdx) } : col) })); }
  function updateSocial(idx: number, field: "label" | "href", value: string) { setConfig((c) => ({ ...c, socialLinks: c.socialLinks.map((s, i) => i === idx ? { ...s, [field]: value } : s) })); }
  function updateSocialIcon(idx: number, value: string) { setConfig((c) => ({ ...c, socialLinks: c.socialLinks.map((s, i) => i === idx ? { ...s, iconName: value } : s) })); }
  function addSocial() { setConfig((c) => ({ ...c, socialLinks: [...c.socialLinks, { uiKey: makeUiKey(), label: "Instagram", iconName: "Instagram", href: "https://instagram.com/" }] })); }
  function removeSocial(idx: number) { setConfig((c) => ({ ...c, socialLinks: c.socialLinks.filter((_, i) => i !== idx) })); }

  if (loading) return <div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-foreground">Footer Editor</h1><p className="text-muted-foreground text-sm mt-1">Mix text, links, icons, and images inside footer columns. Preview updates live.</p></div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-70" style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}</button>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2"><Type className="size-4 text-muted-foreground" /><h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Tagline</h2></div>
        <textarea value={config.tagline} onChange={(e) => setConfig((c) => ({ ...c, tagline: e.target.value }))} rows={3} className="admin-input resize-none" placeholder="Footer tagline shown alongside the logo" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Footer Columns</h2><button onClick={addColumn} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"><Plus className="size-3" /> Add Column</button></div>
        <div className="grid lg:grid-cols-2 gap-4">
          {config.columns.map((column, colIdx) => (
            <div key={column.uiKey} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2"><input value={column.heading} onChange={(e) => updateColumn(colIdx, "heading", e.target.value)} className="admin-input flex-1 font-medium" /><button onClick={() => removeColumn(colIdx)} type="button" className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10"><Trash2 className="size-4" /></button></div>
              <div className="space-y-3">
                {column.items.map((item, itemIdx) => (
                  <div key={item.uiKey} className="rounded-2xl border border-border bg-background p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3"><select value={item.type} onChange={(e) => updateItem(colIdx, itemIdx, () => createItem(e.target.value as FooterItem["type"]))} className="admin-input w-40"><option value="text">Text</option><option value="link">Link</option><option value="icon">Icon</option><option value="image">Image</option></select><button onClick={() => removeItem(colIdx, itemIdx)} type="button" className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10"><Trash2 className="size-4" /></button></div>
                    {item.type === "text" && <textarea value={item.content} onChange={(e) => updateItem(colIdx, itemIdx, (cur) => cur.type === "text" ? { ...cur, content: e.target.value } : cur)} rows={3} className="admin-input resize-none" />}
                    {item.type === "link" && <div className="grid sm:grid-cols-[1fr_220px] gap-3"><input value={item.label} onChange={(e) => updateItem(colIdx, itemIdx, (cur) => cur.type === "link" ? { ...cur, label: e.target.value } : cur)} className="admin-input" /><LinkPicker value={item.href} onChange={(value) => updateItem(colIdx, itemIdx, (cur) => cur.type === "link" ? { ...cur, href: value } : cur)} /></div>}
                    {item.type === "icon" && <div className="grid sm:grid-cols-[1fr_1fr] gap-3"><input value={item.label} onChange={(e) => updateItem(colIdx, itemIdx, (cur) => cur.type === "icon" ? { ...cur, label: e.target.value } : cur)} className="admin-input" /><input value={item.href ?? ""} onChange={(e) => updateItem(colIdx, itemIdx, (cur) => cur.type === "icon" ? { ...cur, href: e.target.value } : cur)} className="admin-input" /><select value={item.iconName} onChange={(e) => updateItem(colIdx, itemIdx, (cur) => cur.type === "icon" ? { ...cur, iconName: e.target.value } : cur)} className="admin-input sm:col-span-2">{ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></div>}
                    {item.type === "image" && <div className="grid sm:grid-cols-[1fr_1fr] gap-3"><input value={item.label} onChange={(e) => updateItem(colIdx, itemIdx, (cur) => cur.type === "image" ? { ...cur, label: e.target.value } : cur)} className="admin-input" /><input value={item.imageUrl} onChange={(e) => updateItem(colIdx, itemIdx, (cur) => cur.type === "image" ? { ...cur, imageUrl: e.target.value } : cur)} className="admin-input" /><input value={item.alt ?? ""} onChange={(e) => updateItem(colIdx, itemIdx, (cur) => cur.type === "image" ? { ...cur, alt: e.target.value } : cur)} className="admin-input sm:col-span-2" /></div>}
                  </div>
                ))}
              </div>
              <button onClick={() => addItem(colIdx, "link")} type="button" className="text-xs text-brand hover:opacity-80 flex items-center gap-1 mt-1 bg-brand/10 px-2 py-1 rounded-md"><Plus className="size-3" /> Add Item</button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4"><h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Social Links</h2><button onClick={addSocial} type="button" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"><Plus className="size-3" /> Add Social</button></div>
        <div className="space-y-3">
          {config.socialLinks.map((social, idx) => (
            <div key={social.uiKey} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
              <input value={social.label} onChange={(e) => updateSocial(idx, "label", e.target.value)} className="admin-input" placeholder="Platform" />
              <select value={social.iconName ?? social.label} onChange={(e) => updateSocialIcon(idx, e.target.value)} className="admin-input">{ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select>
              <input value={social.href} onChange={(e) => updateSocial(idx, "href", e.target.value)} className="admin-input" placeholder="https://..." />
              <button onClick={() => removeSocial(idx)} type="button" className="p-2 rounded-lg border border-border text-red-400 hover:bg-red-500/10"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <FooterPreview config={config} />
    </div>
  );
}
