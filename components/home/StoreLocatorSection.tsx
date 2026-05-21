import { MapPin, Phone, Clock } from "lucide-react";
import type { StoreLocatorConfig } from "@/types";

interface Props {
  config: StoreLocatorConfig;
}

export function StoreLocatorSection({ config }: Props) {
  if (!config.enabled) return null;

  return (
    <section className="bg-muted/40 border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">Our Store</p>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {config.name || "Visit Us"}
              </h2>
            </div>

            <div className="space-y-3">
              {config.address && (
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0 mt-0.5 text-brand" />
                  <span className="leading-relaxed whitespace-pre-line">{config.address}</span>
                </div>
              )}
              {config.phone && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="size-4 shrink-0 text-brand" />
                  <a href={`tel:${config.phone}`} className="hover:text-foreground transition-colors">
                    {config.phone}
                  </a>
                </div>
              )}
              {config.hours && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="size-4 shrink-0 text-brand" />
                  <span>{config.hours}</span>
                </div>
              )}
            </div>

            {config.mapUrl && (
              <a
                href={config.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-900 hover:opacity-90 transition-all"
                style={{ background: "oklch(0.78 0.18 72)" }}
              >
                <MapPin className="size-4" />
                Get Directions
              </a>
            )}
          </div>

          {config.mapUrl && (
            <div className="rounded-2xl overflow-hidden border bg-muted aspect-video lg:aspect-square">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(config.address || config.name)}&output=embed`}
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
    </section>
  );
}
