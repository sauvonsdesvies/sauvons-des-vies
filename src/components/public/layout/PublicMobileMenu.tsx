
"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";

import {
  Home,
  HandHeart,
  HeartHandshake,
  Newspaper,
  ClipboardList,
  ShieldCheck,
  Info,
  Mail,
  Heart,
  X,
  ChevronRight,
  Languages,
  type LucideIcon,
} from "lucide-react";

import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type { PublicNavigationItem } from "./PublicHeader";

// ==========================================================
// FONDATION SAUVONS DES VIES
// MENU MOBILE — ESPACE PUBLIC
// ==========================================================
//
// Compatible avec PublicHeader.tsx
//
// Fonctionnalités :
// - Navigation responsive
// - Huit rubriques publiques
// - Traductions FR / EN / ES / DE
// - Sélecteur de langue
// - Bouton Faire un don
// - Fermeture avec Échap
// - Gestion du focus clavier
// - Verrouillage du défilement
// - Fermeture lors de la navigation
//
// ==========================================================

// ----------------------------------------------------------
// 1. TYPES
// ----------------------------------------------------------

type PublicMobileMenuProps = {
  open: boolean;
  onClose: () => void;
  navigation: PublicNavigationItem[];
  pathname: string;
};

// ----------------------------------------------------------
// 2. ICÔNES DE NAVIGATION
// ----------------------------------------------------------

const NAVIGATION_ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/campagnes": HandHeart,
  "/causes": HeartHandshake,
  "/actualites": Newspaper,
  "/demander-aide": ClipboardList,
  "/transparence": ShieldCheck,
  "/a-propos": Info,
  "/contact": Mail,
};

// ----------------------------------------------------------
// 3. VÉRIFICATION DE LA PAGE ACTIVE
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
// 4. TEXTES MULTILINGUES
// ----------------------------------------------------------

const MENU_TRANSLATIONS = {
  fr: {
    menu: "Menu principal",
    navigation: "Navigation mobile",
    close: "Fermer le menu",
    closeNavigation: "Fermer le menu de navigation",
    language: "Langue du site",
    chooseLanguage: "Choisir la langue",
    donate: "Faire un don",
    foundation: "Fondation Sauvons des Vies",
    slogan: "Ensemble, sauvons des vies",
  },

  en: {
    menu: "Main menu",
    navigation: "Mobile navigation",
    close: "Close menu",
    closeNavigation: "Close navigation menu",
    language: "Website language",
    chooseLanguage: "Choose language",
    donate: "Donate",
    foundation: "Fondation Sauvons des Vies",
    slogan: "Together, we save lives",
  },

  es: {
    menu: "Menú principal",
    navigation: "Navegación móvil",
    close: "Cerrar menú",
    closeNavigation: "Cerrar menú de navegación",
    language: "Idioma del sitio",
    chooseLanguage: "Elegir idioma",
    donate: "Donar",
    foundation: "Fondation Sauvons des Vies",
    slogan: "Juntos salvamos vidas",
  },

  de: {
    menu: "Hauptmenü",
    navigation: "Mobile Navigation",
    close: "Menü schließen",
    closeNavigation: "Navigationsmenü schließen",
    language: "Sprache der Website",
    chooseLanguage: "Sprache auswählen",
    donate: "Jetzt spenden",
    foundation: "Fondation Sauvons des Vies",
    slogan: "Gemeinsam retten wir Leben",
  },
} as const;

const NAVIGATION_KEYS: Record<string, string> = {
  "/": "home", "/campagnes": "campaigns", "/causes": "causes",
  "/actualites": "news", "/demander-aide": "requestHelp",
  "/transparence": "transparency", "/a-propos": "about", "/contact": "contact",
};

// ----------------------------------------------------------
// 5. COMPOSANT PRINCIPAL
// ----------------------------------------------------------

export default function PublicMobileMenu({
  open,
  onClose,
  navigation,
  pathname,
}: PublicMobileMenuProps) {
  const { language, t } = useTranslation();

  const labels = MENU_TRANSLATIONS[language];

  const menuRef = useRef<HTMLDivElement>(null);

  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  const previousFocusRef =
    useRef<HTMLElement | null>(null);

  const titleId = useId();

  // --------------------------------------------------------
  // 6. FERMETURE AVEC ÉCHAP ET FOCUS CLAVIER
  // --------------------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements =
        menuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

      if (
        !focusableElements ||
        focusableElements.length === 0
      ) {
        return;
      }

      const first = focusableElements[0];

      const last =
        focusableElements[
          focusableElements.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      const previousFocus =
        previousFocusRef.current;

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [open, onClose]);

  // --------------------------------------------------------
  // 7. BLOQUER LE DÉFILEMENT D'ARRIÈRE-PLAN
  // --------------------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  // --------------------------------------------------------
  // 8. FERMER LORS D'UN CHANGEMENT DE PAGE
  // --------------------------------------------------------

  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;

      if (open) {
        onClose();
      }
    }
  }, [pathname, open, onClose]);

  // --------------------------------------------------------
  // 9. NE RIEN AFFICHER SI LE MENU EST FERMÉ
  // --------------------------------------------------------

  if (!open) {
    return null;
  }

  // --------------------------------------------------------
  // 10. AFFICHAGE DU MENU
  // --------------------------------------------------------

  return (
    <div
      id="public-mobile-navigation"
      className="
        absolute left-0 top-full z-50
        w-full xl:hidden
      "
    >
      {/* ==========================================
          FOND ASSOMBRI
          ========================================== */}

      <button
        type="button"
        tabIndex={-1}
        aria-label={labels.closeNavigation}
        onClick={onClose}
        className="
          fixed inset-x-0 bottom-0 top-[76px]
          z-0 cursor-default
          bg-[#041A34]/50
          backdrop-blur-[2px]
          sm:top-[84px]
        "
      />

      {/* ==========================================
          PANNEAU DU MENU
          ========================================== */}

      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="
          relative z-10
          max-h-[calc(100dvh-76px)]
          w-full overflow-y-auto
          overscroll-contain
          border-t border-[#E5EDF5]
          bg-white
          shadow-[0_18px_40px_rgba(5,30,59,0.18)]
          sm:mx-auto
          sm:max-h-[calc(100dvh-84px)]
          sm:max-w-[500px]
          sm:rounded-b-2xl
        "
      >
        {/* ==========================================
            EN-TÊTE DU MENU
            ========================================== */}

        <div className="flex items-center justify-between gap-4 border-b border-[#E8EFF5] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#08AFC3] sm:text-[11px]">
              {labels.foundation}
            </p>

            <h2
              id={titleId}
              className="mt-1 text-[19px] font-extrabold leading-tight text-[#092B50]"
            >
              {labels.menu}
            </h2>

            <p className="mt-1 text-xs font-medium text-[#6A8196]">
              {labels.slogan}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-xl
              border border-[#E2ECF4]
              bg-[#F0F6FA]
              text-[#092B50]
              transition-colors
              hover:bg-[#E0F2F7]
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#0BC2D4]
            "
          >
            <X
              size={22}
              strokeWidth={2.3}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* ==========================================
            NAVIGATION PRINCIPALE
            ========================================== */}

        <nav
          aria-label={labels.navigation}
          className="px-3 py-3 sm:px-4"
        >
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon =
                NAVIGATION_ICONS[item.href] ??
                Home;

              const active = isActivePath(
                pathname,
                item.href
              );

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={
                      active ? "page" : undefined
                    }
                    className={[
                      "group flex min-h-[49px] items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-semibold transition-colors duration-150",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0BC2D4]",
                      active
                        ? "bg-[#EAF8FC] text-[#006D91]"
                        : "text-[#153B5D] hover:bg-[#F3F8FC]",
                    ].join(" ")}
                  >
                    {/* ICÔNE */}

                    <Icon
                      size={19}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={
                        active
                          ? "shrink-0 text-[#04AFC5]"
                          : "shrink-0 text-[#66829A] group-hover:text-[#04AFC5]"
                      }
                    />

                    {/* LIBELLÉ */}

                    <span className="min-w-0 flex-1">
                      {NAVIGATION_KEYS[item.href] ? t(`navigation.${NAVIGATION_KEYS[item.href]}`) : item.label}
                    </span>

                    {/* INDICATEUR */}

                    {active ? (
                      <span
                        aria-hidden="true"
                        className="
                          h-2 w-2 shrink-0
                          rounded-full bg-[#0BC2D4]
                        "
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        aria-hidden="true"
                        className="
                          shrink-0 text-[#9AB0C2]
                          transition-transform
                          group-hover:translate-x-0.5
                        "
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ==========================================
            SÉLECTEUR DE LANGUE
            ========================================== */}

        <div className="border-t border-[#E8EFF5] px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Languages
              size={16}
              aria-hidden="true"
              className="text-[#08AFC3]"
            />

            <p className="text-xs font-bold uppercase tracking-wide text-[#617B94]">
              {labels.language}
            </p>
          </div>

          <div
            className="
              flex min-h-[52px]
              items-center justify-between
              gap-3 rounded-xl
              border border-[#DFE9F1]
              bg-[#F8FBFD]
              px-3 py-2 sm:px-4
            "
          >
            <span className="min-w-0 text-[13px] font-semibold text-[#092B50]">
              {labels.chooseLanguage}
            </span>

            <div className="shrink-0">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* ==========================================
            BOUTON DE DON
            ========================================== */}

        <div className="border-t border-[#E8EFF5] bg-[#F8FBFD] px-5 py-5">
          <Link
            href="/faire-un-don"
            onClick={onClose}
            className="
              flex min-h-[52px] w-full
              items-center justify-center
              gap-3 rounded-xl
              bg-[#E71E3D]
              px-5 py-3
              text-[14px] font-extrabold
              text-white
              shadow-[0_4px_12px_rgba(231,30,61,0.18)]
              transition-colors
              hover:bg-[#C91835]
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#E71E3D]
            "
          >
            <Heart
              size={19}
              fill="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            />

            {labels.donate}
          </Link>
        </div>
      </div>
    </div>
  );
}
