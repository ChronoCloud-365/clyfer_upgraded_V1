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
const money = z.number().min(0).max(10_000_000).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001, "Use at most two decimal places.");
const itemFields = {
  name: label,
  sku: z.string().trim().min(1).max(60).transform((value) => value.toUpperCase()),
  category: label,
  subcategory: label,
  low_stock_threshold: quantity,
  cost_price: money.default(0),
  sale_price: money.default(0),
  description: z.string().trim().max(5000).default(""),
  images: z.array(z.string().url().refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS image URL.")).max(10).default([]),
  is_published: z.boolean().default(false),
};

export const inventoryCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_item"), ...itemFields }),
  z.object({ action: z.literal("update_item"), id: z.string().uuid(), ...itemFields }),
  z.object({ action: z.literal("add_variant"), item_id: z.string().uuid(), color: label,
    size: z.string().trim().min(1).max(30), quantity }),
  z.object({ action: z.literal("stock"), variant_id: z.string().uuid(),
    kind: z.enum(["receive", "issue", "count"]), quantity,
    expected_quantity: quantity, reason: z.string().trim().min(1).max(300),
    request_id: z.string().uuid() }),
]);

export type InventoryCommand = z.infer<typeof inventoryCommandSchema>;
export interface InventoryItem {
  id: string; name: string; sku: string; category: string; subcategory: string;
  low_stock_threshold: number; created_at: string;
  cost_price: number; sale_price: number; description: string; images: string[]; is_published: boolean;
}
export interface InventoryVariant {
  id: string; item_id: string; color: string; size: string; quantity: number;
}
export interface StockMovement {
  id: string; variant_id: string; kind: "opening" | "receive" | "issue" | "count";
  delta: number; before_quantity: number; after_quantity: number; reason: string;
  created_at: string; item_name: string; sku: string; color: string; size: string;
}
export interface InventorySnapshot {
  items: InventoryItem[]; variants: InventoryVariant[]; movements: StockMovement[];
}

export function inventoryValue(items: InventoryItem[], variants: InventoryVariant[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  let cost = 0, selling = 0;
  for (const variant of variants) {
    const item = byId.get(variant.item_id);
    if (item) {
      cost += Math.round(item.cost_price * 100) * variant.quantity;
      selling += Math.round(item.sale_price * 100) * variant.quantity;
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
    product_id: z.string().uuid(), color: label, size: z.union([z.string().trim().min(1).max(30), z.number().int().positive()]).transform(String),
    quantity: z.number().int().min(1).max(1000), expected_price: money,
  })).min(1).max(100),
});

export function validateCategory(category: string, subcategory: string) {
  const parent = INVENTORY_CATEGORIES.find((entry) => entry.name === category);
  if (!parent || !parent.subcategories.includes(subcategory)) {
    throw new Error("Choose a subcategory belonging to the selected category.");
  }
}

export function stockAfter(before: number, kind: "receive" | "issue" | "count", amount: number) {
  if (!Number.isInteger(amount) || amount < 0 || amount > 1_000_000) throw new Error("Invalid quantity.");
  if (kind !== "count" && amount === 0) throw new Error("Enter a quantity greater than zero.");
  const after = kind === "count" ? amount : before + (kind === "receive" ? amount : -amount);
  if (after < 0) throw new Error("Insufficient stock for this color and size.");
  if (after > 1_000_000) throw new Error("Stock cannot exceed 1,000,000 units.");
  if (after === before) throw new Error("The stock count is already at this quantity.");
  return after;
}
