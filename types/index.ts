// ── Product types ────────────────────────────────────────────────

export interface ProductColor {
  name: string;
  hex: string;
}

export type ProductCategory = string;

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  original_price?: number;
  description: string;
  images: string[];
  category: ProductCategory;
  sizes: number[];
  colors: ProductColor[];
  tags: string[];
  rating: number;
  review_count: number;
  in_stock: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// ── Order types ──────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  product_id?: string;
  product_name: string;
  size?: number;
  color?: string;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
}

// ── Cart types ───────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  size: number;
  color: ProductColor;
}

// ── Site Config types ────────────────────────────────────────────

export interface NavSubcategory {
  label: string;
  href: string;
  desc: string;
}

export interface NavCategory {
  id: string;
  label: string;
  href: string;
  subcategories: NavSubcategory[];
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarConfig {
  categories: NavCategory[];
  links: NavLink[];
}

export interface HeroSlide {
  id: string;
  badge?: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  imageUrl: string;
  stats: { value: string; label: string }[];
}

export interface HeroConfig {
  slides: HeroSlide[];
}

export interface FeaturedSectionConfig {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  productIds: string[];
}

export interface FeaturedConfig {
  sections: FeaturedSectionConfig[];
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export interface FooterConfig {
  tagline: string;
  columns: FooterColumn[];
  socialLinks: { label: string; href: string }[];
}

export interface ShippingConfig {
  insideDhaka: number;
  outsideDhaka: number;
}

export type SiteConfigKey = "navbar" | "hero" | "featured" | "footer" | "shipping";
