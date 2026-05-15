import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_LEGAL,
  DEFAULT_SHIPPING,
} from "@/lib/config-defaults";
import type { SiteConfigKey } from "@/types";

const PUBLIC_KEYS: SiteConfigKey[] = ["shipping", "terms", "privacy", "cookies"];

const DEFAULTS: Partial<Record<SiteConfigKey, unknown>> = {
  shipping: DEFAULT_SHIPPING,
  terms: DEFAULT_LEGAL,
  privacy: DEFAULT_LEGAL,
  cookies: DEFAULT_LEGAL,
};

function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key") as SiteConfigKey;
  if (!PUBLIC_KEYS.includes(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ value: DEFAULTS[key] });
    }

    return NextResponse.json({ value: data.value });
  } catch {
    return NextResponse.json({ value: DEFAULTS[key] });
  }
}
