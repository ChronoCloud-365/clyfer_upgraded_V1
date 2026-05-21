import { createClient } from "./supabase/server";
import {
  DEFAULT_NAVBAR,
  DEFAULT_NAVBAR_SETTINGS,
  DEFAULT_HERO,
  DEFAULT_FOOTER,
  DEFAULT_SHIPPING,
  DEFAULT_FEATURED,
  DEFAULT_LEGAL,
  DEFAULT_CATALOG,
  DEFAULT_STORE_LOCATOR,
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
  CatalogConfig,
  StoreLocatorConfig,
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
  const [rawNavbarSettings, rawCatalog] = await Promise.all([
    getSiteConfig<NavbarSettings>("navbar", DEFAULT_NAVBAR_SETTINGS),
    getCatalogConfig(),
  ]);

  const catalog = {
    categories: Array.isArray(rawCatalog?.categories) ? rawCatalog.categories : [],
  };

  const navbarSettings: NavbarSettings = {
    categoryIds: Array.isArray(rawNavbarSettings?.categoryIds)
      ? rawNavbarSettings.categoryIds.filter((id): id is string => typeof id === "string")
      : [],
    links: Array.isArray(rawNavbarSettings?.links)
      ? rawNavbarSettings.links.filter(
          (link): link is NavbarSettings["links"][number] =>
            Boolean(link) &&
            typeof link.label === "string" &&
            typeof link.href === "string"
        )
      : [],
  };

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
  const config = await getSiteConfig<FooterConfig>("footer", DEFAULT_FOOTER);
  return {
    tagline: typeof config?.tagline === "string" ? config.tagline : "",
    columns: Array.isArray(config?.columns) ? config.columns : [],
    socialLinks: Array.isArray(config?.socialLinks) ? config.socialLinks : [],
  };
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

export async function getStoreLocatorConfig(): Promise<StoreLocatorConfig> {
  return getSiteConfig<StoreLocatorConfig>("store_locator", DEFAULT_STORE_LOCATOR);
}

export async function getCatalogConfig(): Promise<CatalogConfig> {
  const config = await getSiteConfig<CatalogConfig>("catalog", DEFAULT_CATALOG);
  return {
    categories: Array.isArray(config?.categories) ? config.categories : DEFAULT_CATALOG.categories,
  };
}
