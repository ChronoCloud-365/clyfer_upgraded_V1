import Link from "next/link";
import { getFooterConfig } from "@/lib/site-config-server";
import { Share2, Users, Play, Mail } from "lucide-react";

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  Instagram: Share2,
  Facebook: Users,
  YouTube: Play,
  Email: Mail,
};

export async function Footer() {
  const config = await getFooterConfig();

  return (
    <footer className="bg-background text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="text-2xl font-black tracking-tight text-foreground">
              CLY<span className="text-brand">FER</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">{config.tagline}</p>
            {/* Social links */}
            <div className="flex gap-3">
              {config.socialLinks.map((s) => {
                const Icon = SOCIAL_ICONS[s.label] ?? Mail;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="size-9 rounded-xl bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {config.columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/70">
          <p>© {new Date().getFullYear()} Clyfer. All rights reserved.</p>
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
