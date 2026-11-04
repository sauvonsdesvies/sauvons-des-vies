
"use client";

import {
  Settings,
  Heart,
  FileCheck2,
  UsersRound,
  ChartNoAxesCombined,
  type LucideIcon,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { PublicLanguage } from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// COMMENT ÇA MARCHE ? — PC ET MOBILE
// ==========================================================

type HowItWorksProps = {
  className?: string;
};

const CONTENT: Record<
  PublicLanguage,
  {
    title: string;
    steps: {
      title: string;
      description: string;
    }[];
  }
> = {
  fr: {
    title: "Comment ça marche ?",
    steps: [
      {
        title: "Faire un don",
        description:
          "Choisissez une collecte à soutenir.",
      },
      {
        title: "Nous vérifions",
        description:
          "Notre équipe analyse et valide chaque dossier.",
      },
      {
        title: "Nous agissons",
        description:
          "Les fonds sont versés directement aux établissements concernés.",
      },
      {
        title: "Vous suivez",
        description:
          "Retrouvez les actualités et les rapports sur l'utilisation des dons.",
      },
    ],
  },
  en: {
    title: "How does it work?",
    steps: [
      {
        title: "Make a donation",
        description:
          "Choose a campaign to support.",
      },
      {
        title: "We verify",
        description:
          "Our team reviews and validates each case.",
      },
      {
        title: "We take action",
        description:
          "Funds are paid directly to the relevant institutions.",
      },
      {
        title: "You follow",
        description:
          "Read updates and reports about how donations are used.",
      },
    ],
  },
  es: {
    title: "¿Cómo funciona?",
    steps: [
      {
        title: "Haz una donación",
        description:
          "Elige una campaña para apoyar.",
      },
      {
        title: "Verificamos",
        description:
          "Nuestro equipo revisa y valida cada solicitud.",
      },
      {
        title: "Actuamos",
        description:
          "Los fondos se pagan directamente a las instituciones correspondientes.",
      },
      {
        title: "Puedes seguirlo",
        description:
          "Consulta las noticias y los informes sobre el uso de las donaciones.",
      },
    ],
  },
  de: {
    title: "Wie funktioniert es?",
    steps: [
      {
        title: "Spenden",
        description:
          "Wählen Sie eine Kampagne aus.",
      },
      {
        title: "Wir prüfen",
        description:
          "Unser Team überprüft und bestätigt jeden Fall.",
      },
      {
        title: "Wir helfen",
        description:
          "Die Gelder werden direkt an die zuständigen Einrichtungen gezahlt.",
      },
      {
        title: "Sie bleiben informiert",
        description:
          "Lesen Sie Neuigkeiten und Berichte zur Verwendung der Spenden.",
      },
    ],
  },
};

const STEP_ICONS: LucideIcon[] = [
  Heart,
  FileCheck2,
  UsersRound,
  ChartNoAxesCombined,
];

const STEP_COLORS = [
  "text-[#E71E3D]",
  "text-[#00A7BB]",
  "text-[#007C9E]",
  "text-[#008AA9]",
];

export default function HowItWorks({
  className = "",
}: HowItWorksProps) {
  const { language } = useTranslation();
  const content = CONTENT[language];

  return (
    <section
      aria-labelledby="home-how-it-works-heading"
      className={`min-w-0 rounded-xl border border-[#E0EDF4] bg-gradient-to-br from-[#EAF8FD] via-[#F1FAFD] to-[#EAF7FB] px-3 py-4 sm:px-4 ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Settings
          size={22}
          fill="#092B50"
          color="#092B50"
          strokeWidth={2}
          aria-hidden="true"
        />

        <h2
          id="home-how-it-works-heading"
          className="text-[17px] font-extrabold text-[#092B50] sm:text-[19px]"
        >
          {content.title}
        </h2>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {content.steps.map((step, index) => {
          const Icon = STEP_ICONS[index];

          return (
            <li
              key={index}
              className="flex min-h-[68px] items-center gap-3 rounded-lg border border-white bg-white/90 px-3 py-2.5 shadow-[0_2px_8px_rgba(9,43,80,0.03)] sm:gap-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#08B7CD] text-sm font-extrabold text-white">
                {index + 1}
              </span>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <Icon
                  size={27}
                  strokeWidth={2.2}
                  fill={
                    index === 0 ? "currentColor" : "none"
                  }
                  className={STEP_COLORS[index]}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-extrabold leading-tight text-[#092B50] sm:text-sm">
                  {step.title}
                </h3>

                <p className="mt-1 text-sm leading-[1.45] text-[#60778D]">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
