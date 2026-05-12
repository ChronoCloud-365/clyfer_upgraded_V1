import { getCookiesConfig } from "@/lib/site-config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Clyfer",
  description: "Cookie policy for Clyfer website",
};

export default async function CookiesPage() {
  const config = await getCookiesConfig();

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <h1 className="text-4xl font-black mb-10 text-foreground">Cookie Policy</h1>
      <div 
        className="prose prose-neutral dark:prose-invert max-w-none 
          prose-headings:text-foreground prose-p:text-muted-foreground
          prose-strong:text-foreground prose-ul:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: config.content }}
      />
    </div>
  );
}
