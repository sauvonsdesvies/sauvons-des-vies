import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [{ protocol: "https", hostname: new URL(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
