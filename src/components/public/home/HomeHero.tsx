
"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Heart,
  ArrowRight,
  FileText,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { PublicLanguage } from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// HERO PRINCIPAL — PAGE D'ACCUEIL
// ==========================================================
//
// Image : /public/images/home/hero.webp
// Texte : affiché par le composant
// Compatible : FR / EN / ES / DE
// Responsive : mobile / tablette / PC
//
// ==========================================================

type HomeHeroProps = {
  className?: string;
};

const CONTENT: Record<
  PublicLanguage,
  {
    eyebrow: string;
    title: string;
    titleAccent: string;
    description: string;
    donate: string;
    submit: string;
  }
> = {
  fr: {
    eyebrow: "FONDATION SAUVONS DES VIES",
    title: "Ensemble,",
    titleAccent: "sauvons des vies",
    description:
      "Aidez les personnes malades et les familles en difficulté.",
    donate: "Faire un don",
    submit: "Soumettre un dossier",
  },
  en: {
    eyebrow: "SAUVONS DES VIES FOUNDATION",
    title: "Together,",
    titleAccent: "let's save lives",
    description:
      "Support patients and families in need.",
    donate: "Donate",
    submit: "Submit a case",
  },
  es: {
    eyebrow: "FUNDACIÓN SAUVONS DES VIES",
    title: "Juntos,",
    titleAccent: "salvemos vidas",
    description:
      "Ayuda a personas enfermas y familias que lo necesitan.",
    donate: "Donar",
    submit: "Presentar una solicitud",
  },
  de: {
    eyebrow: "STIFTUNG SAUVONS DES VIES",
    title: "Gemeinsam",
    titleAccent: "Leben retten",
    description:
      "Helfen Sie kranken Menschen und Familien in Not.",
    donate: "Jetzt spenden",
    submit: "Antrag einreichen",
  },
};

export default function HomeHero({
  className = "",
}: HomeHeroProps) {
  const { language } = useTranslation();
  const content = CONTENT[language];

  return (
    <section
      aria-labelledby="home-hero-heading"
      className={`relative isolate w-full min-w-0 overflow-hidden bg-[#092B50] text-white ${className}`}
    >
      {/* ===================================================
          IMAGE DE FOND
      =================================================== */}

      <Image
        src="/images/home/hero.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[75%_center] sm:object-[70%_center] lg:object-center"
      />

      {/* ===================================================
          DÉGRADÉ POUR ASSURER LA LISIBILITÉ
      =================================================== */}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#061F3B]/95 via-[#092B50]/45 to-transparent lg:via-[#092B50]/60"
      />

      {/* ===================================================
          CONTENU HERO
      =================================================== */}

      <div className="relative z-10 flex min-h-[340px] w-full items-center px-4 pb-8 pt-6 sm:min-h-[360px] sm:px-6 lg:min-h-[330px] lg:px-8 lg:py-8">
        <div className="flex min-h-[284px] w-full max-w-[650px] flex-col lg:block lg:min-h-0">
          {/* PETIT TITRE */}

          {/* TITRE PRINCIPAL */}

          <h1
            id="home-hero-heading"
            className="max-w-[65%] text-[28px] font-black leading-[1.12] tracking-tight text-white sm:text-[38px] md:text-[46px] lg:max-w-[620px] lg:text-[52px]"
          >
            <span className="block">
              {content.title}
            </span>

            <span className="block text-[#5DE4F1]">
              {content.titleAccent}
            </span>
          </h1>

          {/* DESCRIPTION */}

          <p className="mt-3 line-clamp-3 max-w-[65%] text-sm leading-[1.6] text-white/90 sm:text-sm lg:line-clamp-none lg:max-w-[540px] lg:text-base">
            {content.description}
          </p>

          {/* BOUTONS */}

          <div className="mt-auto grid grid-cols-2 items-stretch gap-2 pt-5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 lg:mt-5 lg:pt-0">
            <Link
              href="/faire-un-don"
              className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-md bg-[#E71E3D] px-2 py-3 text-center text-sm font-extrabold text-white shadow-[0_5px_18px_rgba(231,30,61,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#CB1734] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-2 sm:px-6 sm:text-sm"
            >
              <Heart
                size={17}
                fill="currentColor"
                aria-hidden="true"
              />

              {content.donate}

              <ArrowRight
                size={16}
                aria-hidden="true"
                className="hidden sm:block"
              />
            </Link>

            <Link
              href="/demander-aide"
              className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-md border border-white/80 bg-white px-2 py-3 text-center text-sm font-extrabold text-[#092B50] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#E9F8FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-2 sm:px-6 sm:text-sm"
            >
              <FileText
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />

              {content.submit}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
