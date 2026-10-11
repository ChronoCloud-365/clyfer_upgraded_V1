import type { Product } from "../../types";
import type { InventoryItem, InventoryVariant } from "./model";
import { categoryId } from "./model";

const colorHex: Record<string, string> = { red: "#dc2626", black: "#171717", brown: "#854d0e", blue: "#2563eb", white: "#f5f5f5", tan: "#d2b48c", green: "#16a34a", grey: "#737373", gray: "#737373", navy: "#172554" };

// Construct the public product explicitly: purchase costs never leave the admin API.
export function inventoryProducts(items: InventoryItem[], variants: InventoryVariant[]): Product[] {
  return items.filter((item) => item.is_published).map((item) => {
    const stock = variants.filter((variant) => variant.item_id === item.id);
    const colors = [...new Map(stock.map((variant) => [variant.color.toLowerCase(), variant.color])).values()];
    const sizes = new Map<string, string>();
    for (const variant of stock) if (!sizes.has(variant.size.toLowerCase())) sizes.set(variant.size.toLowerCase(), variant.size);
    return {
      id: item.id, name: item.name, slug: `inventory-${item.id}`, brand: "Clyfar Fashion",
      price: item.sale_price, description: item.description,
      images: item.images.length ? item.images : ["/product-placeholder.svg"],
      category: categoryId(item.category), subcategory: categoryId(item.subcategory),
      sizes: [...sizes.values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      colors: colors.map((name) => ({ name, hex: colorHex[name.toLowerCase()] || "#737373" })),
      tags: [], rating: 0, review_count: 0, in_stock: stock.some((variant) => variant.quantity > 0),
      is_featured: false, created_at: item.created_at, updated_at: item.created_at,
      inventory_managed: true,
      variants: stock.map(({ id, color, size, quantity }) => ({ id, color, size: sizes.get(size.toLowerCase())!, quantity })),
    };
  });
}
