import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runtime media belongs on the persistent disk, not in deployment trace bundles.
  outputFileTracingExcludes: {
    "/api/item-images/*": ["./next.config.ts", "./.data/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
