
"use client";

import {
  ShieldCheck,
  FileCheck2,
  LockKeyhole,
  ChartNoAxesCombined,
  HandHeart,
  type LucideIcon,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

// ==========================================================
// FONDATION SAUVONS DES VIES
// POURQUOI NOUS FAIRE CONFIANCE ?
// ==========================================================

type HomeTrustProps = {
  className?: string;
};

const TEXT = {
  fr: {
    title: "Pourquoi nous faire confiance ?",
    items: [
      {
        title: "Dossiers vérifiés",
        description:
          "Chaque demande est étudiée et validée avant toute collecte.",
      },
      {
        title: "Montants confirmés",
        description:
          "Les montants affichés proviennent des dons confirmés enregistrés.",
      },
      {
        title: "Rapports transparents",
        description:
          "Des comptes clairs et des informations sur l'utilisation des fonds.",
      },
      {
        title: "Aide directe",
        description:
          "Les fonds sont versés directement aux établissements concernés.",
      },
    ],
  },
  en: {
    title: "Why trust us?",
    items: [
      {
        title: "Verified cases",
        description:
          "Every request is reviewed and verified before fundraising.",
      },
      {
        title: "Confirmed amounts",
        description:
          "Displayed amounts come from recorded, confirmed donations.",
      },
      {
        title: "Transparent reporting",
        description:
          "Clear information about how donated funds are used.",
      },
      {
        title: "Direct assistance",
        description:
          "Funds are paid directly to the relevant institutions.",
      },
    ],
  },
  es: {
    title: "¿Por qué confiar en nosotros?",
    items: [
      {
        title: "Casos verificados",
        description:
          "Cada solicitud se revisa y verifica antes de recaudar fondos.",
      },
      {
        title: "Importes confirmados",
        description:
          "Los importes mostrados proceden de donaciones registradas y confirmadas.",
      },
      {
        title: "Informes transparentes",
        description:
          "Información clara sobre el uso de los fondos donados.",
      },
      {
        title: "Ayuda directa",
        description:
          "Los fondos se pagan directamente a las instituciones correspondientes.",
      },
    ],
  },
  de: {
    title: "Warum uns vertrauen?",
    items: [
      {
        title: "Geprüfte Fälle",
        description:
          "Jeder Antrag wird vor dem Spendenaufruf sorgfältig geprüft.",
      },
      {
        title: "Bestätigte Beträge",
        description:
          "Angezeigte Beträge stammen aus erfassten und bestätigten Spenden.",
      },
      {
        title: "Transparente Berichte",
        description:
          "Klare Informationen über die Verwendung der Spendengelder.",
      },
      {
        title: "Direkte Hilfe",
        description:
          "Gelder werden direkt an die zuständigen Einrichtungen gezahlt.",
      },
    ],
  },
} as const;

const ICONS: LucideIcon[] = [
  FileCheck2,
  LockKeyhole,
  ChartNoAxesCombined,
  HandHeart,
];

export default function HomeTrust({
  className = "",
}: HomeTrustProps) {
  const { language } = useTranslation();
  const labels = TEXT[language];

  return (
    <section
      aria-labelledby="home-trust-heading"
      className={`min-w-0 rounded-xl border border-[#E3EDF5] bg-gradient-to-r from-[#EFF9FD] to-[#F7FBFE] px-4 py-4 sm:px-5 ${className}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck
          size={21}
          fill="#092B50"
          color="#092B50"
          strokeWidth={2}
          aria-hidden="true"
        />

        <h2
          id="home-trust-heading"
          className="text-[17px] font-extrabold text-[#092B50] sm:text-[19px]"
        >
          {labels.title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {labels.items.map((item, index) => {
          const Icon = ICONS[index];

          return (
            <div
              key={index}
              className="flex min-w-0 items-start gap-2.5 rounded-lg bg-white/70 p-2.5 sm:p-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DDF8FB] text-[#007E9E]">
                <Icon
                  size={22}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs font-extrabold leading-tight text-[#092B50] sm:text-sm">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm leading-[1.5] text-[#61768B] sm:text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
