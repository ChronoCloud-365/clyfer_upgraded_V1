import type { Metadata } from "next";
import { getHeroConfig, getFeaturedConfig, getCatalogConfig, getStoreLocatorConfig } from "@/lib/site-config-server";
import { getAllProducts } from "@/lib/products";
import { HeroSlider } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { AllProductsSection } from "@/components/home/AllProductsSection";
import { StoreLocatorSection } from "@/components/home/StoreLocatorSection";
import type { FeaturedSectionConfig, Product } from "@/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Clyfar Fashion — Premium Footwear",
  description:
    "Discover premium footwear crafted for those who move forward. Shop running, casual, formal, and limited edition shoes.",
};

export default async function HomePage() {
  const [heroConfig, featuredConfig, allProducts, catalog, storeLocator] = await Promise.all([
    getHeroConfig(),
    getFeaturedConfig(),
    getAllProducts(),
    getCatalogConfig(),
    getStoreLocatorConfig(),
  ]);

  return (
    <main>
      <HeroSlider slides={heroConfig.slides} />

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

      <AllProductsSection products={allProducts} categories={catalog.categories} />

      <StoreLocatorSection config={storeLocator} />
    </main>
  );
}
