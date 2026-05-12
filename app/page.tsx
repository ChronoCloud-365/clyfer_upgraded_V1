import { getHeroConfig, getFeaturedConfig } from "@/lib/site-config";
import { getFeaturedProducts, getAllProducts } from "@/lib/products";
import { HeroSlider } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { AllProductsSection } from "@/components/home/AllProductsSection";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Clyfer — Premium Footwear",
  description: "Discover premium footwear crafted for those who move forward. Shop running, casual, formal, and limited edition shoes.",
};

export default async function HomePage() {
  const [heroConfig, featuredConfig, featuredProducts, allProducts] = await Promise.all([
    getHeroConfig(),
    getFeaturedConfig(),
    getFeaturedProducts(),
    getAllProducts(),
  ]);

  return (
    <main>
      <HeroSlider slides={heroConfig.slides} />
      <FeaturedProducts config={featuredConfig} products={featuredProducts} />
      <AllProductsSection products={allProducts} />
    </main>
  );
}
