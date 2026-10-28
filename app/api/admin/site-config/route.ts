import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getInventoryDatabase } from "@/lib/inventory/database";
import { dynamicCatalog } from "@/lib/inventory/taxonomy";
import { getSiteConfig } from "@/lib/site-config-server";
import { DEFAULT_FEATURED, DEFAULT_FOOTER, DEFAULT_HERO, DEFAULT_LEGAL, DEFAULT_SHIPPING, DEFAULT_STORE_LOCATOR } from "@/lib/config-defaults";
import { featuredCategoriesSchema, featuredConfigSchema, footerConfigSchema, heroConfigSchema, legalConfigSchema, navbarSettingsSchema, shippingConfigSchema, storeLocatorConfigSchema } from "@/lib/config-schemas";
import type { SiteConfigKey } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const defaults = { navbar: { style: "classic" }, hero: DEFAULT_HERO, featured: DEFAULT_FEATURED, featured_categories: { categoryIds: [] }, footer: DEFAULT_FOOTER, shipping: DEFAULT_SHIPPING, terms: DEFAULT_LEGAL, privacy: DEFAULT_LEGAL, cookies: DEFAULT_LEGAL, store_locator: DEFAULT_STORE_LOCATOR };
const schemas = { navbar: navbarSettingsSchema, hero: heroConfigSchema, featured: featuredConfigSchema, featured_categories: featuredCategoriesSchema, footer: footerConfigSchema, shipping: shippingConfigSchema, terms: legalConfigSchema, privacy: legalConfigSchema, cookies: legalConfigSchema, store_locator: storeLocatorConfigSchema };
export async function GET(request: NextRequest) {
  const denied = requireAdminSession(request); if (denied) return denied;
  const key = request.nextUrl.searchParams.get("key") as keyof typeof defaults;
  if (String(key) === "catalog") return NextResponse.json({ value: dynamicCatalog(getInventoryDatabase()) });
  if (!Object.hasOwn(defaults, key)) return NextResponse.json({ error: "Invalid key." }, { status: 400 });
  return NextResponse.json({ value: await getSiteConfig(key as SiteConfigKey, defaults[key]) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  const denied = requireAdminSession(request); if (denied) return denied;
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json();
    const key = body.key as keyof typeof schemas;
    if (!Object.hasOwn(schemas, key)) return NextResponse.json({ error: "Manage departments, categories and subcategories in Categories." }, { status: 400 });
    const parsed = schemas[key].safeParse(body.value);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
    const db = getInventoryDatabase();
    if (key === "featured_categories") {
      const ids = featuredCategoriesSchema.parse(parsed.data).categoryIds;
      const catalog = dynamicCatalog(db);
      if (ids.some((id) => !catalog.categories.some((category) => category.id === id))) return NextResponse.json({ error: "Choose existing categories." }, { status: 400 });
    }
    db.prepare("INSERT INTO local_site_settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, JSON.stringify(parsed.data));
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Could not save settings." }, { status: 400 }); }
}
export const PUT = POST;
