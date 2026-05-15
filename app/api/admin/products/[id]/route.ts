import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { productWriteSchema } from "@/lib/config-schemas";
import { DEFAULT_CATALOG } from "@/lib/config-defaults";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCatalogCategories() {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "catalog")
    .maybeSingle();

  return (
    data?.value?.categories?.length ? data.value.categories : DEFAULT_CATALOG.categories
  ) as typeof DEFAULT_CATALOG.categories;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ product: data });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();

  const parsed = productWriteSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    const { data: existingProduct, error: existingError } = await supabase
      .from("products")
      .select("category, subcategory")
      .eq("id", id)
      .single();

    if (existingError || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const catalogCategories = await getCatalogCategories();
    const effectiveCategory = parsed.data.category ?? existingProduct.category;
    const category = catalogCategories.find((item) => item.id === effectiveCategory);

    if (!category) {
      return NextResponse.json({ error: "Unknown category selected" }, { status: 400 });
    }

    const effectiveSubcategory =
      parsed.data.subcategory !== undefined ? parsed.data.subcategory : existingProduct.subcategory ?? null;
    if (effectiveSubcategory) {
      const subcategoryExists = category.subcategories.some(
        (subcategory) => subcategory.id === effectiveSubcategory
      );
      if (!subcategoryExists) {
        return NextResponse.json({ error: "Unknown subcategory selected" }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("products")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath("/shop");
    revalidatePath(`/shop/${data.slug}`);
    revalidatePath("/");
    return NextResponse.json({ product: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath("/shop");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
