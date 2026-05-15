import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Clyfer",
  description: "Learn more about Clyfer.",
};

export default function AboutPage() {
  return (
    <main className="min-h-[70vh] pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">About Clyfer</h1>
      <p className="text-muted-foreground leading-relaxed">
        Clyfer is a footwear storefront built for premium everyday shoes, limited drops,
        and product-first storytelling.
      </p>
    </main>
  );
}
