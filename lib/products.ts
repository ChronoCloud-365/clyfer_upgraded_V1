import "server-only";
import type { Product } from "@/types";
import { getInventoryDatabase, readInventory } from "./inventory/database";
import { inventoryProducts } from "./inventory/products";
export async function getAllProducts(params?: { category?: string; subcategory?: string; department?: string; search?: string; sort?: string }) {
  const state = readInventory(getInventoryDatabase());
  return inventoryProducts(state.items, state.variants).filter((product) =>
    (!params?.category || params.category === "all" || product.category === params.category)
    && (!params?.subcategory || product.subcategory === params.subcategory)
    && (!params?.department || product.department === params.department)
    && (!params?.search || product.name.toLowerCase().includes(params.search.toLowerCase())));
}
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await getAllProducts()).find((product) => product.slug === slug) ?? null;
}
