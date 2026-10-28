import { z } from "zod";

export const INVENTORY_CATEGORIES = [
  { name: "Formal Shoes", subcategories: ["Oxford", "Derby", "Brogue", "Formal Lace-Up"] },
  { name: "Loafers", subcategories: ["Penny", "Tassel", "Horsebit", "Classic"] },
  { name: "Casual Shoes", subcategories: ["Moccasin", "Slip-On", "Casual Lace-Up", "Driving"] },
  { name: "Boots", subcategories: ["Chelsea", "Chukka", "Ankle", "Lace-Up"] },
  { name: "Sandals & Slippers", subcategories: ["Open-Toe", "Closed-Toe", "Cross-Strap", "Slippers"] },
  { name: "Belts", subcategories: ["Formal Belts", "Casual Belts", "Reversible Belts"] },
  { name: "Wallets & Accessories", subcategories: ["Wallets", "Card Holders", "Bags"] },
];

const label = z.string().trim().min(1).max(120);
const quantity = z.number().int().min(0).max(1_000_000);
export const money = z.number().min(0).max(10_000_000).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001, "Use at most two decimal places.");
export const ATTRIBUTE_NAMES = ["Color", "Size", "Model"] as const;
export const variantDraftSchema = z.object({
  id: z.string().uuid().optional(), color: z.string().trim().max(120).default("Default"),
  size: z.string().trim().max(30).default("One Size"), model: z.string().trim().max(120).default(""),
  name: z.string().trim().max(300).optional(), barcode: z.string().trim().max(80).optional(),
  cost_price: money.optional(), sale_price: money.optional(), low_stock_threshold: quantity.optional(),
});
const itemFields = {
  name: label,
  sku: z.string().trim().max(60).regex(/^[a-zA-Z0-9-]*$/, "Item code can contain letters, numbers and hyphens.").transform((value) => value.toUpperCase()).default(""),
  category: label,
  subcategory: label,
  low_stock_threshold: quantity,
  cost_price: money.default(0),
  sale_price: money.optional(),
  description: z.string().trim().max(5000).default(""),
  images: z.array(z.string().refine((value) => /^https?:\/\//i.test(value) || /^\/api\/item-images\/[a-f0-9-]+\.webp$/.test(value), "Use an uploaded image or HTTP/HTTPS image URL.")).max(5).default([]),
  is_published: z.boolean().default(false),
  allow_negative_stock: z.boolean().default(false),
  attributes: z.array(z.enum(ATTRIBUTE_NAMES)).max(3).refine((values) => new Set(values).size === values.length, "Choose each attribute once.").default([]),
  variants: z.array(variantDraftSchema).max(500).optional(),
};

export const inventoryCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_item"), ...itemFields }),
  z.object({ action: z.literal("update_item"), id: z.string().uuid(), ...itemFields }),
  z.object({ action: z.literal("add_variant"), item_id: z.string().uuid(), color: label,
    size: z.string().trim().min(1).max(30), model: z.string().trim().max(120).default(""), quantity }),
  z.object({ action: z.literal("set_listing"), id: z.string().uuid(), is_published: z.boolean(), is_featured: z.boolean(),
    offer_percent: z.number().min(0).max(99), offer_start: z.string().datetime().nullable().default(null),
    offer_end: z.string().datetime().nullable().default(null) }).refine((value) => !value.offer_start || !value.offer_end || value.offer_end > value.offer_start, "Offer end must be after its start."),
  z.object({ action: z.literal("stock"), variant_id: z.string().uuid(),
    kind: z.enum(["receive", "issue", "count"]), quantity,
    expected_quantity: z.number().int().min(-1_000_000).max(1_000_000), reason: z.string().trim().min(1).max(300),
    request_id: z.string().uuid() }),
]);

export type InventoryCommand = z.infer<typeof inventoryCommandSchema>;
export interface InventoryItem {
  id: string; name: string; sku: string; category: string; subcategory: string;
  low_stock_threshold: number; created_at: string;
  cost_price: number; sale_price: number; description: string; images: string[]; is_published: boolean;
  category_id: string; subcategory_id: string; category_slug: string; subcategory_slug: string;
  department_id?: string | null; department_slug?: string | null;
  allow_negative_stock: boolean; attributes: (typeof ATTRIBUTE_NAMES)[number][];
  is_featured: boolean; offer_percent: number; offer_start: string | null; offer_end: string | null;
}
export interface InventoryVariant {
  id: string; item_id: string; color: string; size: string; model: string; quantity: number;
  name: string; barcode: string; cost_price: number; sale_price: number; low_stock_threshold: number;
}
export interface StockMovement {
  id: string; variant_id: string; kind: "opening" | "receive" | "issue" | "count";
  delta: number; before_quantity: number; after_quantity: number; reason: string;
  created_at: string; item_name: string; sku: string; color: string; size: string;
  model?: string; barcode?: string;
}
export interface InventorySnapshot {
  items: InventoryItem[]; variants: InventoryVariant[]; movements: StockMovement[];
  taxonomy?: TaxonomySnapshot;
}

export interface Department { id: string; name: string; slug: string }
export interface ItemCategory { id: string; name: string; slug: string; department_id: string | null; code: string }
export interface ItemSubcategory { id: string; category_id: string; name: string; slug: string; code_prefix: string }
export interface TaxonomySnapshot { departments: Department[]; categories: ItemCategory[]; subcategories: ItemSubcategory[] }
export const taxonomyCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save_department"), id: z.string().uuid().optional(), name: label }),
  z.object({ action: z.literal("save_category"), id: z.string().uuid().optional(), name: label, department_id: z.string().uuid().nullable().default(null), code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,4}$/) }),
  z.object({ action: z.literal("save_subcategory"), id: z.string().uuid().optional(), name: label, category_id: z.string().uuid(), code_prefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,6}$/) }),
  z.object({ action: z.literal("delete"), entity: z.enum(["department", "category", "subcategory"]), id: z.string().uuid() }),
]);

export function generateVariantDrafts(name: string, attributes: Partial<Record<(typeof ATTRIBUTE_NAMES)[number], string[]>>, cost: number, sale: number, threshold = 5) {
  if (!money.safeParse(cost).success || !money.safeParse(sale).success || !quantity.safeParse(threshold).success) throw new Error("Enter valid initial prices and a whole-number reorder level before generating variants.");
  let combinations = [{ color: "Default", size: "One Size", model: "" }];
  for (const attribute of ATTRIBUTE_NAMES) {
    const values = [...new Map((attributes[attribute] ?? []).map((value) => [value.trim().toLowerCase(), value.trim()])).values()].filter(Boolean);
    if (!values.length) continue;
    if (values.some((value) => value.length > (attribute === "Size" ? 30 : 120))) throw new Error("Attribute value is too long.");
    if (combinations.length * values.length > 500) throw new Error("Generate at most 500 variants at once.");
    const key = attribute.toLowerCase();
    combinations = combinations.flatMap((combination) => values.map((value) => ({ ...combination, [key]: value })));
  }
  return combinations.map((variant) => ({ ...variant, name: variantName(name, variant), cost_price: cost, sale_price: sale, low_stock_threshold: threshold }));
}
export function variantName(name: string, variant: { color: string; size: string; model?: string }) {
  return [name, variant.color !== "Default" ? variant.color : "", variant.model, variant.size !== "One Size" ? variant.size : ""].filter(Boolean).join("-");
}
export function effectivePrice(base: number, item: Pick<InventoryItem, "offer_percent" | "offer_start" | "offer_end">, now = new Date()) {
  const active = item.offer_percent > 0 && (!item.offer_start || now >= new Date(item.offer_start)) && (!item.offer_end || now <= new Date(item.offer_end));
  return active ? Math.round(base * (100 - item.offer_percent)) / 100 : base;
}

export function inventoryValue(items: InventoryItem[], variants: InventoryVariant[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  let cost = 0, selling = 0;
  for (const variant of variants) {
    const item = byId.get(variant.item_id);
    if (item) {
      cost += Math.round((variant.cost_price ?? item.cost_price) * 100) * variant.quantity;
      selling += Math.round((variant.sale_price ?? item.sale_price) * 100) * variant.quantity;
    }
  }
  return { cost: cost / 100, selling: selling / 100 };
}

export function categoryId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const inventoryCheckoutSchema = z.object({
  request_id: z.string().uuid(),
  customer_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(5).max(60),
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(1000).default(""),
  shipping_area: z.enum(["inside", "outside"]),
  items: z.array(z.object({
    product_id: z.string().uuid(), variant_id: z.string().uuid().optional(), color: label, size: z.union([z.string().trim().min(1).max(30), z.number().int().positive()]).transform(String), model: z.string().trim().max(120).default(""),
    quantity: z.number().int().min(1).max(1000), expected_price: money,
  })).min(1).max(100),
});

export function validateCategory(category: string, subcategory: string) {
  const parent = INVENTORY_CATEGORIES.find((entry) => entry.name === category);
  if (!parent || !parent.subcategories.includes(subcategory)) {
    throw new Error("Choose a subcategory belonging to the selected category.");
  }
}

export function stockAfter(before: number, kind: "receive" | "issue" | "count", amount: number, allowNegative = false) {
  if (!Number.isInteger(amount) || amount < 0 || amount > 1_000_000) throw new Error("Invalid quantity.");
  if (kind !== "count" && amount === 0) throw new Error("Enter a quantity greater than zero.");
  const after = kind === "count" ? amount : before + (kind === "receive" ? amount : -amount);
  if (after < 0 && !allowNegative) throw new Error("Insufficient stock for this color and size.");
  if (after < -1_000_000) throw new Error("Stock cannot be less than -1,000,000 units.");
  if (after > 1_000_000) throw new Error("Stock cannot exceed 1,000,000 units.");
  if (after === before) throw new Error("The stock count is already at this quantity.");
  return after;
}
