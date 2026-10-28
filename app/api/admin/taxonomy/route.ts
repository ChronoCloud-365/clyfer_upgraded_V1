import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getInventoryDatabase, InventoryError } from "@/lib/inventory/database";
import { executeTaxonomyCommand, readTaxonomy } from "@/lib/inventory/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  const denied = requireAdminSession(request); if (denied) return denied;
  const db = getInventoryDatabase();
  return NextResponse.json({ ...readTaxonomy(db), attributeValues: db.prepare("SELECT * FROM item_attribute_values ORDER BY attribute,value COLLATE NOCASE").all() }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  const denied = requireAdminSession(request); if (denied) return denied;
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const db = getInventoryDatabase(); executeTaxonomyCommand(db, await request.json());
    return NextResponse.json(readTaxonomy(db));
  } catch (error) {
    return NextResponse.json({ error: error instanceof InventoryError ? error.message : "Could not save taxonomy." }, { status: error instanceof InventoryError ? error.status : 400 });
  }
}
