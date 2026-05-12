import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Add New Product</h1>
        <p className="text-zinc-400 text-sm mt-1">Fill in the details below to add a new product</p>
      </div>
      <ProductForm />
    </div>
  );
}
