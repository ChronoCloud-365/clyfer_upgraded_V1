import { getProductBySlug } from "@/lib/products";
import { getAllProducts } from "@/lib/products";
import { ProductDetailClient } from "./ProductDetailClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} — Clyfer`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  
  if (!product) {
    // Smart fallback: if slug matches a category, redirect to shop
    const categories = ["running", "casual", "formal", "sports", "limited"];
    if (categories.includes(slug.toLowerCase())) {
      const { redirect } = await import("next/navigation");
      redirect(`/shop?category=${slug.toLowerCase()}`);
    }
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
