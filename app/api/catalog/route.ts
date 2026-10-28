import { NextResponse } from "next/server";
import { getCatalogConfig, getNavbarConfig } from "@/lib/site-config-server";
export const dynamic = "force-dynamic";
export async function GET() {
  const [catalog, navbar] = await Promise.all([getCatalogConfig(), getNavbarConfig()]);
  return NextResponse.json({ catalog, navbar }, { headers: { "Cache-Control": "no-store" } });
}
