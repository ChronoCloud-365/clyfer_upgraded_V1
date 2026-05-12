import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { SiteConfigKey } from "@/types";
import {
  DEFAULT_NAVBAR,
  DEFAULT_HERO,
  DEFAULT_FEATURED,
  DEFAULT_FOOTER,
  DEFAULT_SHIPPING,
  DEFAULT_LEGAL,
} from "@/lib/config-defaults";

const DEFAULTS: Record<SiteConfigKey, unknown> = {
  navbar: DEFAULT_NAVBAR,
  hero: DEFAULT_HERO,
  featured: DEFAULT_FEATURED,
  footer: DEFAULT_FOOTER,
  shipping: DEFAULT_SHIPPING,
  terms: DEFAULT_LEGAL,
  privacy: DEFAULT_LEGAL,
  cookies: DEFAULT_LEGAL,
};

// Use service role client for admin operations
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const { key, value } = await request.json();
  if (!key || !DEFAULTS[key as SiteConfigKey]) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("site_config")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      console.error("[SiteConfig POST Error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate public pages
    revalidatePath("/");
    revalidatePath("/shop", "layout");
    revalidatePath("/terms");
    revalidatePath("/privacy");
    revalidatePath("/cookies");
    
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[SiteConfig POST Exception]:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key") as SiteConfigKey;
  if (!key || !DEFAULTS[key]) {
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
  const { key, value } = await request.json();
  if (!key || !DEFAULTS[key as SiteConfigKey]) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("site_config")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      console.error("[SiteConfig PUT Error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate affected public pages
    revalidatePath("/");
    revalidatePath("/shop");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[SiteConfig PUT Exception]:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
