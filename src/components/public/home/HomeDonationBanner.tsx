
"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

// ==========================================================
// FONDATION SAUVONS DES VIES
// BANNIÈRE FINALE — PAGE D'ACCUEIL
// ==========================================================

type HomeDonationBannerProps = {
  className?: string;
};

const TEXT = {
  fr: {
    title: "Soutenez notre mission,",
    titleSecond: "faites la différence aujourd'hui !",
    description:
      "Chaque don compte. Ensemble, nous pouvons offrir de l'espoir et sauver des vies.",
    donate: "Faire un don",
  },
  en: {
    title: "Support our mission,",
    titleSecond: "make a difference today!",
    description:
      "Every donation matters. Together, we can bring hope and save lives.",
    donate: "Donate",
  },
  es: {
    title: "Apoya nuestra misión,",
    titleSecond: "¡marca la diferencia hoy!",
    description:
      "Cada donación cuenta. Juntos podemos ofrecer esperanza y salvar vidas.",
    donate: "Donar",
  },
  de: {
    title: "Unterstützen Sie unsere Mission,",
    titleSecond: "machen Sie heute den Unterschied!",
    description:
      "Jede Spende zählt. Gemeinsam können wir Hoffnung schenken und Leben retten.",
    donate: "Jetzt spenden",
  },
} as const;

export default function HomeDonationBanner({
  className = "",
}: HomeDonationBannerProps) {
  const { language } = useTranslation();
  const labels = TEXT[language];

  return (
    <section
      aria-labelledby="home-donation-banner-heading"
      className={`relative isolate min-h-[150px] overflow-hidden rounded-xl bg-[#073461] text-white shadow-[0_6px_22px_rgba(9,43,80,0.12)] sm:min-h-[165px] ${className}`}
    >
      {/* IMAGE D'ARRIÈRE-PLAN */}

      <Image
        src="/images/home/donation-banner.png"
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="h-auto w-full object-contain"
      />

      {/* DÉGRADÉ POUR LA LISIBILITÉ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#062C53]/95 via-[#073461]/80 to-[#073461]/10"
      />

      {/* CONTENU */}

      <div className="relative z-10 flex min-h-[150px] w-full flex-col items-start justify-center px-4 py-4 sm:min-h-[165px] sm:px-5">
        <h2
          id="home-donation-banner-heading"
          className="text-[20px] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[26px] lg:text-[24px]"
        >
          {labels.title}
          <span className="block text-[#5DE4F1]">
            {labels.titleSecond}
          </span>
        </h2>

        <p className="mt-3 max-w-[450px] text-[12px] leading-[1.6] text-white/90 sm:text-[14px]">
          {labels.description}
        </p>

        <Link
          href="/faire-un-don"
          className="mt-4 inline-flex min-h-[43px] items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-5 py-2.5 text-[13px] font-extrabold text-white shadow-[0_4px_12px_rgba(231,30,61,0.22)] transition-all hover:bg-[#CB1734] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Heart
            size={16}
            fill="currentColor"
            aria-hidden="true"
          />

          {labels.donate}

          <ArrowRight
            size={15}
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
