import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { SiteConfigKey } from "@/types";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_CATALOG,
  DEFAULT_FEATURED,
  DEFAULT_FOOTER,
  DEFAULT_HERO,
  DEFAULT_LEGAL,
  DEFAULT_NAVBAR_SETTINGS,
  DEFAULT_SHIPPING,
  DEFAULT_STORE_LOCATOR,
} from "@/lib/config-defaults";
import {
  catalogConfigSchema,
  featuredConfigSchema,
  footerConfigSchema,
  heroConfigSchema,
  legalConfigSchema,
  navbarSettingsSchema,
  shippingConfigSchema,
  storeLocatorConfigSchema,
} from "@/lib/config-schemas";

const DEFAULTS: Record<SiteConfigKey, unknown> = {
  navbar: DEFAULT_NAVBAR_SETTINGS,
  catalog: DEFAULT_CATALOG,
  hero: DEFAULT_HERO,
  featured: DEFAULT_FEATURED,
  footer: DEFAULT_FOOTER,
  shipping: DEFAULT_SHIPPING,
  terms: DEFAULT_LEGAL,
  privacy: DEFAULT_LEGAL,
  cookies: DEFAULT_LEGAL,
  store_locator: DEFAULT_STORE_LOCATOR,
};

const VALID_KEYS: SiteConfigKey[] = [
  "navbar", "catalog", "hero", "featured", "footer",
  "shipping", "terms", "privacy", "cookies", "store_locator",
];

const SCHEMAS: Partial<Record<SiteConfigKey, { safeParse: (v: unknown) => { success: boolean; error?: { message: string } } }>> = {
  navbar: navbarSettingsSchema,
  catalog: catalogConfigSchema,
  hero: heroConfigSchema,
  featured: featuredConfigSchema,
  footer: footerConfigSchema,
  shipping: shippingConfigSchema,
  terms: legalConfigSchema,
  privacy: legalConfigSchema,
  cookies: legalConfigSchema,
  store_locator: storeLocatorConfigSchema,
};

function validateValue(key: SiteConfigKey, value: unknown) {
  const schema = SCHEMAS[key];
  if (!schema) return { success: true as const };
  const result = schema.safeParse(value);
  if (!result.success) {
    return { success: false as const, message: result.error?.message ?? "Invalid config payload" };
  }
  return { success: true as const };
}

function validateCatalogConsistency(value: unknown) {
  const parsed = catalogConfigSchema.safeParse(value);
  if (!parsed.success) return { success: false as const, message: parsed.error.message };

  const categoryIds = new Set<string>();
  const subcategoryIds = new Set<string>();
  for (const category of parsed.data.categories) {
    if (categoryIds.has(category.id)) {
      return { success: false as const, message: `Duplicate category id: ${category.id}` };
    }
    categoryIds.add(category.id);
    for (const sub of category.subcategories) {
      if (subcategoryIds.has(sub.id)) {
        return { success: false as const, message: `Duplicate subcategory id: ${sub.id}` };
      }
      subcategoryIds.add(sub.id);
    }
  }
  return { success: true as const };
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const key = body?.key as SiteConfigKey;
  const value = body?.value;

  if (!VALID_KEYS.includes(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const validation = validateValue(key, value);
  if (!validation.success) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();

    if (key === "catalog") {
      const catalogValidation = validateCatalogConsistency(value);
      if (!catalogValidation.success) {
        return NextResponse.json({ error: catalogValidation.message }, { status: 400 });
      }
    }

    if (key === "navbar") {
      const { data: catalogData } = await supabase.from("site_config").select("value").eq("key", "catalog").maybeSingle();
      const catalogValue = catalogData?.value ?? DEFAULT_CATALOG;
      const catalogValidation = validateCatalogConsistency(catalogValue);
      const navbarValidation = navbarSettingsSchema.safeParse(value);

      if (!catalogValidation.success) {
        return NextResponse.json({ error: catalogValidation.message }, { status: 400 });
      }
      if (!navbarValidation.success) {
        return NextResponse.json({ error: navbarValidation.error.message }, { status: 400 });
      }

      const catalogIds = new Set(
        catalogConfigSchema.parse(catalogValue).categories.map((c) => c.id)
      );
      const invalid = navbarValidation.data.categoryIds.find((id) => !catalogIds.has(id));
      if (invalid) {
        return NextResponse.json({ error: `Unknown category: ${invalid}` }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from("site_config")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    revalidatePath("/");
    revalidatePath("/shop", "layout");
    revalidatePath("/terms");
    revalidatePath("/privacy");
    revalidatePath("/cookies");

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const key = request.nextUrl.searchParams.get("key") as SiteConfigKey;
  if (!VALID_KEYS.includes(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) return NextResponse.json({ value: DEFAULTS[key] });
    return NextResponse.json({ value: data.value });
  } catch {
    return NextResponse.json({ value: DEFAULTS[key] });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
