import { createClient } from "./supabase/server";
import { getInventoryDatabase } from "./inventory/database";
import { dynamicCatalog } from "./inventory/taxonomy";
import {
  DEFAULT_HERO,
  DEFAULT_FOOTER,
  DEFAULT_SHIPPING,
  DEFAULT_FEATURED,
  DEFAULT_LEGAL,
  DEFAULT_STORE_LOCATOR,
} from "./config-defaults";
import type {
  NavbarConfig,
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
  const local = getInventoryDatabase().prepare("SELECT value FROM local_site_settings WHERE key=?").get(key);
  if (local) return JSON.parse(String(local.value)) as T;
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
  const [catalog, appearance] = await Promise.all([getCatalogConfig(), getSiteConfig<{ style?: NavbarConfig["style"] }>("navbar", { style: "classic" })]);
  const categories = catalog.categories.map((category) => ({ id: category.id, label: category.label, href: category.href,
    subcategories: category.subcategories.map((sub) => ({ label: sub.label, href: sub.href, desc: sub.desc })) }));
  const departments = (catalog.departments ?? []).filter((department) => catalog.categories.some((category) => category.departmentId === department.slug)).map((department) => ({
    id: `department-${department.id}`, label: department.name, href: `/shop?department=${department.slug}`, subcategories: [],
    children: categories.filter((_, index) => catalog.categories[index].departmentId === department.slug),
  }));
  return { style: appearance.style ?? "classic", categories: [...departments, ...categories.filter((_, index) => !catalog.categories[index].departmentId)], links: [] };
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
  return dynamicCatalog(getInventoryDatabase());
}
