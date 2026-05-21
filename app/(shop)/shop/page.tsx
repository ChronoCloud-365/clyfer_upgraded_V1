import { getAllProducts } from "@/lib/products";
import { getCatalogConfig } from "@/lib/site-config-server";
import { ShopClient } from "./ShopClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Shop — Clyfar Fashion",
  description: "Browse our full collection of premium footwear — running, casual, formal, sports and limited edition.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subcategory?: string; search?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const [products, catalog] = await Promise.all([
    getAllProducts({
      category: params.category,
      subcategory: params.subcategory,
      search: params.search,
    }),
    getCatalogConfig(),
  ]);

  return (
    <Suspense fallback={null}>
      <ShopClient
        key={`${params.category ?? "all"}-${params.subcategory ?? ""}-${params.search ?? ""}`}
        initialProducts={products}
        params={params}
        categories={catalog.categories}
      />
    </Suspense>
  );
}
