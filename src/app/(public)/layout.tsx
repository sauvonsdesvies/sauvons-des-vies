
import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";

import PublicHeader from "@/components/public/layout/PublicHeader";
import PublicFooter from "@/components/public/layout/PublicFooter";
import LanguageProvider from "@/lib/i18n/LanguageProvider";

// ==========================================================
// FONDATION SAUVONS DES VIES
// LAYOUT PRINCIPAL — ESPACE PUBLIC
// ==========================================================
//
// Logo officiel :
// public/logo/logo.png
//
// Icône officielle :
// public/icon/icon.png
//
// Langues : Français, Anglais, Espagnol, Allemand
//
// Compatible :
// - Next.js 16
// - TypeScript
// - Tailwind CSS
// - PC / Tablette / Mobile
//
// Ce layout ne modifie pas l'administration.
// ==========================================================

// ----------------------------------------------------------
// MÉTADONNÉES PUBLIQUES
// ----------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: "Fondation Sauvons des Vies",
    template: "%s | Fondation Sauvons des Vies",
  },

  description:
    "Fondation Sauvons des Vies : solidarité, aide médicale, accompagnement des personnes vulnérables et soutien aux familles en difficulté.",

  applicationName: "Fondation Sauvons des Vies",

  icons: {
    icon: [
      {
        url: "/icon/icon.png",
        type: "image/png",
        sizes: "any",
      },
    ],

    shortcut: "/icon/icon.png",

    apple: [
      {
        url: "/icon/icon.png",
        type: "image/png",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    siteName: "Fondation Sauvons des Vies",
    title: "Fondation Sauvons des Vies",
    description:
      "Ensemble, sauvons des vies. Soutenons les personnes confrontées à des difficultés médicales et sociales.",
    locale: "fr_FR",
    images: [
      {
        url: "/logo/logo.png",
        alt: "Fondation Sauvons des Vies",
      },
    ],
  },
};

// ----------------------------------------------------------
// CONFIGURATION RESPONSIVE
// ----------------------------------------------------------

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#082B50",
};

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

type PublicLayoutProps = {
  children: ReactNode;
};

// ----------------------------------------------------------
// LAYOUT PUBLIC
// ----------------------------------------------------------

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <LanguageProvider>
      <div className="flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip bg-[#F5F9FD] text-[#092B50]">

        {/* ==========================================
            ACCESSIBILITÉ
            ========================================== */}

        <a
          href="#contenu-principal"
          className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-4 py-3 font-semibold text-[#092B50] shadow-lg focus:not-sr-only focus:outline focus:outline-2 focus:outline-[#0BC2D4]"
        >
          Aller au contenu principal
        </a>

        {/* ==========================================
            HEADER PUBLIC
            Logo / Navigation / Langues / Don
            ========================================== */}

        <Suspense fallback={<div role="status" className="h-20 w-full bg-white"><span className="sr-only">Chargement de la navigation…</span></div>}>
          <PublicHeader />
        </Suspense>

        {/* ==========================================
            CONTENU PRINCIPAL
            ========================================== */}

        <main
          id="contenu-principal"
          tabIndex={-1}
          className="relative flex w-full min-w-0 flex-1 flex-col outline-none"
        >
          {children}
        </main>

        {/* ==========================================
            FOOTER PUBLIC
            ========================================== */}

        <PublicFooter />
      </div>
    </LanguageProvider>
  );
}
