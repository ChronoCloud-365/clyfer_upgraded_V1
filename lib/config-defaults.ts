// ── Default configs — safe to import on client AND server ─────────
// No next/headers dependency here.

import type {
  NavbarConfig,
  HeroConfig,
  FeaturedConfig,
  FooterConfig,
} from "@/types";

export const DEFAULT_NAVBAR: NavbarConfig = {
  categories: [
    {
      id: "shop",
      label: "Shop",
      href: "/shop",
      subcategories: [
        { label: "Running", href: "/shop/running", desc: "Performance on every track" },
        { label: "Casual", href: "/shop/casual", desc: "Everyday comfort & style" },
        { label: "Formal", href: "/shop/formal", desc: "Elegance for every occasion" },
        { label: "Sports", href: "/shop/sports", desc: "Engineered for athletes" },
        { label: "Limited Edition", href: "/shop/limited", desc: "Exclusive drops" },
      ],
    },
  ],
  links: [
    { label: "New Arrivals", href: "/shop?filter=new" },
    { label: "Sale", href: "/shop?filter=sale" },
    { label: "About", href: "/about" },
  ],
};

export const DEFAULT_HERO: HeroConfig = {
  slides: [
    {
      id: "slide-1",
      badge: "New Season Drop",
      title: "Step Into",
      titleHighlight: "Your Era.",
      subtitle:
        "Discover footwear crafted for those who move forward. Premium materials, iconic silhouettes, built for the relentless.",
      ctaPrimary: { label: "Shop Now", href: "/shop" },
      ctaSecondary: { label: "Explore Collection", href: "/shop/limited" },
      imageUrl:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90",
      stats: [
        { value: "50K+", label: "Happy customers" },
        { value: "200+", label: "Shoe styles" },
        { value: "4.9★", label: "Average rating" },
      ],
    },
    {
      id: "slide-2",
      badge: "Limited Edition",
      title: "Built For",
      titleHighlight: "Champions.",
      subtitle:
        "Exclusive drops for those who demand the best. Carbon fibre soles, premium leather, zero compromise.",
      ctaPrimary: { label: "Get Yours", href: "/shop/limited" },
      ctaSecondary: { label: "View All", href: "/shop" },
      imageUrl:
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=90",
      stats: [
        { value: "12", label: "Exclusive styles" },
        { value: "100%", label: "Premium leather" },
        { value: "5★", label: "Rated" },
      ],
    },
  ],
};

export const DEFAULT_FEATURED: FeaturedConfig = {
  title: "This Season's Picks",
  subtitle: "Featured",
  description: "Handpicked by our style team",
};

export const DEFAULT_FOOTER: FooterConfig = {
  tagline:
    "Premium footwear for those who move forward. Quality crafted, style-first.",
  columns: [
    {
      heading: "Shop",
      links: [
        { label: "All Shoes", href: "/shop" },
        { label: "Running", href: "/shop/running" },
        { label: "Casual", href: "/shop/casual" },
        { label: "Limited Edition", href: "/shop/limited" },
        { label: "Sale", href: "/shop?filter=sale" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Press", href: "/press" },
      ],
    },
    {
      heading: "Support",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Size Guide", href: "/size-guide" },
        { label: "Returns", href: "/returns" },
        { label: "Track Order", href: "/track" },
      ],
    },
  ],
  socialLinks: [
    { label: "Instagram", href: "#" },
    { label: "Facebook", href: "#" },
    { label: "YouTube", href: "#" },
  ],
};
