"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit, Loader2, Package, ToggleLeft, ToggleRight } from "lucide-react";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    setDeleting(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((p) => p.filter((pr) => pr.id !== id));
    setDeleting(null);
  }

  async function toggleStock(product: Product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ in_stock: !product.in_stock }),
    });
    setProducts((p) =>
      p.map((pr) =>
        pr.id === product.id ? { ...pr, in_stock: !pr.in_stock } : pr
      )
    );
  }

  const CATEGORY_COLORS: Record<string, string> = {
    running: "bg-blue-500/15 text-blue-300",
    casual: "bg-green-500/15 text-green-300",
    formal: "bg-purple-500/15 text-purple-300",
    sports: "bg-orange-500/15 text-orange-300",
    limited: "bg-amber-500/15 text-amber-300",
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} products total
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          <Plus className="size-4" /> Add Product
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="size-5 animate-spin" /> Loading products…
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <Package className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No products yet.</p>
            <Link
            href="/admin/products/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-brand border border-brand/20 hover:bg-brand/10 transition-colors"
          >
            <Plus className="size-4" /> Add your first product
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden md:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden lg:table-cell">Featured</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                        {product.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium w-fit ${CATEGORY_COLORS[product.category] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {product.category}
                      </span>
                      {product.subcategory && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground w-fit">
                          {product.subcategory}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">৳{product.price.toLocaleString()}</p>
                    {product.original_price && (
                      <p className="text-xs text-muted-foreground line-through">
                        ৳{product.original_price.toLocaleString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <button onClick={() => toggleStock(product)}>
                      {product.in_stock ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <ToggleRight className="size-4" /> In Stock
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <ToggleLeft className="size-4" /> Out of Stock
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {product.is_featured ? (
                      <span className="text-xs text-brand bg-brand/10 px-2 py-0.5 rounded-full font-medium">
                        ★ Featured
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      >
                        <Edit className="size-4" />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        disabled={deleting === product.id}
                        className="p-2 rounded-lg text-destructive hover:text-destructive-foreground hover:bg-destructive transition-all"
                      >
                        {deleting === product.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
