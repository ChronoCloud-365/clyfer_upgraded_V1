import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { productWriteSchema } from "@/lib/config-schemas";
import { DEFAULT_CATALOG } from "@/lib/config-defaults";

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
    const catalogCategories = await getCatalogCategories();
    const effectiveCategory = parsed.data.category;
    if (!effectiveCategory) {
      return NextResponse.json({ error: "Category is required for update" }, { status: 400 });
    }
    const category = catalogCategories.find((item) => item.id === effectiveCategory);
    if (!category) {
      return NextResponse.json({ error: "Unknown category selected" }, { status: 400 });
    }

    const effectiveSubcategory = parsed.data.subcategory ?? null;
    if (effectiveSubcategory) {
      const exists = category.subcategories.some((s) => s.id === effectiveSubcategory);
      if (!exists) {
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/shop");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
