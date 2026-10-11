"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Boxes, Plus, RefreshCw, Search, X } from "lucide-react";
import { INVENTORY_CATEGORIES, inventoryValue } from "@/lib/inventory/model";
import type { InventoryItem, InventorySnapshot, InventoryVariant } from "@/lib/inventory/model";

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";
const buttonClass = "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-background disabled:opacity-50";
const secondaryClass = "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50";
type ItemDraft = { name: string; sku: string; category: string; subcategory: string; low_stock_threshold: number;
  cost_price: number; sale_price: number; description: string; images: string[]; is_published: boolean };
const newItem = (): ItemDraft => ({ name: "", sku: "", category: "Formal Shoes", subcategory: "Oxford", low_stock_threshold: 5,
  cost_price: 0, sale_price: 0, description: "", images: [], is_published: false });
const money = (value: number) => `৳${value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InventoryPage() {
  const [data, setData] = useState<InventorySnapshot>({ items: [], variants: [], movements: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [itemForm, setItemForm] = useState<ItemDraft | null>(null);
  const [editId, setEditId] = useState("");
  const [variantForm, setVariantForm] = useState<{ color: string; size: string; quantity: number } | null>(null);
  const [movementForm, setMovementForm] = useState<{ variant: InventoryVariant; kind: "receive" | "issue" | "count"; quantity: number; reason: string; request_id: string } | null>(null);
  const [tab, setTab] = useState<"stock" | "history">("stock");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/inventory", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load inventory.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load inventory."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    async function initialLoad() {
      try {
        const response = await fetch("/api/admin/inventory", { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load inventory.");
        if (!controller.signal.aborted) setData(result);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load inventory.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void initialLoad();
    const timer = setInterval(() => void initialLoad(), 10000);
    window.addEventListener("focus", initialLoad);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", initialLoad); };
  }, []);

  async function save(command: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(command) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save inventory.");
      setData(result); setItemForm(null); setVariantForm(null); setMovementForm(null);
      setNotice("Inventory saved.");
      if (command.action === "create_item") {
        const item = result.items.find((entry: InventoryItem) => entry.sku === String(command.sku).trim().toUpperCase());
        if (item) setSelectedId(item.id);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save inventory."); }
    finally { setBusy(false); }
  }

  const selected = data.items.find((item) => item.id === selectedId);
  const itemVariants = data.variants.filter((variant) => variant.item_id === selectedId);
  const filtered = data.items.filter((item) => {
    const variants = data.variants.filter((variant) => variant.item_id === item.id);
    const total = variants.reduce((sum, variant) => sum + variant.quantity, 0);
    return (!category || item.category === category) && (!subcategory || item.subcategory === subcategory)
      && `${item.name} ${item.sku}`.toLowerCase().includes(search.toLowerCase())
      && (stockFilter === "all" || (stockFilter === "out" ? total === 0
        : variants.some((variant) => variant.quantity <= item.low_stock_threshold)));
  });
  const total = data.variants.reduce((sum, variant) => sum + variant.quantity, 0);
  const valuation = inventoryValue(data.items, data.variants);
  const selectedValue = selected ? inventoryValue([selected], itemVariants) : { cost: 0, selling: 0 };
  const low = data.variants.filter((variant) => variant.quantity <= (data.items.find((item) => item.id === variant.item_id)?.low_stock_threshold ?? 0)).length;
  const history = data.movements.filter((movement) => !selected || itemVariants.some((variant) => variant.id === movement.variant_id));
  const close = () => { if (!busy) { setItemForm(null); setVariantForm(null); setMovementForm(null); setError(""); } };
  const modalOpen = Boolean(itemForm || variantForm || movementForm);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Boxes className="size-6 text-brand" /> Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create item profiles with prices, then add stock by color and size.</p></div>
        <div className="flex gap-2"><button className={secondaryClass} onClick={() => void load()} disabled={loading || busy} aria-label="Refresh inventory"><RefreshCw className="size-4" /></button>
          <button className={buttonClass} onClick={() => { setEditId(""); setItemForm(newItem()); setError(""); }} disabled={loading || busy}><Plus className="mr-1 inline size-4" /> New item profile</button></div>
      </div>
      {!modalOpen && error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-500">{notice}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[ ["Items", data.items.length], ["Color / size variants", data.variants.length], ["Units in stock", total], ["Low / out-of-stock variants", low] ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{Number(value).toLocaleString()}</p></div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4"><p className="text-xs text-muted-foreground">Total inventory cost</p><p className="mt-2 text-2xl font-semibold">{money(valuation.cost)}</p><p className="mt-1 text-xs text-muted-foreground">Available quantity × current unit purchase cost</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Total selling value</p><p className="mt-2 text-2xl font-semibold">{money(valuation.selling)}</p><p className="mt-1 text-xs text-muted-foreground">Available quantity × current selling price</p></div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="relative"><span className="sr-only">Search name or SKU</span><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input className={`${inputClass} pl-9`} placeholder="Search name or SKU" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <select className={inputClass} aria-label="Filter category" value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }}><option value="">All categories</option>{INVENTORY_CATEGORIES.map((entry) => <option key={entry.name}>{entry.name}</option>)}</select>
        <select className={inputClass} aria-label="Filter subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} disabled={!category}><option value="">All subcategories</option>{INVENTORY_CATEGORIES.find((entry) => entry.name === category)?.subcategories.map((name) => <option key={name}>{name}</option>)}</select>
        <select className={inputClass} aria-label="Filter stock status" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}><option value="all">All stock levels</option><option value="low">Has low-stock variants</option><option value="out">Out of stock</option></select>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[340px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Items ({filtered.length})</div>
          {loading ? <p className="p-5 text-sm text-muted-foreground">Loading inventory…</p> : filtered.length === 0 ? <div className="p-5 text-sm text-muted-foreground">{data.items.length ? "No items match these filters." : "Create your first item, then add its colors and sizes."}</div> :
            <div className="max-h-[620px] overflow-y-auto">{filtered.map((item) => {
              const quantity = data.variants.filter((variant) => variant.item_id === item.id).reduce((sum, variant) => sum + variant.quantity, 0);
              return <button key={item.id} onClick={() => setSelectedId(item.id)} className={`flex w-full justify-between gap-3 border-b border-border p-4 text-left last:border-0 hover:bg-muted ${selectedId === item.id ? "bg-brand/10" : ""}`}>
                <div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.sku} · {item.subcategory}</p><p className="mt-1 text-xs text-muted-foreground">{item.is_published ? "Published" : "Draft"} · Sell {money(item.sale_price)}</p></div><span className="shrink-0 text-sm font-semibold">{quantity} <span className="text-xs font-normal text-muted-foreground">units</span></span>
              </button>;
            })}</div>}
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-card p-5">
          {selected ? <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{selected.name}</h2><p className="text-sm text-muted-foreground">{selected.category} → {selected.subcategory}</p><p className="mt-1 text-xs text-muted-foreground">SKU: {selected.sku} · Low stock: {selected.low_stock_threshold} units per variant</p></div>
            <div className="flex gap-2"><button className={secondaryClass} onClick={() => { setEditId(selected.id); setItemForm({ ...selected }); setError(""); }}>Edit item</button><button className={buttonClass} onClick={() => { setVariantForm({ color: "", size: selected.category === "Wallets & Accessories" ? "One Size" : "", quantity: 0 }); setError(""); }}>Add color / size</button></div></div>
            : <p className="mb-5 text-sm text-muted-foreground">Select an item to manage its stock, or view all recent movements below.</p>}
          {selected && <div className="mb-5 rounded-xl bg-muted/40 p-4 text-sm"><div className="grid grid-cols-2 gap-3"><p>Unit cost <strong className="block">{money(selected.cost_price)}</strong></p><p>Selling price <strong className="block">{money(selected.sale_price)}</strong></p><p>Stock at cost <strong className="block">{money(selectedValue.cost)}</strong></p><p>Stock at selling price <strong className="block">{money(selectedValue.selling)}</strong></p></div>{selected.is_published && <a className="mt-3 inline-block text-brand underline" href={`/shop/inventory-${selected.id}`} target="_blank" rel="noreferrer">View on website</a>}</div>}
          <div className="mb-4 flex gap-2"><button className={tab === "stock" ? buttonClass : secondaryClass} onClick={() => setTab("stock")}>Stock by variant</button><button className={tab === "history" ? buttonClass : secondaryClass} onClick={() => setTab("history")}>Movement history</button>{selected && <button className={secondaryClass} onClick={() => setSelectedId("")}>Clear selection</button>}</div>
          <div className="overflow-x-auto">
            {tab === "stock" ? !selected ? <p className="py-8 text-center text-sm text-muted-foreground">Choose an item from the list.</p> : itemVariants.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Add a color and size combination with its opening stock.</p> :
              <table className="w-full whitespace-nowrap text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="p-3">Color</th><th className="p-3">Size</th><th className="p-3">Available</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{itemVariants.map((variant) => <tr key={variant.id} className="border-b border-border last:border-0"><td className="p-3">{variant.color}</td><td className="p-3">{variant.size}</td><td className="p-3 font-semibold">{variant.quantity}</td><td className={`p-3 text-xs ${variant.quantity <= selected.low_stock_threshold ? "text-amber-500" : "text-green-500"}`}>{variant.quantity === 0 ? "Out of stock" : variant.quantity <= selected.low_stock_threshold ? "Low stock" : "In stock"}</td><td className="p-3"><button className={secondaryClass} onClick={() => { setMovementForm({ variant, kind: "receive", quantity: 1, reason: "", request_id: crypto.randomUUID() }); setError(""); }}>Update stock</button></td></tr>)}</tbody></table>
              : history.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No stock movements yet.</p> : <><p className="mb-3 text-xs text-muted-foreground">Latest 200 movements. Counts and receipts are kept as an audit trail.</p><table className="w-full whitespace-nowrap text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="p-3">Date / Item</th><th className="p-3">Variant</th><th className="p-3">Movement</th><th className="p-3">Before → After</th><th className="p-3">Reason</th></tr></thead><tbody>{history.map((movement) => <tr key={movement.id} className="border-b border-border last:border-0"><td className="p-3"><p>{movement.item_name}</p><p className="text-xs text-muted-foreground">{new Date(movement.created_at).toLocaleString()}</p></td><td className="p-3">{movement.color} / {movement.size}</td><td className="p-3"><span className="capitalize">{movement.kind}</span> <span className={movement.delta < 0 ? "text-red-400" : "text-green-500"}>{movement.delta > 0 ? "+" : ""}{movement.delta}</span></td><td className="p-3">{movement.before_quantity} → {movement.after_quantity}</td><td className="max-w-56 whitespace-normal p-3">{movement.reason}</td></tr>)}</tbody></table></>}
          </div>
        </div>
      </div>
      {modalOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="inventory-form-title" className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between"><h2 id="inventory-form-title" className="text-lg font-bold">{itemForm ? editId ? "Edit item" : "New inventory item" : variantForm ? "Add color and size" : "Update stock"}</h2><button aria-label="Close form" className={secondaryClass} onClick={close} disabled={busy}><X className="size-4" /></button></div>
          {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
          <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault();
            if (itemForm) void save({ action: editId ? "update_item" : "create_item", ...itemForm, images: itemForm.images.map((url) => url.trim()).filter(Boolean), ...(editId ? { id: editId } : {}) });
            else if (variantForm) void save({ action: "add_variant", item_id: selectedId, ...variantForm });
            else if (movementForm) void save({ action: "stock", variant_id: movementForm.variant.id, kind: movementForm.kind, quantity: movementForm.quantity, expected_quantity: movementForm.variant.quantity, reason: movementForm.reason, request_id: movementForm.request_id });
          }}>
            <fieldset disabled={busy} className="space-y-4">
              {itemForm && <>
                <Field label="Item name"><input autoFocus required maxLength={120} className={inputClass} value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /></Field>
                <Field label="Item SKU / code"><input required maxLength={60} className={inputClass} placeholder="e.g. OXF-001" value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="Purchase cost (৳ / unit)"><input required type="number" min={0} max={10000000} step="0.01" className={inputClass} value={itemForm.cost_price} onChange={(e) => setItemForm({ ...itemForm, cost_price: e.target.valueAsNumber })} /></Field><Field label="Selling price (৳ / unit)"><input required type="number" min={itemForm.is_published ? 0.01 : 0} max={10000000} step="0.01" className={inputClass} value={itemForm.sale_price} onChange={(e) => setItemForm({ ...itemForm, sale_price: e.target.valueAsNumber })} /></Field></div>
                <Field label="Category"><select className={inputClass} value={itemForm.category} onChange={(e) => { const entry = INVENTORY_CATEGORIES.find((item) => item.name === e.target.value)!; setItemForm({ ...itemForm, category: entry.name, subcategory: entry.subcategories[0] }); }}>{INVENTORY_CATEGORIES.map((entry) => <option key={entry.name}>{entry.name}</option>)}</select></Field>
                <Field label="Subcategory"><select className={inputClass} value={itemForm.subcategory} onChange={(e) => setItemForm({ ...itemForm, subcategory: e.target.value })}>{INVENTORY_CATEGORIES.find((entry) => entry.name === itemForm.category)?.subcategories.map((name) => <option key={name}>{name}</option>)}</select></Field>
                <Field label="Low stock alert threshold (per color / size)"><input required type="number" min={0} max={1000000} step={1} className={inputClass} value={itemForm.low_stock_threshold} onChange={(e) => setItemForm({ ...itemForm, low_stock_threshold: e.target.valueAsNumber })} /></Field>
                <Field label="Description"><textarea maxLength={5000} rows={3} className={inputClass} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} /></Field>
                <Field label="Product image URLs (one per line, up to 10)"><textarea rows={3} className={inputClass} placeholder="https://…" value={itemForm.images.join("\n")} onChange={(e) => setItemForm({ ...itemForm, images: e.target.value.split("\n") })} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={itemForm.is_published} onChange={(e) => setItemForm({ ...itemForm, is_published: e.target.checked })} /> Publish on website</label>
                <p className="text-xs text-muted-foreground">Purchase cost stays private. Published items show their selling price and live color / size stock on the website.</p>
              </>}
              {variantForm && <>
                <p className="text-sm text-muted-foreground">{selected?.name}</p>
                <Field label="Color"><input autoFocus required maxLength={120} className={inputClass} placeholder="e.g. Red" value={variantForm.color} onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })} /></Field>
                <Field label="Size"><input required maxLength={30} className={inputClass} placeholder="e.g. 38, 42, XL or One Size" value={variantForm.size} onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })} /></Field>
                <Field label="Opening stock"><input required type="number" min={0} max={1000000} step={1} className={inputClass} value={variantForm.quantity} onChange={(e) => setVariantForm({ ...variantForm, quantity: e.target.valueAsNumber })} /></Field>
                <p className="text-xs text-muted-foreground">Add each available size separately. This quantity belongs only to this color and size.</p>
              </>}
              {movementForm && <>
                <p className="text-sm">{selected?.name} · {movementForm.variant.color} / {movementForm.variant.size}<br /><span className="text-muted-foreground">Current stock: {movementForm.variant.quantity} units</span></p>
                <Field label="Movement type"><select className={inputClass} value={movementForm.kind} onChange={(e) => { const kind = e.target.value as "receive" | "issue" | "count"; setMovementForm({ ...movementForm, kind, quantity: kind === "count" ? movementForm.variant.quantity : 1, request_id: crypto.randomUUID() }); }}><option value="receive">Receive stock / return</option><option value="issue">Issue stock / sale / damage</option><option value="count">Set physical stock count</option></select></Field>
                <Field label={movementForm.kind === "count" ? "Actual quantity counted" : "Number of units"}><input required type="number" min={movementForm.kind === "count" ? 0 : 1} max={1000000} step={1} className={inputClass} value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.valueAsNumber, request_id: crypto.randomUUID() })} /></Field>
                <Field label="Reason / reference"><input required maxLength={300} className={inputClass} placeholder="e.g. Purchase receipt PO-001" value={movementForm.reason} onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value, request_id: crypto.randomUUID() })} /></Field>
                <p className="text-xs text-muted-foreground">Every update records the reason and the stock before and after it.</p>
              </>}
            </fieldset>
            <div className="flex justify-end gap-2 pt-2"><button type="button" className={secondaryClass} onClick={close} disabled={busy}>Cancel</button><button className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}</label>;
}
