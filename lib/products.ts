import "server-only";
import { createClient } from "./supabase/server";
import type { Product } from "@/types";
import { getInventoryDatabase, readInventory } from "./inventory/database";
import { inventoryProducts } from "./inventory/products";

function getInventoryProducts() {
  const state = readInventory(getInventoryDatabase());
  return inventoryProducts(state.items, state.variants);
}

export async function getAllProducts(params?: {
  category?: string;
  subcategory?: string;
  search?: string;
  sort?: string;
}) {
  const local = getInventoryProducts().filter((product) =>
    (!params?.category || params.category === "all" || product.category === params.category)
    && (!params?.subcategory || product.subcategory === params.subcategory)
    && (!params?.search || product.name.toLowerCase().includes(params.search.toLowerCase())));
  try {
    const supabase = await createClient();
    let query = supabase.from("products").select("*").eq("in_stock", true);
    if (params?.category && params.category !== "all") {
      query = query.eq("category", params.category);
    }
    if (params?.subcategory) {
      query = query.eq("subcategory", params.subcategory);
    }
    if (params?.search) {
      query = query.ilike("name", `%${params.search}%`);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error || !data) return local;
    return [...local, ...data as Product[]];
  } catch {
    return local;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const local = getInventoryProducts().find((product) => product.slug === slug);
  if (local) return local;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return data as Product;
  } catch {
    return null;
  }
}
