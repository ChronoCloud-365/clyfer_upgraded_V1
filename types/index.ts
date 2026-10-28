// ── Product types ────────────────────────────────────────────────

export interface ProductColor {
  name: string;
  hex: string;
}

export type ProductCategory = string;

export type ProductSize = number | string;

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
  subcategory?: string;
  sizes: ProductSize[];
  inventory_managed?: boolean;
  allow_negative_stock?: boolean;
  attributes?: ("Color" | "Size" | "Model")[];
  department?: string | null;
  variants?: { id: string; color: string; size: string; model: string; quantity: number; name: string; barcode: string; price: number; original_price?: number }[];
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
  size?: ProductSize;
  color?: string;
  model?: string;
  barcode?: string;
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
  size: ProductSize;
  color: ProductColor;
  model?: string;
  variant_id?: string;
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
  children?: NavCategory[];
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarConfig {
  categories: NavCategory[];
  links: NavLink[];
  style?: "classic" | "minimal" | "bold";
}

export interface NavbarSettings {
  categoryIds: string[];
  links: NavLink[];
  style?: "classic" | "minimal" | "bold";
}

export interface CatalogSubcategory {
  id: string;
  label: string;
  href: string;
  desc: string;
}

export interface CatalogCategory {
  id: string;
  label: string;
  href: string;
  description?: string;
  subcategories: CatalogSubcategory[];
  departmentId?: string | null;
}

export interface CatalogConfig {
  categories: CatalogCategory[];
  departments?: { id: string; name: string; slug: string }[];
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
  design?: "cinematic" | "split" | "minimal";
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

export interface FooterLinkItem {
  type: "link";
  label: string;
  href: string;
}

export interface FooterTextItem {
  type: "text";
  content: string;
}

export interface FooterIconItem {
  type: "icon";
  label: string;
  iconName: string;
  href?: string;
}

export interface FooterImageItem {
  type: "image";
  label: string;
  imageUrl: string;
  alt?: string;
  href?: string;
}

export type FooterItem =
  | FooterLinkItem
  | FooterTextItem
  | FooterIconItem
  | FooterImageItem;

export interface FooterColumn {
  heading: string;
  items: FooterItem[];
}

export interface FooterConfig {
  tagline: string;
  columns: FooterColumn[];
  socialLinks: { label: string; href: string; iconName?: string }[];
}

export interface LegalConfig {
  content: string;
}

export interface ShippingConfig {
  insideDhaka: number;
  outsideDhaka: number;
}

export interface StoreLocatorConfig {
  enabled: boolean;
  name: string;
  address: string;
  mapUrl: string;
  phone?: string;
  hours?: string;
}

export type SiteConfigKey =
  | "navbar"
  | "catalog"
  | "hero"
  | "featured"
  | "footer"
  | "shipping"
  | "terms"
  | "privacy"
  | "cookies"
  | "store_locator"
  | "featured_categories";
