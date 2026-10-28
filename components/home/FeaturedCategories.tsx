/* eslint-disable @next/next/no-img-element -- Uploaded images use the WebP thumbnail service. */
import Link from "next/link";
import type { CatalogConfig, Product } from "@/types";
import { itemImage } from "@/lib/item-image";
export function FeaturedCategories({ ids, catalog, products }: { ids: string[]; catalog: CatalogConfig; products: Product[] }) {
  const categories = ids.slice(0, 3).map((id) => catalog.categories.find((category) => category.id === id)).filter((category) => category !== undefined);
  if (!categories.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><h2 className="mb-6 text-2xl font-bold">Featured categories</h2><div className="grid gap-5 sm:grid-cols-3">{categories.map((category) => <Link key={category.id} href={category.href} className="group relative overflow-hidden rounded-2xl border border-border bg-card"><img src={itemImage(products.find((product) => product.category === category.id)?.images[0], 480)} alt={category.label} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" /><div className="p-5"><h3 className="text-lg font-semibold">{category.label}</h3><p className="text-sm text-muted-foreground">Explore collection →</p></div></Link>)}</div></section>;
}
