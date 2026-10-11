import { NextRequest, NextResponse } from "next/server";
import { getInventoryDatabase, readInventory } from "@/lib/inventory/database";
import { inventoryProducts } from "@/lib/inventory/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  try {
    const state = readInventory(getInventoryDatabase());
    const products = inventoryProducts(state.items, state.variants);
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const product = products.find((entry) => entry.id === id);
      if (!product) return NextResponse.json({ error: "This item is unavailable." }, { status: 404 });
      return NextResponse.json({ product }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Stock updates are temporarily unavailable." }, { status: 503 });
  }
}
