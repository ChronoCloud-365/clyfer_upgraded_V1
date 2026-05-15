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
} from "@/types";

export const DEFAULT_NAVBAR: NavbarConfig = {
  categories: [],
  links: [],
};

export const DEFAULT_NAVBAR_SETTINGS: NavbarSettings = {
  categoryIds: ["running", "casual", "formal", "sports", "limited"],
  links: [],
};

export const DEFAULT_CATALOG: CatalogConfig = {
  categories: [
    {
      id: "running",
      label: "Running",
      href: "/shop/running",
      description: "Performance-driven running styles",
      subcategories: [],
    },
    {
      id: "casual",
      label: "Casual",
      href: "/shop/casual",
      description: "Everyday comfort and clean silhouettes",
      subcategories: [],
    },
    {
      id: "formal",
      label: "Formal",
      href: "/shop/formal",
      description: "Polished pairs for dressed-up looks",
      subcategories: [],
    },
    {
      id: "sports",
      label: "Sports",
      href: "/shop/sports",
      description: "Court-ready and training-focused shoes",
      subcategories: [],
    },
    {
      id: "limited",
      label: "Limited",
      href: "/shop/limited",
      description: "Special drops and exclusive releases",
      subcategories: [],
    },
  ],
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
