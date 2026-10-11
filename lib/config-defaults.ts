// ── Default configs — safe to import on client AND server ─────────
// No next/headers dependency here.

import type {
  NavbarConfig,
  NavbarSettings,
  HeroConfig,
  FeaturedConfig,
  FooterConfig,
  ShippingConfig,
  LegalConfig,
  CatalogConfig,
  StoreLocatorConfig,
} from "@/types";
import { INVENTORY_CATEGORIES, categoryId } from "./inventory/model";

export const DEFAULT_NAVBAR: NavbarConfig = {
  categories: [],
  links: [],
};

export const DEFAULT_NAVBAR_SETTINGS: NavbarSettings = {
  categoryIds: INVENTORY_CATEGORIES.map((category) => categoryId(category.name)),
  links: [],
};

export const DEFAULT_CATALOG: CatalogConfig = {
  categories: INVENTORY_CATEGORIES.map((category) => ({
    id: categoryId(category.name), label: category.name, href: `/shop?category=${categoryId(category.name)}`,
    subcategories: category.subcategories.map((name) => ({ id: categoryId(name), label: name,
      href: `/shop?category=${categoryId(category.name)}&subcategory=${categoryId(name)}`, desc: "" })),
  })),
};

export const DEFAULT_HERO: HeroConfig = {
  slides: [],
};

export const DEFAULT_FEATURED: FeaturedConfig = {
  sections: [],
};

export const DEFAULT_FOOTER: FooterConfig = {
  tagline: "",
  columns: [],
  socialLinks: [],
};

export const DEFAULT_SHIPPING: ShippingConfig = {
  insideDhaka: 80,
  outsideDhaka: 120,
};

export const DEFAULT_LEGAL: LegalConfig = {
  content: "<h1>Content coming soon</h1><p>We are updating our policies.</p>",
};

export const DEFAULT_STORE_LOCATOR: StoreLocatorConfig = {
  enabled: true,
  name: "Clyfar Fashion",
  address: "P9P9+C7 Dhaka",
  mapUrl: "https://www.google.com/maps/place/CLYFAR+FASHION/@23.7360762,90.3682281,17z/data=!3m1!4b1!4m6!3m5!1s0x3755bf0022f40c9f:0x7246b3274c57dbe5!8m2!3d23.7360762!4d90.3682281!16s%2Fg%2F11vqd0zdmm",
  phone: "",
  hours: "",
};
