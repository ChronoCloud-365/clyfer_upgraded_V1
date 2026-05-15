import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { SiteConfigKey } from "@/types";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  DEFAULT_CATALOG,
  DEFAULT_FEATURED,
  DEFAULT_FOOTER,
  DEFAULT_HERO,
  DEFAULT_LEGAL,
  DEFAULT_NAVBAR_SETTINGS,
  DEFAULT_SHIPPING,
} from "@/lib/config-defaults";
import {
  catalogConfigSchema,
  featuredConfigSchema,
  footerConfigSchema,
  heroConfigSchema,
  legalConfigSchema,
  navbarSettingsSchema,
  shippingConfigSchema,
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
};

const VALID_KEYS: SiteConfigKey[] = [
  "navbar",
  "catalog",
  "hero",
  "featured",
  "footer",
  "shipping",
  "terms",
  "privacy",
  "cookies",
];

const SCHEMAS: Partial<Record<SiteConfigKey, { safeParse: (value: unknown) => { success: boolean; error?: { message: string } } }>> = {
  navbar: navbarSettingsSchema,
  catalog: catalogConfigSchema,
  hero: heroConfigSchema,
  featured: featuredConfigSchema,
  footer: footerConfigSchema,
  shipping: shippingConfigSchema,
  terms: legalConfigSchema,
  privacy: legalConfigSchema,
  cookies: legalConfigSchema,
};

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function validateValue(key: SiteConfigKey, value: unknown) {
  const schema = SCHEMAS[key];
  if (!schema) return { success: true as const };
  const result = schema.safeParse(value);
  if (!result.success) {
    return {
      success: false as const,
      message: result.error?.message ?? "Invalid config payload",
    };
  }
  return { success: true as const };
}

function validateCatalogConsistency(value: unknown) {
  const parsed = catalogConfigSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false as const, message: parsed.error.message };
  }

  const categoryIds = new Set<string>();
  const subcategoryIds = new Set<string>();

  for (const category of parsed.data.categories) {
    if (categoryIds.has(category.id)) {
      return {
        success: false as const,
        message: `Duplicate category id found: ${category.id}`,
      };
    }
    categoryIds.add(category.id);

    for (const subcategory of category.subcategories) {
      if (subcategoryIds.has(subcategory.id)) {
        return {
          success: false as const,
          message: `Duplicate subcategory id found: ${subcategory.id}`,
        };
      }
      subcategoryIds.add(subcategory.id);
    }
  }

  return { success: true as const };
}

async function getStoredConfig<T>(supabase: ReturnType<typeof getAdminClient>, key: SiteConfigKey) {
  const { data } = await supabase.from("site_config").select("value").eq("key", key).maybeSingle();
  return data?.value as T | undefined;
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
      const catalogValue =
        (await getStoredConfig<unknown>(supabase, "catalog")) ?? DEFAULT_CATALOG;
      const catalogValidation = validateCatalogConsistency(catalogValue);
      const navbarValidation = navbarSettingsSchema.safeParse(value);

      if (!catalogValidation.success) {
        return NextResponse.json({ error: catalogValidation.message }, { status: 400 });
      }

      if (!navbarValidation.success) {
        return NextResponse.json({ error: navbarValidation.error.message }, { status: 400 });
      }

      const catalogIds = new Set(
        catalogConfigSchema.parse(catalogValue).categories.map((category) => category.id)
      );
      const invalidCategoryId = navbarValidation.data.categoryIds.find((categoryId) => !catalogIds.has(categoryId));

      if (invalidCategoryId) {
        return NextResponse.json(
          { error: `Unknown category selected: ${invalidCategoryId}` },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("site_config")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    if (error || !data) {
      return NextResponse.json({ value: DEFAULTS[key] });
    }

    return NextResponse.json({ value: data.value });
  } catch {
    return NextResponse.json({ value: DEFAULTS[key] });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
