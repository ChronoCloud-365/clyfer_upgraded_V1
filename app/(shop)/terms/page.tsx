import { getTermsConfig } from "@/lib/site-config-server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Clyfar Fashion",
  description: "Terms and conditions for using Clyfar Fashion services",
};

export default async function TermsPage() {
  const config = await getTermsConfig();

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <h1 className="text-4xl font-black mb-10 text-foreground">Terms & Conditions</h1>
      <div 
        className="prose prose-neutral dark:prose-invert max-w-none 
          prose-headings:text-foreground prose-p:text-muted-foreground
          prose-strong:text-foreground prose-ul:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: config.content }}
      />
    </div>
  );
}
