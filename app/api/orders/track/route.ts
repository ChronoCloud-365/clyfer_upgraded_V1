import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone")?.trim();

  if (!phone || phone.length < 5) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    // Match phone even if stored as "01XXXXXXXXX / 01XXXXXXXXX" (dual phone format)
    const { data, error } = await supabase
      .from("orders")
      .select("id, product_name, size, color, quantity, total_price, status, created_at, notes")
      .ilike("phone", `%${phone}%`)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ orders: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
