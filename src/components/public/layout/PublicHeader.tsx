
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart, Menu, X } from "lucide-react";

import PublicMobileMenu from "./PublicMobileMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// ==========================================================
// FONDATION SAUVONS DES VIES
// HEADER PUBLIC — PC, TABLETTE ET MOBILE
// ==========================================================
//
// Logo officiel : /logo/logo.png
//
// MOBILE / TABLETTE :
// - Menu hamburger à gauche
// - Logo officiel au centre
// - Sélecteur de langues à côté du logo
// - Bouton Don à droite
//
// ORDINATEUR :
// - Logo à gauche
// - Navigation complète
// - Sélecteur de langues existant
// - Bouton Faire un don
//
// Langues : FR / EN / DE / ES
//
// Aucun changement dans :
// - LanguageProvider
// - PublicMobileMenu
// - Les routes du site
// - Les composants de campagnes
//
// ==========================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

export type PublicNavigationItem = {
  href: string;
  label: string;
};

type SupportedLanguage = "fr" | "en" | "es" | "de";

// ----------------------------------------------------------
// ROUTE ACTIVE
// ----------------------------------------------------------

function isActivePath(
  pathname: string,
  href: string
): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

// ----------------------------------------------------------
// COMPOSANT PRINCIPAL
// ----------------------------------------------------------

export default function PublicHeader() {
  const pathname = usePathname();

  const { language } = useTranslation();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // --------------------------------------------------------
  // TRADUCTIONS DE NAVIGATION
  // --------------------------------------------------------

  const translations = {
    fr: {
      home: "Accueil",
      campaigns: "Campagnes",
      causes: "Nos causes",
      news: "Journaux / Actualités",
      help: "Demander de l'aide",
      transparency: "Transparence",
      about: "À propos",
      contact: "Contact",
      donate: "Faire un don",
      shortDonate: "Don",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      mainNavigation: "Navigation principale",
      homeAria: "Fondation Sauvons des Vies — Accueil",
    },

    en: {
      home: "Home",
      campaigns: "Campaigns",
      causes: "Our causes",
      news: "News / Updates",
      help: "Request help",
      transparency: "Transparency",
      about: "About us",
      contact: "Contact",
      donate: "Donate",
      shortDonate: "Donate",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      mainNavigation: "Main navigation",
      homeAria: "Fondation Sauvons des Vies — Home",
    },

    es: {
      home: "Inicio",
      campaigns: "Campañas",
      causes: "Nuestras causas",
      news: "Noticias / Actualidad",
      help: "Solicitar ayuda",
      transparency: "Transparencia",
      about: "Quiénes somos",
      contact: "Contacto",
      donate: "Donar",
      shortDonate: "Donar",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      mainNavigation: "Navegación principal",
      homeAria: "Fondation Sauvons des Vies — Inicio",
    },

    de: {
      home: "Startseite",
      campaigns: "Kampagnen",
      causes: "Unsere Anliegen",
      news: "Nachrichten / Aktuelles",
      help: "Hilfe beantragen",
      transparency: "Transparenz",
      about: "Über uns",
      contact: "Kontakt",
      donate: "Jetzt spenden",
      shortDonate: "Spenden",
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
      mainNavigation: "Hauptnavigation",
      homeAria: "Fondation Sauvons des Vies — Startseite",
    },
  };

  const currentLanguage: SupportedLanguage =
    language === "en" ||
    language === "es" ||
    language === "de"
      ? language
      : "fr";

  const labels = translations[currentLanguage];

  // --------------------------------------------------------
  // NAVIGATION PUBLIQUE
  // --------------------------------------------------------

  const navigation: PublicNavigationItem[] = [
    {
      href: "/",
      label: labels.home,
    },
    {
      href: "/campagnes",
      label: labels.campaigns,
    },
    {
      href: "/causes",
      label: labels.causes,
    },
    {
      href: "/actualites",
      label: labels.news,
    },
    {
      href: "/demander-aide",
      label: labels.help,
    },
    {
      href: "/transparence",
      label: labels.transparency,
    },
    {
      href: "/a-propos",
      label: labels.about,
    },
    {
      href: "/contact",
      label: labels.contact,
    },
  ];

  // --------------------------------------------------------
  // MENU MOBILE
  // --------------------------------------------------------

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function toggleMobileMenu() {
    setMobileMenuOpen((previous) => !previous);
  }

  // --------------------------------------------------------
  // AFFICHAGE
  // --------------------------------------------------------

  return (
    <header
      className="
        sticky top-0 z-50 w-full
        border-b border-[#E6EDF5]
        bg-white
        shadow-[0_2px_12px_rgba(7,38,75,0.05)]
      "
    >
      <div
        className="
          relative mx-auto flex
          h-[76px] w-full max-w-none
          items-center justify-between
          px-3
          sm:h-[84px] sm:px-6
          lg:px-8
          xl:h-[86px] xl:gap-3 xl:px-8
          2xl:px-8
        "
      >
        {/* ==================================================
            VERSION MOBILE ET TABLETTE
            ================================================== */}

        <div
          className="
            grid h-full w-full min-w-0
            grid-cols-[44px_minmax(0,1fr)_auto]
            items-center gap-2
            xl:hidden
          "
        >
          {/* ----------------------------------------------
              MENU HAMBURGER — GAUCHE
              ---------------------------------------------- */}

          <div className="flex items-center justify-start">
            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? labels.closeMenu
                  : labels.openMenu
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="public-mobile-navigation"
              onClick={toggleMobileMenu}
              className="
                inline-flex h-11 w-11
                shrink-0 items-center
                justify-center rounded-xl
                border border-[#E5EEF5]
                bg-[#F7FAFD]
                text-[#092B50]
                transition-colors
                hover:border-[#BCECF2]
                hover:bg-[#EAF8FB]
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-[#0BC2D4]
              "
            >
              {mobileMenuOpen ? (
                <X
                  size={25}
                  strokeWidth={2.3}
                  aria-hidden="true"
                />
              ) : (
                <Menu
                  size={25}
                  strokeWidth={2.3}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>

          {/* ----------------------------------------------
              LOGO + SÉLECTEUR DE LANGUES
              ---------------------------------------------- */}

          <div
            className="
              flex min-w-0 items-center
              justify-center gap-1
              sm:gap-3
            "
          >
            {/* LOGO OFFICIEL */}

            <Link
              href="/"
              aria-label={labels.homeAria}
              onClick={closeMobileMenu}
              className="
                relative flex min-w-0
                shrink items-center
                justify-center rounded-lg
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-[#0BC2D4]
              "
            >
              <div
                className="
                  relative h-[58px] w-[88px]
                  min-[360px]:w-[104px]
                  min-[390px]:w-[120px]
                  min-[430px]:w-[140px]
                  sm:h-[70px] sm:w-[205px]
                  md:w-[230px]
                  lg:w-[245px]
                "
              >
                <Image
                  src="/logo/logo.png"
                  alt="Fondation Sauvons des Vies"
                  fill
                  priority
                  sizes="(max-width: 359px) 88px, (max-width: 389px) 104px, (max-width: 429px) 120px, (max-width: 639px) 140px, (max-width: 767px) 205px, (max-width: 1023px) 230px, 245px"
                  className="
                    object-contain object-center
                  "
                />
              </div>
            </Link>

            {/* SÉLECTEUR DE LANGUES MOBILE */}

            <div
              className="
                relative z-[60]
                flex shrink-0
                items-center justify-center
                [&_button]:max-w-[78px]
                [&_button]:whitespace-nowrap
                max-[359px]:[&_button]:max-w-[64px]
              "
            >
              <LanguageSwitcher />
            </div>
          </div>

          {/* ----------------------------------------------
              BOUTON DON — DROITE
              ---------------------------------------------- */}

          <div className="flex shrink-0 items-center justify-end">
            <Link
              href="/faire-un-don"
              onClick={closeMobileMenu}
              aria-label={labels.donate}
              className="
                inline-flex h-10 shrink-0
                items-center justify-center
                gap-1 rounded-xl
                bg-[#E71E3D]
                px-2 text-[11px]
                font-bold text-white
                shadow-[0_3px_9px_rgba(231,30,61,0.18)]
                transition-colors
                hover:bg-[#CB1734]
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-[#E71E3D]
                sm:h-11 sm:gap-2
                sm:px-4 sm:text-[13px]
              "
            >
              <Heart
                size={15}
                fill="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>{labels.shortDonate}</span>
            </Link>
          </div>
        </div>

        {/* ==================================================
            VERSION ORDINATEUR
            ================================================== */}

        <div
          className="
            hidden h-full w-full min-w-0
            items-center gap-3
            xl:flex
          "
        >
          {/* ----------------------------------------------
              LOGO OFFICIEL
              ---------------------------------------------- */}

          <Link
            href="/"
            aria-label={labels.homeAria}
            onClick={closeMobileMenu}
            className="
              relative flex shrink-0
              items-center rounded-lg
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#0BC2D4]
            "
          >
            <div
              className="
                relative h-[64px] w-[190px]
                2xl:w-[225px]
              "
            >
              <Image
                src="/logo/logo.png"
                alt="Fondation Sauvons des Vies"
                fill
                sizes="(max-width: 359px) 88px, (max-width: 389px) 104px, (max-width: 429px) 120px, (max-width: 639px) 140px, (max-width: 767px) 205px, (max-width: 1023px) 230px, 245px"
                className="
                  object-contain object-left
                "
              />
            </div>
          </Link>

          {/* ----------------------------------------------
              NAVIGATION PRINCIPALE
              ---------------------------------------------- */}

          <nav
            aria-label={labels.mainNavigation}
            className="
              flex min-w-0 flex-1
              items-center justify-center
              gap-2 2xl:gap-5
            "
          >
            {navigation.map((item) => {
              const active = isActivePath(
                pathname,
                item.href
              );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={[
                    "relative flex h-[86px] shrink-0 items-center whitespace-nowrap text-[11px] font-bold transition-colors duration-200 2xl:text-[13px]",
                    "hover:text-[#05AFC6]",
                    active
                      ? "text-[#083363]"
                      : "text-[#173958]",
                  ].join(" ")}
                >
                  {item.label}

                  {active && (
                    <span
                      aria-hidden="true"
                      className="
                        absolute bottom-[13px]
                        left-0 h-[3px] w-full
                        rounded-full
                        bg-[#0BC2D4]
                      "
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ----------------------------------------------
              LANGUES + BOUTON DON
              ---------------------------------------------- */}

          <div
            className="
              flex shrink-0
              items-center gap-2
              2xl:gap-3
            "
          >
            {/* SÉLECTEUR EXISTANT */}

            <LanguageSwitcher />

            {/* BOUTON DON */}

            <Link
              href="/faire-un-don"
              className="
                inline-flex h-[43px]
                items-center justify-center
                gap-2 whitespace-nowrap
                rounded-lg
                bg-[#E71E3D]
                px-3 text-[12px]
                font-bold text-white
                shadow-[0_3px_8px_rgba(231,30,61,0.15)]
                transition-colors
                hover:bg-[#CB1734]
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-[#E71E3D]
                2xl:px-5 2xl:text-[13px]
              "
            >
              <Heart
                size={17}
                fill="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              />

              {labels.donate}
            </Link>
          </div>
        </div>
      </div>

      {/* ==================================================
          MENU MOBILE EXISTANT
          ================================================== */}

      <PublicMobileMenu
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        navigation={navigation}
        pathname={pathname}
      />
    </header>
  );
}
