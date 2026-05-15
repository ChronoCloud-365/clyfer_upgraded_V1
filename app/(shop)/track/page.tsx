import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Order | Clyfer",
  description: "Track your Clyfer order.",
};

export default function TrackOrderPage() {
  return (
    <main className="min-h-[70vh] pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">Track Order</h1>
      <p className="text-muted-foreground leading-relaxed">
        Order tracking is being connected to the admin order workflow. For now, use the
        admin panel to manage order status.
      </p>
    </main>
  );
}
