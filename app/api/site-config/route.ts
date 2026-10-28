import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LEGAL, DEFAULT_SHIPPING } from "@/lib/config-defaults";
import { getSiteConfig } from "@/lib/site-config-server";
export const dynamic = "force-dynamic";
const defaults = { shipping: DEFAULT_SHIPPING, terms: DEFAULT_LEGAL, privacy: DEFAULT_LEGAL, cookies: DEFAULT_LEGAL };
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key") as keyof typeof defaults;
  if (!Object.hasOwn(defaults, key)) return NextResponse.json({ error: "Invalid key." }, { status: 400 });
  return NextResponse.json({ value: await getSiteConfig(key, defaults[key]) }, { headers: { "Cache-Control": "no-store" } });
}
