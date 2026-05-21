import Link from "next/link";
import Image from "next/image";
import { getFooterConfig, getStoreLocatorConfig } from "@/lib/site-config-server";
import type { FooterItem } from "@/types";

// Inline SVG brand icons — Lucide doesn't include trademarked logos reliably
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
};

function resolveSocialIconName(social: { label: string; href: string; iconName?: string }) {
  const candidate = social.iconName ?? social.label;
  if (SOCIAL_ICON_MAP[candidate]) return candidate;
  const href = social.href.toLowerCase();
  if (href.includes("instagram")) return "Instagram";
  if (href.includes("facebook")) return "Facebook";
  if (href.includes("youtube")) return "YouTube";
  return null;
}

function renderFooterItem(item: FooterItem) {
  if (item.type === "link") {
    return (
      <Link href={item.href} className="text-sm hover:text-foreground transition-colors">
        {item.label}
      </Link>
    );
  }
  if (item.type === "text") {
    return <p className="text-sm leading-relaxed whitespace-pre-line">{item.content}</p>;
  }
  if (item.type === "icon") {
    const IconComp = SOCIAL_ICON_MAP[item.iconName];
    return (
      <a
        href={item.href ?? "#"}
        target={item.href ? "_blank" : undefined}
        rel={item.href ? "noopener noreferrer" : undefined}
        className="inline-flex items-center gap-2 text-sm text-foreground hover:text-brand transition-colors"
      >
        {IconComp ? (
          <span className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <IconComp className="size-4" />
          </span>
        ) : (
          <span className="size-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            @
          </span>
        )}
        {item.label}
      </a>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <Image src={item.imageUrl} alt={item.alt ?? item.label} width={32} height={32} className="rounded-lg object-cover" />
      <span>{item.label}</span>
    </div>
  );
}

export async function Footer() {
  const [config, storeLocator] = await Promise.all([
    getFooterConfig(),
    getStoreLocatorConfig(),
  ]);

  return (
    <footer className="bg-background text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand + social */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.jpeg"
                alt="Clyfar Fashion logo"
                width={56}
                height={56}
                className="rounded-xl object-cover"
              />
              <div>
                <span className="text-2xl font-black tracking-tight text-foreground">
                  CLY<span className="text-brand">FAR</span>
                </span>
                <p className="text-xs text-muted-foreground font-medium -mt-0.5">Fashion</p>
              </div>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">{config.tagline}</p>

            {/* Social icons with real SVGs */}
            <div className="flex gap-3 flex-wrap">
              {config.socialLinks.map((social) => {
                const iconName = resolveSocialIconName(social);
                const IconComp = iconName ? SOCIAL_ICON_MAP[iconName] : null;
                return (
                  <a
                    key={`${social.label}-${social.href}`}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="size-10 rounded-xl bg-muted hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {IconComp ? (
                      <IconComp className="size-5" />
                    ) : (
                      <span className="text-[10px] font-bold">@</span>
                    )}
                  </a>
                );
              })}
            </div>

            {/* Store locator in footer */}
            {storeLocator.enabled && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest">Our Store</p>
                {storeLocator.address && (
                  <p className="text-xs leading-relaxed">{storeLocator.address}</p>
                )}
                {storeLocator.phone && (
                  <p className="text-xs">{storeLocator.phone}</p>
                )}
                {storeLocator.hours && (
                  <p className="text-xs">{storeLocator.hours}</p>
                )}
                <a
                  href={storeLocator.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium"
                >
                  View on Maps →
                </a>
              </div>
            )}
          </div>

          {config.columns.map((column) => (
            <div key={column.heading}>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
                {column.heading}
              </h3>
              <div className="space-y-3">{column.items.map(renderFooterItem)}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/70">
          <p>© {new Date().getFullYear()} Clyfar Fashion. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-muted-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
