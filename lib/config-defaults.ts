// ── Default configs — safe to import on client AND server ─────────
// No next/headers dependency here.

import type {
  NavbarConfig,
  HeroConfig,
  FeaturedConfig,
  FooterConfig,
  ShippingConfig,
  LegalConfig,
} from "@/types";

export const DEFAULT_NAVBAR: NavbarConfig = {
  categories: [],
  links: [],
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

