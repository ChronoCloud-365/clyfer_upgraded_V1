import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { executeInventoryCommand, getInventoryDatabase, InventoryError, readInventory } from "@/lib/inventory/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json(readInventory(getInventoryDatabase()), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not read inventory. Check the server database configuration." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  try {
    const db = getInventoryDatabase();
    executeInventoryCommand(db, body);
    return NextResponse.json(readInventory(db));
  } catch (error) {
    return NextResponse.json({ error: error instanceof InventoryError ? error.message : "Inventory update failed." },
      { status: error instanceof InventoryError ? error.status : 500 });
  }
}
