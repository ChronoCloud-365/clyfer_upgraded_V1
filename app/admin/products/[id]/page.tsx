import { ProductForm } from "@/components/admin/ProductForm";
import type { Product } from "@/types";

import { createClient } from "@/lib/supabase/server";

async function getProduct(id: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Product;
  } catch (err) {
    console.error("[getProduct] Error:", err);
    return null;
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <div className="p-8 text-zinc-400">Product not found.</div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Edit Product</h1>
        <p className="text-zinc-400 text-sm mt-1">{product.name}</p>
      </div>
      <ProductForm initial={product} productId={id} />
    </div>
  );
}
