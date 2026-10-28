import type { Product } from "../../types";
import type { InventoryItem, InventoryVariant } from "./model";
import { categoryId, effectivePrice } from "./model";

const colorHex: Record<string, string> = { red: "#dc2626", black: "#171717", brown: "#854d0e", blue: "#2563eb", white: "#f5f5f5", tan: "#d2b48c", green: "#16a34a", grey: "#737373", gray: "#737373", navy: "#172554" };

// Construct the public product explicitly: purchase costs never leave the admin API.
export function inventoryProducts(items: InventoryItem[], variants: InventoryVariant[], includeDrafts = false): Product[] {
  return items.filter((item) => includeDrafts || item.is_published).map((item) => {
    const stock = variants.filter((variant) => variant.item_id === item.id);
    const basePrice = stock.length ? Math.min(...stock.map((variant) => variant.sale_price)) : item.sale_price;
    const price = effectivePrice(basePrice, item);
    const colors = [...new Map(stock.map((variant) => [variant.color.toLowerCase(), variant.color])).values()];
    const sizes = new Map<string, string>();
    for (const variant of stock) if (!sizes.has(variant.size.toLowerCase())) sizes.set(variant.size.toLowerCase(), variant.size);
    return {
      id: item.id, name: item.name, slug: `inventory-${item.id}`, brand: "Clyfar Fashion",
      price, original_price: price < basePrice ? basePrice : undefined, description: item.description,
      images: item.images.length ? item.images : ["/product-placeholder.svg"],
      category: item.category_slug || categoryId(item.category), subcategory: item.subcategory_slug || categoryId(item.subcategory), department: item.department_slug,
      sizes: [...sizes.values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      colors: colors.map((name) => ({ name, hex: colorHex[name.toLowerCase()] || "#737373" })),
      tags: item.offer_percent > 0 ? ["offer"] : [], rating: 0, review_count: 0, in_stock: item.allow_negative_stock || stock.some((variant) => variant.quantity > 0),
      is_featured: item.is_featured, created_at: item.created_at, updated_at: item.created_at,
      inventory_managed: true,
      allow_negative_stock: item.allow_negative_stock, attributes: item.attributes,
      variants: stock.map((variant) => ({ id: variant.id, color: variant.color, size: sizes.get(variant.size.toLowerCase())!, model: variant.model, name: variant.name, barcode: variant.barcode,
        quantity: variant.quantity, price: effectivePrice(variant.sale_price, item), original_price: effectivePrice(variant.sale_price, item) < variant.sale_price ? variant.sale_price : undefined })),
    };
  });
}
