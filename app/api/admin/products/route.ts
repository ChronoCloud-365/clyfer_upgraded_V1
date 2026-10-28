import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { catalogConfigSchema, productWriteSchema } from "@/lib/config-schemas";
import { DEFAULT_CATALOG } from "@/lib/config-defaults";
import { getInventoryDatabase, readInventory } from "@/lib/inventory/database";
import { inventoryProducts } from "@/lib/inventory/products";

async function getCatalogIds() {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "catalog")
    .maybeSingle();

  const parsed = catalogConfigSchema.safeParse(data?.value ?? DEFAULT_CATALOG);
  return parsed.success ? parsed.data.categories : DEFAULT_CATALOG.categories;
}

function validateProductCatalogRelationships(
  product: { category: string; subcategory?: string | null },
  categories: Awaited<ReturnType<typeof getCatalogIds>>
) {
  const category = categories.find((item) => item.id === product.category);
  if (!category) return { success: false as const, message: "Unknown category selected" };

  if (product.subcategory) {
    const exists = category.subcategories.some((s) => s.id === product.subcategory);
    if (!exists) return { success: false as const, message: "Unknown subcategory selected" };
  }
  return { success: true as const };
}

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const category = request.nextUrl.searchParams.get("category");
  const search = request.nextUrl.searchParams.get("search");
  const featured = request.nextUrl.searchParams.get("featured");

  const state = readInventory(getInventoryDatabase());
  return NextResponse.json({ products: inventoryProducts(state.items, state.variants, true).filter((product) =>
    (!category || category === "all" || product.category === category) && (!search || product.name.toLowerCase().includes(search.toLowerCase())) && (featured !== "true" || product.is_featured)) });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const parsed = productWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const catalogCategories = await getCatalogIds();
  const catalogValidation = validateProductCatalogRelationships(parsed.data, catalogCategories);
  if (!catalogValidation.success) {
    return NextResponse.json({ error: catalogValidation.message }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("products")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath("/shop");
    revalidatePath("/");
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
