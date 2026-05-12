import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-6">
      <p className="text-8xl font-black tracking-tighter text-brand">404</p>
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground max-w-sm">
        Looks like this page took a wrong step. Let&apos;s get you back on track.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          Go Home
        </Link>
        <Link
          href="/shop"
          className="px-6 py-3 rounded-xl font-semibold text-sm border border-border hover:bg-accent transition-colors"
        >
          Browse Shop
        </Link>
      </div>
    </div>
  );
}
