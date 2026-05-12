import { createClient } from "./supabase/server";
import { 
  DEFAULT_NAVBAR, 
  DEFAULT_HERO, 
  DEFAULT_FOOTER, 
  DEFAULT_SHIPPING,
  DEFAULT_FEATURED,
  DEFAULT_LEGAL
} from "./config-defaults";
import type { 
  NavbarConfig, 
  HeroConfig, 
  FooterConfig, 
  ShippingConfig, 
  FeaturedConfig,
  LegalConfig,
  SiteConfigKey 
} from "@/types";

/**
 * SERVER-ONLY site configuration fetching
 */
export async function getSiteConfig<T>(key: SiteConfigKey, defaultValue: T): Promise<T> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return defaultValue;
    return (data.value as T) ?? defaultValue;
  } catch (err) {
    console.error(`[getSiteConfig] Error fetching ${key}:`, err);
    return defaultValue;
  }
}

export async function getNavbarConfig(): Promise<NavbarConfig> {
  return getSiteConfig<NavbarConfig>("navbar", DEFAULT_NAVBAR);
}

export async function getHeroConfig(): Promise<HeroConfig> {
  return getSiteConfig<HeroConfig>("hero", DEFAULT_HERO);
}

export async function getFooterConfig(): Promise<FooterConfig> {
  return getSiteConfig<FooterConfig>("footer", DEFAULT_FOOTER);
}

export async function getShippingConfig(): Promise<ShippingConfig> {
  return getSiteConfig<ShippingConfig>("shipping", DEFAULT_SHIPPING);
}

export async function getFeaturedConfig(): Promise<FeaturedConfig> {
  return getSiteConfig<FeaturedConfig>("featured", DEFAULT_FEATURED);
}

export async function getTermsConfig(): Promise<LegalConfig> {
  return getSiteConfig<LegalConfig>("terms", DEFAULT_LEGAL);
}

export async function getPrivacyConfig(): Promise<LegalConfig> {
  return getSiteConfig<LegalConfig>("privacy", DEFAULT_LEGAL);
}

export async function getCookiesConfig(): Promise<LegalConfig> {
  return getSiteConfig<LegalConfig>("cookies", DEFAULT_LEGAL);
}
