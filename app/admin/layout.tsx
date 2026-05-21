import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Clyfar Fashion Admin",
  description: "Clyfar Fashion e-commerce admin panel",
  robots: "noindex,nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto lg:pl-0 pt-14 lg:pt-0">
        <div className="min-h-full pb-20">{children}</div>
      </main>
    </div>
  );
}
