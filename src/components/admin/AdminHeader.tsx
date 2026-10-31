
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
import { useState } from "react";

type AdminHeaderProps = {
  onOpenMenu: () => void;
};

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
] as const;

export default function AdminHeader({
  onOpenMenu,
}: AdminHeaderProps) {
  const [language, setLanguage] = useState("fr");

  const selectedLanguage =
    languages.find((item) => item.code === language) ??
    languages[0];

  return (
    <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu administrateur"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#082B52] transition hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link
          href="/admin"
          className="flex shrink-0 items-center lg:hidden"
          aria-label="Accueil administrateur"
        >
          <Image
            src="/logo/logo.png"
            alt="Fondation Sauvons des Vies"
            width={132}
            height={46}
            className="h-10 w-auto max-w-32 object-contain"
            priority
          />
        </Link>

        <div className="hidden max-w-lg flex-1 items-center gap-3 rounded-xl bg-[#F1F6FC] px-4 py-3 md:flex">
          <Search
            className="h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <span className="text-xs text-slate-400">
            Recherche disponible prochainement
          </span>
        </div>

        <div className="flex-1 md:hidden" />

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            disabled
            title="Notifications disponibles prochainement"
            aria-label="Notifications disponibles prochainement"
            className="relative flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-[#082B52] opacity-60"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-1 sm:flex">
            <span aria-hidden="true">
              {selectedLanguage.flag}
            </span>

            <select
              aria-label="Langue de l'administration"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
              className="max-w-24 cursor-pointer bg-transparent text-xs font-medium text-[#082B52] outline-none"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="hidden flex-col xl:flex">
              <span className="text-xs font-bold text-[#082B52]">
                Administrateur
              </span>
              <span className="text-[11px] text-slate-500">
                Espace sécurisé
              </span>
            </div>

            <ChevronDown className="hidden h-4 w-4 text-slate-400 xl:block" />
          </div>
        </div>
      </div>
    </header>
  );
}
