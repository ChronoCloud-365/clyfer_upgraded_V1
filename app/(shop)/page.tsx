import type { Metadata } from "next";
import { getHeroConfig, getFeaturedConfig, getCatalogConfig, getSiteConfig } from "@/lib/site-config-server";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { getAllProducts } from "@/lib/products";
import { HeroSlider } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { AllProductsSection } from "@/components/home/AllProductsSection";
import type { FeaturedSectionConfig, Product } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clyfar Fashion — Premium Footwear",
  description:
    "Discover premium footwear crafted for those who move forward. Shop running, casual, formal, and limited edition shoes.",
};

export default async function HomePage() {
  const [heroConfig, featuredConfig, allProducts, catalog, featuredCategories] = await Promise.all([
    getHeroConfig(),
    getFeaturedConfig(),
    getAllProducts(),
    getCatalogConfig(),
    getSiteConfig<{ categoryIds: string[] }>("featured_categories", { categoryIds: [] }),
  ]);

  return (
    <main>
      <HeroSlider slides={heroConfig.slides} />
      <FeaturedCategories ids={featuredCategories.categoryIds} catalog={catalog} products={allProducts} />
      {allProducts.some((product) => product.is_featured) && <FeaturedProducts section={{ id: "catalog-featured", title: "Featured items", subtitle: "Selected from our collection", productIds: [] }} products={allProducts.filter((product) => product.is_featured)} />}

      {featuredConfig.sections?.map((section: FeaturedSectionConfig) => {
        const sectionProducts = allProducts.filter((product: Product) =>
          section.productIds.includes(product.id)
        );
        return (
          <FeaturedProducts
            key={section.id}
            section={section}
            products={sectionProducts}
          />
        );
      })}

      <AllProductsSection products={allProducts} categories={catalog.categories} departments={catalog.departments} />
    </main>
  );
}
