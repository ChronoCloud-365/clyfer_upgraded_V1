import { createClient } from "@/lib/supabase/server";
import type {
  NavbarConfig,
  HeroConfig,
  FeaturedConfig,
  FooterConfig,
  SiteConfigKey,
} from "@/types";

// Re-export defaults from client-safe module
export {
  DEFAULT_NAVBAR,
  DEFAULT_HERO,
  DEFAULT_FEATURED,
  DEFAULT_FOOTER,
} from "@/lib/config-defaults";

import {
  DEFAULT_NAVBAR,
  DEFAULT_HERO,
  DEFAULT_FEATURED,
  DEFAULT_FOOTER,
} from "@/lib/config-defaults";

const DEFAULTS = {
  navbar: DEFAULT_NAVBAR,
  hero: DEFAULT_HERO,
  featured: DEFAULT_FEATURED,
  footer: DEFAULT_FOOTER,
} satisfies Record<SiteConfigKey, unknown>;

// ── Server-side fetch helpers ─────────────────────────────────────

async function fetchConfig<T>(key: SiteConfigKey, fallback: T): Promise<T> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", key)
      .single();
    if (error || !data) return fallback;
    return data.value as T;
  } catch {
    return fallback;
  }
}

export const getNavbarConfig = () =>
  fetchConfig<NavbarConfig>("navbar", DEFAULT_NAVBAR);

export const getHeroConfig = () =>
  fetchConfig<HeroConfig>("hero", DEFAULT_HERO);

export const getFeaturedConfig = () =>
  fetchConfig<FeaturedConfig>("featured", DEFAULT_FEATURED);

export const getFooterConfig = () =>
  fetchConfig<FooterConfig>("footer", DEFAULT_FOOTER);
