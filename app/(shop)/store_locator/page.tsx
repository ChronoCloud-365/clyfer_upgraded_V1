import { getStoreLocatorConfig } from "@/lib/site-config-server";
import { MapPin, Phone, Clock } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Store Location | Clyfar Fashion",
  description: "Visit us at our store. Get directions, hours, and contact info.",
};

export default async function StoreLocatorPage() {
  const config = await getStoreLocatorConfig();

  return (
    <main className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">Our Store</p>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {config.name || "Clyfar Fashion"}
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-5">
            {config.address && (
              <div className="flex items-start gap-3">
                <MapPin className="size-5 shrink-0 mt-0.5 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">Address</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {config.address}
                  </p>
                </div>
              </div>
            )}

            {config.phone && (
              <div className="flex items-start gap-3">
                <Phone className="size-5 shrink-0 mt-0.5 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">Phone</p>
                  <a
                    href={`tel:${config.phone}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {config.phone}
                  </a>
                </div>
              </div>
            )}

            {config.hours && (
              <div className="flex items-start gap-3">
                <Clock className="size-5 shrink-0 mt-0.5 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">Opening Hours</p>
                  <p className="text-sm text-muted-foreground">{config.hours}</p>
                </div>
              </div>
            )}

            {config.mapUrl && (
              <a
                href={config.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-900 hover:opacity-90 transition-all"
                style={{ background: "oklch(0.78 0.18 72)" }}
              >
                <MapPin className="size-4" />
                Get Directions
              </a>
            )}

            {!config.enabled && !config.address && (
              <p className="text-muted-foreground text-sm">
                Store information coming soon. Check back later.
              </p>
            )}
          </div>

          {config.address && (
            <div className="rounded-2xl overflow-hidden border bg-muted aspect-video">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(config.address)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Store location"
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
