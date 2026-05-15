import { createClient } from "./supabase/server";
import { 
  DEFAULT_NAVBAR, 
  DEFAULT_NAVBAR_SETTINGS,
  DEFAULT_HERO, 
  DEFAULT_FOOTER, 
  DEFAULT_SHIPPING,
  DEFAULT_FEATURED,
  DEFAULT_LEGAL,
  DEFAULT_CATALOG
} from "./config-defaults";
import type { 
  NavbarConfig, 
  NavbarSettings,
  HeroConfig, 
  FooterConfig, 
  ShippingConfig, 
  FeaturedConfig,
  LegalConfig,
  SiteConfigKey,
  CatalogConfig
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
  const [navbarSettings, catalog] = await Promise.all([
    getSiteConfig<NavbarSettings>("navbar", DEFAULT_NAVBAR_SETTINGS),
    getCatalogConfig(),
  ]);

  const resolvedCategories =
    navbarSettings.categoryIds.length > 0
      ? navbarSettings.categoryIds
          .map((id) => catalog.categories.find((category) => category.id === id))
          .filter(Boolean)
          .map((category) => ({
            id: category!.id,
            label: category!.label,
            href: category!.href,
            subcategories: category!.subcategories.map((sub) => ({
              label: sub.label,
              href: sub.href,
              desc: sub.desc,
            })),
          }))
      : catalog.categories.map((category) => ({
          id: category.id,
          label: category.label,
          href: category.href,
          subcategories: category.subcategories.map((sub) => ({
            label: sub.label,
            href: sub.href,
            desc: sub.desc,
          })),
        }));

  return {
    categories: resolvedCategories.length ? resolvedCategories : DEFAULT_NAVBAR.categories,
    links: navbarSettings.links,
  };
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

export async function getCatalogConfig(): Promise<CatalogConfig> {
  return getSiteConfig<CatalogConfig>("catalog", DEFAULT_CATALOG);
}
