"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";

export function useLiveProducts(initial: Product[], filters?: { category?: string; subcategory?: string; department?: string; search?: string }) {
  const [live, setLive] = useState<Product[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/inventory/products", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const result = await response.json();
        if (!controller.signal.aborted) setLive(result.products);
      } catch { /* Server validates availability again at checkout. */ }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const inventory = (live ?? initial.filter((product) => product.inventory_managed)).filter((product) =>
    (!filters?.category || filters.category === "all" || product.category === filters.category)
    && (!filters?.subcategory || product.subcategory === filters.subcategory)
    && (!filters?.department || product.department === filters.department)
    && (!filters?.search || product.name.toLowerCase().includes(filters.search.toLowerCase())));
  return [...initial.filter((product) => !product.inventory_managed), ...inventory];
}
