import { z } from "zod";

export const navLinkSchema = z.object({
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
});

export const navbarSettingsSchema = z.object({
  categoryIds: z.array(z.string().trim().min(1)),
  links: z.array(navLinkSchema),
});

export const catalogSubcategorySchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
  desc: z.string().trim().default(""),
});

export const catalogCategorySchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
  description: z.string().trim().optional(),
  subcategories: z.array(catalogSubcategorySchema),
});

export const catalogConfigSchema = z.object({
  categories: z.array(catalogCategorySchema),
});

const footerLinkItemSchema = z.object({
  type: z.literal("link"),
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
});

const footerTextItemSchema = z.object({
  type: z.literal("text"),
  content: z.string().trim(),
});

const footerIconItemSchema = z.object({
  type: z.literal("icon"),
  label: z.string().trim().min(1),
  iconName: z.string().trim().min(1),
  href: z.string().trim().optional(),
});

const footerImageItemSchema = z.object({
  type: z.literal("image"),
  label: z.string().trim().min(1),
  imageUrl: z.string().trim().min(1),
  alt: z.string().trim().optional(),
  href: z.string().trim().optional(),
});

const footerItemSchema = z.union([
  footerLinkItemSchema,
  footerTextItemSchema,
  footerIconItemSchema,
  footerImageItemSchema,
]);

export const footerConfigSchema = z.object({
  tagline: z.string().trim(),
  columns: z.array(
    z.object({
      heading: z.string().trim().min(1),
      items: z.array(footerItemSchema),
    })
  ),
  socialLinks: z.array(
    navLinkSchema.extend({
      iconName: z.string().trim().optional(),
    })
  ),
});

export const shippingConfigSchema = z.object({
  insideDhaka: z.number().nonnegative(),
  outsideDhaka: z.number().nonnegative(),
});

export const legalConfigSchema = z.object({
  content: z.string(),
});

export const featuredConfigSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().trim().min(1),
      title: z.string().trim().min(1),
      subtitle: z.string().trim().min(1),
      description: z.string().trim().optional(),
      productIds: z.array(z.string().trim().min(1)),
    })
  ),
});

export const heroConfigSchema = z.object({
  slides: z.array(
    z.object({
      id: z.string().trim().min(1),
      badge: z.string().trim().optional(),
      title: z.string().trim().min(1),
      titleHighlight: z.string().trim().min(1),
      subtitle: z.string().trim().min(1),
      ctaPrimary: navLinkSchema,
      ctaSecondary: navLinkSchema,
      imageUrl: z.string().trim().min(1),
      stats: z.array(
        z.object({
          value: z.string().trim().min(1),
          label: z.string().trim().min(1),
        })
      ),
    })
  ),
});

export const productWriteSchema = z.object({
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  price: z.number().nonnegative(),
  original_price: z.number().nonnegative().nullable().optional(),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().nullable().optional(),
  description: z.string().trim(),
  images: z.array(z.string().trim().min(1)),
  sizes: z.array(z.number().int().positive()),
  tags: z.array(z.string().trim().min(1)),
  colors: z.array(
    z.object({
      name: z.string().trim().min(1),
      hex: z.string().trim().min(1),
    })
  ),
  is_featured: z.boolean(),
  in_stock: z.boolean(),
  rating: z.number().min(0).max(5),
  review_count: z.number().int().nonnegative(),
});

export const storeLocatorConfigSchema = z.object({
  enabled: z.boolean(),
  name: z.string().trim(),
  address: z.string().trim(),
  mapUrl: z.string().trim(),
  phone: z.string().trim().optional().default(""),
  hours: z.string().trim().optional().default(""),
});

export const orderWriteSchema = z.object({
  customer_name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().optional().default(""),
  product_id: z.string().trim().uuid().nullable().optional(),
  product_name: z.string().trim().min(1),
  size: z.number().int().positive().nullable().optional(),
  color: z.string().trim().nullable().optional(),
  quantity: z.number().int().positive(),
  total_price: z.number().nonnegative(),
  notes: z.string().trim().optional().default(""),
});
