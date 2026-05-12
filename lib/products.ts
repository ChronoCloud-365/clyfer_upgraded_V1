import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .eq("in_stock", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error || !data) return FALLBACK_PRODUCTS;
    return data as Product[];
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function getAllProducts(params?: {
  category?: string;
  search?: string;
  sort?: string;
}): Promise<Product[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("products").select("*").eq("in_stock", true);
    if (params?.category && params.category !== "all") {
      query = query.eq("category", params.category);
    }
    if (params?.search) {
      query = query.ilike("name", `%${params.search}%`);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error || !data) return FALLBACK_PRODUCTS;
    return data as Product[];
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
    return data as Product;
  } catch {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
}

// ── Fallback static data ─────────────────────────────────────────

export const FALLBACK_PRODUCTS: Product[] = [];
