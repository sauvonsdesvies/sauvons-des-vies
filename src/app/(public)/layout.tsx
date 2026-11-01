
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
// Logo officiel : public/logo/logo.png
// Icône officielle : public/icon/icon.png
// Image de partage : public/images/partage-social.jpg
//
// Langues : Français, Anglais, Espagnol, Allemand
//
// Compatible : Next.js 16 / TypeScript / Tailwind CSS
// Responsive : PC / Tablette / Mobile
//
// Ce layout ne modifie pas l'administration.
// ==========================================================

// ----------------------------------------------------------
// CONFIGURATION GÉNÉRALE
// ----------------------------------------------------------

const SITE_URL = "https://sauvonsdesvies.com";

const SITE_NAME = "Fondation Sauvons des Vies";

const SITE_TITLE =
  "Fondation Sauvons des Vies | Ensemble, sauvons des vies";

const SITE_DESCRIPTION =
  "Ensemble, sauvons des vies. Soutenez les personnes ayant besoin de soins médicaux, participez aux campagnes solidaires et contribuez à sauver des vies grâce à vos dons.";

const SOCIAL_IMAGE = "/images/partage-social.jpg";

// ----------------------------------------------------------
// MÉTADONNÉES PUBLIQUES
// ----------------------------------------------------------

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,

  keywords: [
    "Fondation Sauvons des Vies",
    "Sauvons des vies",
    "Fondation humanitaire",
    "Dons humanitaires",
    "Faire un don",
    "Aide médicale",
    "Solidarité",
    "Santé",
    "Entraide",
    "Collecte de dons",
    "Campagnes solidaires",
    "Aide aux malades",
    "Bénin",
    "Afrique",
  ],

  authors: [
    {
      name: SITE_NAME,
    },
  ],

  creator: SITE_NAME,

  publisher: SITE_NAME,

  category: "humanitarian",

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

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
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // --------------------------------------------------------
  // OPEN GRAPH : FACEBOOK / WHATSAPP / TELEGRAM / LINKEDIN
  // --------------------------------------------------------

  openGraph: {
    type: "website",

    url: SITE_URL,

    siteName: SITE_NAME,

    title: SITE_TITLE,

    description: SITE_DESCRIPTION,

    locale: "fr_FR",

    alternateLocale: [
      "en_US",
      "es_ES",
      "de_DE",
    ],

    images: [
      {
        url: SOCIAL_IMAGE,
        secureUrl: `${SITE_URL}${SOCIAL_IMAGE}`,
        width: 1200,
        height: 630,
        alt:
          "Fondation Sauvons des Vies — Ensemble, sauvons des vies. Solidarité, Santé et Entraide.",
        type: "image/jpeg",
      },
    ],
  },

  // --------------------------------------------------------
  // X / TWITTER ET AUTRES APERÇUS COMPATIBLES
  // --------------------------------------------------------

  twitter: {
    card: "summary_large_image",

    title: SITE_TITLE,

    description: SITE_DESCRIPTION,

    images: [
      {
        url: SOCIAL_IMAGE,
        alt:
          "Fondation Sauvons des Vies — Ensemble, sauvons des vies",
      },
    ],
  },

  // --------------------------------------------------------
  // INFORMATIONS SUPPLÉMENTAIRES
  // --------------------------------------------------------

  other: {
    "theme-color": "#082B50",
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

        <Suspense
          fallback={
            <div
              role="status"
              className="h-20 w-full bg-white"
            >
              <span className="sr-only">
                Chargement de la navigation…
              </span>
            </div>
          }
        >
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
