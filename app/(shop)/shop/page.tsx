import { getAllProducts } from "@/lib/products";
import { ShopClient } from "./ShopClient";
import type { Metadata } from "next";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Shop — Clyfer Footwear",
  description: "Browse our full collection of premium footwear — running, casual, formal, sports and limited edition.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const products = await getAllProducts({
    category: params.category,
    search: params.search,
  });

  return <ShopClient initialProducts={products} params={params} />;
}
