import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Clyfar Fashion — Premium Footwear",
    template: "%s | Clyfar Fashion",
  },
  description:
    "Discover premium sneakers and footwear at Clyfar Fashion. Shop the latest drops, limited editions, and everyday classics. Free shipping over ৳ 5,000.",
  keywords: ["shoes", "sneakers", "footwear", "clyfar", "premium shoes", "running shoes"],
  authors: [{ name: "Clyfar Fashion" }],
  creator: "Clyfar Fashion",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clyfer.vercel.app",
    siteName: "Clyfar Fashion",
    title: "Clyfar Fashion — Premium Footwear",
    description: "Step into your era. Premium footwear crafted for those who move forward.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200",
        width: 1200,
        height: 630,
        alt: "Clyfar Fashion Shoes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clyfar Fashion — Premium Footwear",
    description: "Step into your era. Premium footwear for those who move forward.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} min-h-screen flex flex-col bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <CartDrawer />
            <Toaster richColors position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
