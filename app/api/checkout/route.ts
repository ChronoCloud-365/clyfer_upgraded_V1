import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { orderWriteSchema } from "@/lib/config-schemas";
import { inventoryCheckoutSchema } from "@/lib/inventory/model";
import { getInventoryDatabase, InventoryError } from "@/lib/inventory/database";
import { placeInventoryCheckout } from "@/lib/inventory/orders";
import { getShippingConfig } from "@/lib/site-config-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 }); }
  if (body && typeof body === "object" && "items" in body) {
    const validated = inventoryCheckoutSchema.safeParse(body);
    if (!validated.success) return NextResponse.json({ error: "Check the order details and quantities." }, { status: 400 });
    try {
      const shipping = await getShippingConfig();
      const deliveryCost = validated.data.shipping_area === "inside" ? shipping.insideDhaka : shipping.outsideDhaka;
      const orders = placeInventoryCheckout(getInventoryDatabase(), validated.data, Math.round(deliveryCost * 100));
      return NextResponse.json({ orders }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: error instanceof InventoryError ? error.message : "Could not place the order. Please try again." }, { status: error instanceof InventoryError ? error.status : 500 });
    }
  }
  const parsed = orderWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  // Inventory items must use the transactional cart endpoint; never bypass stock checks.
  if (parsed.data.product_id && getInventoryDatabase().prepare("SELECT id FROM inventory_items WHERE id=?").get(parsed.data.product_id)) {
    return NextResponse.json({ error: "Please refresh checkout to place this order." }, { status: 409 });
  }

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({ ...parsed.data, status: "pending" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
