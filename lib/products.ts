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

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Air Clyfer Pro",
    slug: "air-clyfer-pro",
    brand: "Clyfer",
    price: 8500,
    original_price: 11000,
    description: "Performance sneaker with responsive cushioning and breathable mesh upper.",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"],
    category: "running",
    sizes: [40, 41, 42, 43, 44, 45],
    colors: [{ name: "Red", hex: "#ef4444" }],
    tags: ["featured", "new"],
    rating: 4.9,
    review_count: 312,
    in_stock: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Urban Stride X",
    slug: "urban-stride-x",
    brand: "Clyfer",
    price: 6800,
    description: "Everyday casual with premium suede finish.",
    images: ["https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80"],
    category: "casual",
    sizes: [40, 41, 42, 43, 44],
    colors: [{ name: "White", hex: "#ffffff" }],
    tags: ["bestseller"],
    rating: 4.7,
    review_count: 198,
    in_stock: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Phantom Elite",
    slug: "phantom-elite",
    brand: "Clyfer",
    price: 12000,
    description: "Limited edition sports with carbon fiber sole.",
    images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80"],
    category: "limited",
    sizes: [41, 42, 43, 44],
    colors: [{ name: "Black", hex: "#000000" }],
    tags: ["limited", "exclusive"],
    rating: 5.0,
    review_count: 54,
    in_stock: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Swift Runner V2",
    slug: "swift-runner-v2",
    brand: "Clyfer",
    price: 7200,
    original_price: 9000,
    description: "Track-ready runner with breathable mesh upper.",
    images: ["https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80"],
    category: "sports",
    sizes: [39, 40, 41, 42, 43, 44, 45],
    colors: [{ name: "Blue", hex: "#3b82f6" }],
    tags: ["sale", "popular"],
    rating: 4.8,
    review_count: 427,
    in_stock: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
