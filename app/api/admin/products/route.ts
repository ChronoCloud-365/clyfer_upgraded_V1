import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { catalogConfigSchema, productWriteSchema } from "@/lib/config-schemas";
import { DEFAULT_CATALOG } from "@/lib/config-defaults";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isMissingSubcategoryColumnError(message: string) {
  const text = message.toLowerCase();
  return text.includes("could not find the 'subcategory' column") || text.includes("column \"subcategory\" does not exist");
}

async function getCatalogIds() {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "catalog")
    .maybeSingle();

  const parsed = catalogConfigSchema.safeParse(data?.value ?? DEFAULT_CATALOG);
  return parsed.success
    ? parsed.data.categories
    : DEFAULT_CATALOG.categories;
}

function validateProductCatalogRelationships(
  product: { category: string; subcategory?: string | null },
  categories: Awaited<ReturnType<typeof getCatalogIds>>
) {
  const category = categories.find((item) => item.id === product.category);
  if (!category) {
    return { success: false as const, message: "Unknown category selected" };
  }

  if (product.subcategory) {
    const subcategoryExists = category.subcategories.some(
      (subcategory) => subcategory.id === product.subcategory
    );
    if (!subcategoryExists) {
      return { success: false as const, message: "Unknown subcategory selected" };
    }
  }

  return { success: true as const };
}

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const category = request.nextUrl.searchParams.get("category");
  const search = request.nextUrl.searchParams.get("search");
  const featured = request.nextUrl.searchParams.get("featured");

  try {
    const supabase = getAdminClient();
    let query = supabase.from("products").select("*");

    if (category && category !== "all") query = query.eq("category", category);
    if (featured === "true") query = query.eq("is_featured", true);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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
      if (isMissingSubcategoryColumnError(error.message)) {
        const { subcategory, ...fallbackPayload } = parsed.data;
        const retry = await supabase
          .from("products")
          .insert(fallbackPayload)
          .select()
          .single();

        if (retry.error) {
          return NextResponse.json({ error: retry.error.message }, { status: 500 });
        }
        revalidatePath("/shop");
        revalidatePath("/");
        return NextResponse.json({ product: retry.data }, { status: 201 });
      }
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
