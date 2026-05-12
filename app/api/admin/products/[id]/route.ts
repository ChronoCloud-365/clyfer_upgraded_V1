import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
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
  const { id } = await params;
  const body = await request.json();

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Products PUT Error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath("/shop");
    revalidatePath(`/shop/${data.slug}`);
    revalidatePath("/");
    return NextResponse.json({ product: data });
  } catch (e: unknown) {
    console.error("[Products PUT Exception]:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("[Products DELETE Error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath("/shop");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[Products DELETE Exception]:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
