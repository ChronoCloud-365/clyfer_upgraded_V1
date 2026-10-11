import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { getInventoryDatabase, InventoryError } from "@/lib/inventory/database";
import { readInventoryOrders, updateInventoryOrderStatus } from "@/lib/inventory/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const status = request.nextUrl.searchParams.get("status");
  const local = readInventoryOrders(getInventoryDatabase()).filter((order) => !status || order.status === status);
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ orders: local });
  try {
    const supabase = getAdminClient();
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ orders: [...local, ...data ?? []].sort((a, b) => b.created_at.localeCompare(a.created_at)) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const db = getInventoryDatabase();
  if (db.prepare("SELECT id FROM inventory_orders WHERE id=?").get(parsed.data.id)) {
    try {
      updateInventoryOrderStatus(db, parsed.data.id, parsed.data.status);
      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json({ error: error instanceof InventoryError ? error.message : "Could not update the order." }, { status: error instanceof InventoryError ? error.status : 500 });
    }
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
