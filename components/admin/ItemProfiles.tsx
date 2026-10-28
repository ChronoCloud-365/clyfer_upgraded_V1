"use client";
/* eslint-disable @next/next/no-img-element -- Uploaded images use the WebP thumbnail service. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ATTRIBUTE_NAMES, generateVariantDrafts, variantName } from "@/lib/inventory/model";
import type { InventoryItem, InventorySnapshot, InventoryVariant, TaxonomySnapshot } from "@/lib/inventory/model";
import { itemImage } from "@/lib/item-image";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const button = "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40";
const primary = "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-background disabled:opacity-40";
type Attribute = (typeof ATTRIBUTE_NAMES)[number];
type Draft = { id?: string; name: string; color: string; size: string; model: string; barcode: string; cost_price: number; sale_price: number; low_stock_threshold: number };
type Profile = { id?: string; name: string; sku: string; category: string; subcategory: string; cost_price: number; sale_price: number; low_stock_threshold: number; description: string; images: string[]; is_published: boolean; allow_negative_stock: boolean; attributes: Attribute[] };
type AttributeRow = { attribute: Attribute | ""; values: string[]; entry: string };
const blankRows = (): AttributeRow[] => Array.from({ length: 3 }, () => ({ attribute: "", values: [], entry: "" }));

export function ItemProfiles() {
  const [data, setData] = useState<InventorySnapshot>({ items: [], variants: [], movements: [] });
  const [taxonomy, setTaxonomy] = useState<TaxonomySnapshot>({ departments: [], categories: [], subcategories: [] });
  const [values, setValues] = useState<{ attribute: string; value: string }[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null); const [rows, setRows] = useState(blankRows);
  const [drafts, setDrafts] = useState<Draft[]>([]); const [manualCode, setManualCode] = useState(false); const [customBarcodes, setCustomBarcodes] = useState(false);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(""); const [search, setSearch] = useState(""); const [notice, setNotice] = useState("");
  useEffect(() => { Promise.all([fetch("/api/admin/inventory"), fetch("/api/admin/taxonomy")]).then(async ([inventoryResponse, taxonomyResponse]) => {
    const inventory = await inventoryResponse.json(), tax = await taxonomyResponse.json();
    if (!inventoryResponse.ok || !taxonomyResponse.ok) throw new Error(inventory.error || tax.error);
    setData(inventory); setTaxonomy(tax); setValues(tax.attributeValues ?? []);
  }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const category = taxonomy.categories.find((entry) => entry.id === profile?.category);
  const subcategory = taxonomy.subcategories.find((entry) => entry.id === profile?.subcategory);
  function open(item?: InventoryItem) {
    setError(""); setNotice(""); setCustomBarcodes(false);
    const firstSub = taxonomy.subcategories[0];
    if (!item && !firstSub) { setError("Create a category and subcategory before creating an item."); return; }
    const variants = item ? data.variants.filter((variant) => variant.item_id === item.id) : [];
    const next: Profile = item ? { ...item, category: item.category_id, subcategory: item.subcategory_id } : {
      name: "", sku: "", category: firstSub.category_id, subcategory: firstSub.id, cost_price: 0, sale_price: 0,
      low_stock_threshold: 5, description: "", images: [], is_published: false, allow_negative_stock: false, attributes: [],
    };
    setProfile(next); setManualCode(Boolean(item)); setDrafts(variants.map(toDraft));
    setRows(blankRows().map((row, index) => { const attribute = next.attributes[index]; return attribute ? { attribute, entry: "", values: [...new Set(variants.map((variant) => variant[attribute.toLowerCase() as "color" | "size" | "model"]).filter((value) => value && value !== "Default" && value !== "One Size"))] } : row; }));
  }
  function addValue(index: number, value: string) {
    const trimmed = value.trim(); if (!trimmed) return;
    setRows((current) => current.map((row, at) => at === index ? { ...row, entry: "", values: row.values.some((entry) => entry.toLowerCase() === trimmed.toLowerCase()) ? row.values : [...row.values, trimmed] } : row));
  }
  function generate() {
    if (!profile) return;
    setError("");
    try {
      if (!profile.name.trim()) throw new Error("Enter the item name first.");
      const attributes: Partial<Record<Attribute, string[]>> = {};
      for (const row of rows) if (row.attribute) { if (!row.values.length) throw new Error(`Choose at least one ${row.attribute.toLowerCase()} value.`); attributes[row.attribute] = row.values; }
      const generated = generateVariantDrafts(profile.name, attributes, profile.cost_price, profile.sale_price, profile.low_stock_threshold);
      const existing = new Map(drafts.map((draft) => [variantKey(draft), draft]));
      const result = generated.map((draft) => existing.get(variantKey(draft)) ?? { ...draft, barcode: "" });
      for (const draft of drafts.filter((entry) => entry.id)) if (!result.some((entry) => entry.id === draft.id)) result.push(draft);
      if (result.length > 500) throw new Error("An item can have at most 500 variants.");
      setDrafts(result); setProfile({ ...profile, attributes: rows.map((row) => row.attribute).filter((attribute): attribute is Attribute => Boolean(attribute)) });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not generate variants."); }
  }
  async function upload(files: FileList | null) {
    if (!profile || !files?.length) return;
    setError("");
    if (profile.images.length + files.length > 5) { setError("An item can have at most five images."); return; }
    if ([...files].some((file) => file.size > 1024 * 1024)) { setError("Each image must be no more than 1 MB."); return; }
    setUploading(true);
    try { const form = new FormData(); for (const file of files) form.append("images", file);
      const response = await fetch("/api/admin/item-images", { method: "POST", body: form }); const result = await response.json();
      if (!response.ok) throw new Error(result.error); setProfile((current) => current ? { ...current, images: [...current.images, ...result.images] } : current);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); } finally { setUploading(false); }
  }
  async function save() {
    if (!profile) return; setError("");
    const attributes = rows.map((row) => row.attribute).filter((attribute): attribute is Attribute => Boolean(attribute));
    if (attributes.length && !drafts.length) { setError("Generate the selected attribute combinations before saving."); return; }
    let variants = drafts;
    if (!variants.length) variants = generateVariantDrafts(profile.name, {}, profile.cost_price, profile.sale_price, profile.low_stock_threshold).map((draft) => ({ ...draft, barcode: "" }));
    setBusy(true);
    try {
      const response = await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...profile, sku: manualCode ? profile.sku : "", attributes, variants, action: profile.id ? "update_item" : "create_item" }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setData(result); setProfile(null); setNotice("Item profile saved. Add stock in Inventory and publish it in Catalog.");
      const tax = await fetch("/api/admin/taxonomy").then((res) => res.json()); setValues(tax.attributeValues ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the profile."); } finally { setBusy(false); }
  }
  const filtered = data.items.filter((item) => `${item.name} ${item.sku} ${item.category} ${item.subcategory}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="mx-auto max-w-7xl space-y-5 p-6 lg:p-8"><div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold">Item profiles</h1><p className="mt-1 text-sm text-muted-foreground">Create the parent item, then generate its color, size and model variants.</p></div><button className={primary} disabled={loading} onClick={() => open()}>New item profile</button></div>
    {!profile && error && <p role="alert" className="text-sm text-red-500">{error}</p>}{notice && <p role="status" className="text-sm text-green-600">{notice}</p>}
    <input className={`${input} max-w-md`} aria-label="Search items" placeholder="Search name, item code or category" value={search} onChange={(e) => setSearch(e.target.value)} />
    <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="border-b border-border bg-muted/30"><tr>{["Item", "Category / Subcategory", "Initial cost / Sale", "Variants", "Actions"].map((name) => <th key={name} className="p-4">{name}</th>)}</tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-border"><td className="p-4"><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.sku}</p></td><td className="p-4">{item.category} / {item.subcategory}</td><td className="p-4">৳{item.cost_price} / ৳{item.sale_price}</td><td className="p-4">{data.variants.filter((variant) => variant.item_id === item.id).length}</td><td className="p-4"><div className="flex gap-2"><button className={button} onClick={() => open(item)}>Edit profile</button><Link className={button} href={`/admin/inventory?item=${item.id}`}>Stock</Link></div></td></tr>)}</tbody></table>{!filtered.length && <p className="p-8 text-center text-sm text-muted-foreground">{loading ? "Loading…" : "Create your categories first, then add an item profile."}</p>}</div>
    {profile && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3" onClick={(e) => { if (e.target === e.currentTarget && !busy && !uploading) setProfile(null); }}><div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-border bg-card p-5 lg:p-7" onKeyDown={(e) => { if (e.key === "Escape" && !busy && !uploading) setProfile(null); }}>
      <div className="mb-5 flex justify-between gap-3"><h2 id="profile-title" className="text-xl font-bold">{profile.id ? "Edit item profile" : "New item profile"}</h2><button className={button} type="button" disabled={busy || uploading} onClick={() => setProfile(null)}>Close</button></div>
      {error && <p role="alert" className="mb-4 text-sm text-red-500">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); void save(); }}><fieldset disabled={busy || uploading} className="space-y-6"><div className="grid gap-4 md:grid-cols-3">
        <Field label="Item name"><input autoFocus required maxLength={120} className={input} value={profile.name} onChange={(e) => { setDrafts((current) => current.map((draft) => draft.name === variantName(profile.name, draft) ? { ...draft, name: variantName(e.target.value, draft) } : draft)); setProfile({ ...profile, name: e.target.value }); }} /></Field>
        <Field label="Category"><select required className={input} value={profile.category} onChange={(e) => setProfile({ ...profile, category: e.target.value, subcategory: taxonomy.subcategories.find((entry) => entry.category_id === e.target.value)?.id ?? "" })}>{taxonomy.categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
        <Field label="Subcategory"><select required className={input} value={profile.subcategory} onChange={(e) => setProfile({ ...profile, subcategory: e.target.value })}><option value="">Choose subcategory</option>{taxonomy.subcategories.filter((entry) => entry.category_id === profile.category).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
        <Field label="Item code"><input className={input} required={manualCode} maxLength={60} readOnly={!manualCode || Boolean(profile.id && drafts.some((draft) => draft.id))} placeholder={`${subcategory?.code_prefix ?? ""} + 5 digits (assigned on save)`} value={profile.sku} onChange={(e) => setProfile({ ...profile, sku: e.target.value.toUpperCase() })} /><span className="mt-1 flex gap-2 text-xs"><input aria-label="Enter code manually" type="checkbox" checked={manualCode} disabled={Boolean(profile.id)} onChange={(e) => setManualCode(e.target.checked)} /> Enter code manually</span></Field>
        <Field label="Initial purchase cost (৳)"><input required type="number" min={0} max={10000000} step="0.01" className={input} value={profile.cost_price} onChange={(e) => setProfile({ ...profile, cost_price: e.target.valueAsNumber, sale_price: profile.sale_price === profile.cost_price ? e.target.valueAsNumber : profile.sale_price })} /></Field>
        <Field label="Initial selling price (৳)"><input required type="number" min={0} max={10000000} step="0.01" className={input} value={profile.sale_price} onChange={(e) => setProfile({ ...profile, sale_price: e.target.valueAsNumber })} /></Field>
        <Field label="Initial reorder level"><input required type="number" min={0} max={1000000} step={1} className={input} value={profile.low_stock_threshold} onChange={(e) => setProfile({ ...profile, low_stock_threshold: e.target.valueAsNumber })} /></Field>
        <Field label="Allow sales with negative stock"><select className={input} value={profile.allow_negative_stock ? "yes" : "no"} onChange={(e) => setProfile({ ...profile, allow_negative_stock: e.target.value === "yes" })}><option value="no">No</option><option value="yes">Yes</option></select></Field>
        <div className="self-center text-xs text-muted-foreground">{category?.name} → {subcategory?.name}<br />Website selection, offers and featuring are managed in Catalog.</div>
      </div>
      <Field label="Description"><textarea className={input} rows={3} maxLength={5000} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} /></Field>
      <section className="space-y-3"><h3 className="font-semibold">Item images ({profile.images.length}/5)</h3><p className="text-xs text-muted-foreground">JPG, PNG, WebP or AVIF. Maximum 1 MB per image. Images are compressed and served in smaller sizes.</p><div className="flex flex-wrap gap-3">{profile.images.map((image) => <div key={image} className="w-24"><img src={itemImage(image, 160)} alt="Item preview" className="h-24 w-24 rounded-lg object-cover" /><button type="button" className={`${button} mt-1 w-full`} onClick={() => setProfile({ ...profile, images: profile.images.filter((entry) => entry !== image) })}>Remove</button></div>)}</div><input aria-label="Upload item images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={profile.images.length >= 5 || uploading} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} /></section>
      <section className="rounded-xl border border-border p-4"><div className="mb-4 flex flex-wrap justify-between gap-3"><h3 className="text-lg font-semibold">Item variants</h3><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={customBarcodes} onChange={(e) => setCustomBarcodes(e.target.checked)} /> Customize child barcodes</label></div>
        <div className="space-y-4">{rows.map((row, index) => <div key={index} className="grid gap-3 md:grid-cols-[180px_1fr]"><select aria-label={`Attribute ${index + 1}`} className={`${input} self-start`} value={row.attribute} onChange={(e) => { setRows((current) => current.map((entry, at) => at === index ? { attribute: e.target.value as Attribute | "", values: [], entry: "" } : entry)); }}><option value="">No attribute</option>{ATTRIBUTE_NAMES.filter((attribute) => !rows.some((entry, at) => at !== index && entry.attribute === attribute)).map((attribute) => <option key={attribute}>{attribute}</option>)}</select><div className="space-y-2"><div className="flex flex-wrap gap-2">{row.values.map((value) => <button type="button" key={value} className="rounded-lg bg-muted px-2 py-1 text-xs" onClick={() => setRows((current) => current.map((entry, at) => at === index ? { ...entry, values: entry.values.filter((text) => text !== value) } : entry))}>{value} ×</button>)}</div><div className="flex gap-2"><input className={input} disabled={!row.attribute} value={row.entry} placeholder={`Select or add ${row.attribute.toLowerCase() || "an attribute"}`} list={`attribute-${index}`} onChange={(e) => setRows((current) => current.map((entry, at) => at === index ? { ...entry, entry: e.target.value } : entry))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(index, row.entry); } }} /><datalist id={`attribute-${index}`}>{values.filter((entry) => entry.attribute === row.attribute).map((entry) => <option key={entry.value} value={entry.value} />)}</datalist><button type="button" className={button} disabled={!row.attribute} onClick={() => addValue(index, row.entry)}>+ Add new</button></div>{row.attribute && <details className="text-xs"><summary className="cursor-pointer">See all {row.attribute.toLowerCase()} values</summary><div className="mt-2 flex flex-wrap gap-2">{values.filter((entry) => entry.attribute === row.attribute).map((entry) => <button key={entry.value} type="button" className={button} onClick={() => addValue(index, entry.value)}>{entry.value}</button>)}</div></details>}</div></div>)}</div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={primary} onClick={generate}>Generate variants</button><button type="button" className={button} disabled={!drafts.length} onClick={() => setDrafts((current) => current.map((draft) => ({ ...draft, cost_price: profile.cost_price, sale_price: profile.sale_price, low_stock_threshold: profile.low_stock_threshold })))}>Apply initial prices / reorder level to all</button></div>
      </section>
      {drafts.length > 0 && <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-muted/40"><tr>{["Variant name", "Purchase rate", "Selling rate", "Child barcode", "Reorder level", "Actions"].map((name) => <th key={name} className="p-3">{name}</th>)}</tr></thead><tbody>{drafts.map((draft, index) => <tr key={draft.id || variantKey(draft)} className="border-t border-border"><td className="p-2"><input required maxLength={300} className={input} value={draft.name} onChange={(e) => setDrafts((current) => current.map((entry, at) => at === index ? { ...entry, name: e.target.value } : entry))} /><p className="mt-1 text-xs text-muted-foreground">{[draft.color !== "Default" && draft.color, draft.model, draft.size !== "One Size" && draft.size].filter(Boolean).join(" / ") || "Standard item"}</p></td>{(["cost_price", "sale_price"] as const).map((key) => <td key={key} className="p-2"><input aria-label={key === "cost_price" ? "Variant purchase rate" : "Variant selling rate"} required type="number" min={0} max={10000000} step="0.01" className={input} value={draft[key]} onChange={(e) => setDrafts((current) => current.map((entry, at) => at === index ? { ...entry, [key]: e.target.valueAsNumber } : entry))} /></td>)}<td className="p-2"><input aria-label="Child barcode" maxLength={80} className={input} readOnly={!customBarcodes} placeholder={profile.sku ? `${profile.sku}-${String(index + 1).padStart(3, "0")} (auto)` : "Assigned from parent code on save"} value={draft.barcode} onChange={(e) => setDrafts((current) => current.map((entry, at) => at === index ? { ...entry, barcode: e.target.value } : entry))} /></td><td className="p-2"><input aria-label="Variant reorder level" required type="number" min={0} max={1000000} step={1} className={input} value={draft.low_stock_threshold} onChange={(e) => setDrafts((current) => current.map((entry, at) => at === index ? { ...entry, low_stock_threshold: e.target.valueAsNumber } : entry))} /></td><td className="p-2"><button type="button" className={button} disabled={Boolean(draft.id)} title={draft.id ? "Saved variants retain their stock history" : "Remove generated row"} onClick={() => setDrafts((current) => current.filter((_, at) => at !== index))}>Remove</button></td></tr>)}</tbody></table></div>}
      <p className="text-xs text-muted-foreground">Generated variants start with zero stock. Their child barcodes remain linked to the parent item code.</p>
      </fieldset><div className="mt-6 flex justify-end gap-3"><button type="button" className={button} disabled={busy || uploading} onClick={() => setProfile(null)}>Cancel</button><button className={primary} disabled={busy || uploading}>{uploading ? "Uploading…" : busy ? "Saving…" : "Save item profile"}</button></div></form>
    </div></div>}
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1"><span className="text-sm font-medium">{label}</span>{children}</label>; }
function variantKey(variant: { color: string; size: string; model: string }) { return JSON.stringify([variant.color, variant.size, variant.model].map((value) => value.toLowerCase())); }
function toDraft(variant: InventoryVariant): Draft { return { id: variant.id, name: variant.name, color: variant.color, size: variant.size, model: variant.model, barcode: variant.barcode, cost_price: variant.cost_price, sale_price: variant.sale_price, low_stock_threshold: variant.low_stock_threshold }; }
