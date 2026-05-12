import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SiteConfigKey } from "@/types";
import {
  DEFAULT_NAVBAR,
  DEFAULT_HERO,
  DEFAULT_FEATURED,
  DEFAULT_FOOTER,
} from "@/lib/site-config";

const DEFAULTS: Record<SiteConfigKey, unknown> = {
  navbar: DEFAULT_NAVBAR,
  hero: DEFAULT_HERO,
  featured: DEFAULT_FEATURED,
  footer: DEFAULT_FOOTER,
};

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key") as SiteConfigKey;
  if (!key || !DEFAULTS[key]) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
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
    const supabase = await createClient();
    const { error } = await supabase
      .from("site_config")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate affected public pages
    revalidatePath("/");
    revalidatePath("/shop");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
