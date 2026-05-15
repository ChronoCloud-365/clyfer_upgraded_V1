import Link from "next/link";
import Image from "next/image";
import { getFooterConfig } from "@/lib/site-config-server";
import type { FooterItem } from "@/types";

const SOCIAL_BADGES: Record<string, string> = {
  Instagram: "IG",
  Facebook: "FB",
  YouTube: "YT",
  Email: "@",
};

function resolveSocialIconName(
  social: { label: string; href: string; iconName?: string }
) {
  const candidate = social.iconName ?? social.label;
  if (SOCIAL_BADGES[candidate]) return candidate;

  const href = social.href.toLowerCase();
  if (href.includes("instagram")) return "Instagram";
  if (href.includes("facebook")) return "Facebook";
  if (href.includes("youtube")) return "YouTube";
  if (href.includes("mailto:") || href.includes("@")) return "Email";
  return "Email";
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
    const badge = SOCIAL_BADGES[item.iconName] ?? "@";
    return (
      <a
        href={item.href ?? "#"}
        target={item.href ? "_blank" : undefined}
        rel={item.href ? "noopener noreferrer" : undefined}
        className="inline-flex items-center gap-2 text-sm text-foreground hover:text-brand transition-colors"
      >
        <span className="size-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
          {badge}
        </span>
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
  const config = await getFooterConfig();

  return (
    <footer className="bg-background text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.jpeg" alt="Clyfer logo" width={48} height={48} className="rounded-xl object-cover" />
              <span className="text-2xl font-bold tracking-normal text-foreground">
                CLY<span className="text-brand">FER</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">{config.tagline}</p>
            <div className="flex gap-3 flex-wrap">
              {config.socialLinks.map((social) => {
                const iconName = resolveSocialIconName(social);
                const badge = SOCIAL_BADGES[iconName] ?? "@";
                return (
                  <a
                    key={`${social.label}-${social.href}`}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="size-9 rounded-xl bg-muted hover:bg-accent flex items-center justify-center transition-colors text-[10px] font-bold text-muted-foreground"
                  >
                    {badge}
                  </a>
                );
              })}
            </div>
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
          <p>© {new Date().getFullYear()} Clyfer. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-muted-foreground transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-muted-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
