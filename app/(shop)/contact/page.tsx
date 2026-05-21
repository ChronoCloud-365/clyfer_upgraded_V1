import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Clyfar Fashion",
  description: "Contact Clyfar Fashion support.",
};

export default function ContactPage() {
  return (
    <main className="min-h-[70vh] pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">Contact Us</h1>
      <p className="text-muted-foreground leading-relaxed">
        Reach out through your preferred channel and we&apos;ll get back to you shortly.
      </p>
    </main>
  );
}
