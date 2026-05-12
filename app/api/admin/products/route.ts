import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const search = request.nextUrl.searchParams.get("search");
  const featured = request.nextUrl.searchParams.get("featured");

  try {
    const supabase = await createClient();
    let query = supabase.from("products").select("*");

    if (category && category !== "all") query = query.eq("category", category);
    if (featured === "true") query = query.eq("is_featured", true);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data ?? [] });
  } catch {
    return NextResponse.json({ products: [] });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .insert(body)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/shop");
    revalidatePath("/");
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
