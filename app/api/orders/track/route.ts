import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getInventoryDatabase } from "@/lib/inventory/database";
import { readInventoryOrders } from "@/lib/inventory/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone")?.trim();

  if (!phone || phone.length < 5) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  try {
    const local = readInventoryOrders(getInventoryDatabase()).filter((order) => order.phone.split(" / ").includes(phone)).map(({ id, product_name, size, color, quantity, total_price, status, created_at, notes }) => ({ id, product_name, size, color, quantity, total_price, status, created_at, notes }));
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ orders: local });
    const supabase = getAdminClient();
    // Match phone even if stored as "01XXXXXXXXX / 01XXXXXXXXX" (dual phone format)
    const { data, error } = await supabase
      .from("orders")
      .select("id, product_name, size, color, quantity, total_price, status, created_at, notes")
      .ilike("phone", `%${phone}%`)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ orders: [...local, ...data ?? []].sort((a, b) => b.created_at.localeCompare(a.created_at)) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
