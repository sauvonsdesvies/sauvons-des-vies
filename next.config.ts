
import type { NextConfig } from "next";

// ==========================================================
// FONDATION SAUVONS DES VIES
// CONFIGURATION NEXT.JS 16
// ==========================================================

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  // Fonctionnalités existantes
  cacheComponents: true,
  partialPrefetching: true,

  // Réduire la consommation de ressources pendant le build
  experimental: {
    cpus: 2,
    workerThreads: false,
  },

  // Autoriser les images publiques de Supabase
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: "https",
            hostname: new URL(supabaseUrl).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
