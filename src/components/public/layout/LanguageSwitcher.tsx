
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  Globe2,
} from "lucide-react";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

// ==========================================
// FONDATION SAUVONS DES VIES
// SÉLECTEUR DE LANGUE — PC ET MOBILE
// ==========================================

type LanguageCode = "fr" | "en" | "es" | "de";

type LanguageOption = {
  code: LanguageCode;
  label: string;
  shortLabel: string;
  flag: string;
};

const LANGUAGES: LanguageOption[] = [
  {
    code: "fr",
    label: "Français",
    shortLabel: "FR",
    flag: "🇫🇷",
  },
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    flag: "🇬🇧",
  },
  {
    code: "es",
    label: "Español",
    shortLabel: "ES",
    flag: "🇪🇸",
  },
  {
    code: "de",
    label: "Deutsch",
    shortLabel: "DE",
    flag: "🇩🇪",
  },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedLanguage =
    LANGUAGES.find((item) => item.code === language) ??
    LANGUAGES[0];

  // Fermer le menu en cliquant à l'extérieur.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        !containerRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, [isOpen]);

  // Gestion du clavier.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();

        const buttons =
          menuRef.current?.querySelectorAll<HTMLButtonElement>(
            'button[data-language-option="true"]'
          );

        if (!buttons?.length) {
          return;
        }

        const currentIndex = Array.from(buttons).findIndex(
          (button) => button === document.activeElement
        );

        const nextIndex =
          currentIndex < 0
            ? 0
            : (currentIndex + 1) % buttons.length;

        buttons[nextIndex]?.focus();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        const buttons =
          menuRef.current?.querySelectorAll<HTMLButtonElement>(
            'button[data-language-option="true"]'
          );

        if (!buttons?.length) {
          return;
        }

        const currentIndex = Array.from(buttons).findIndex(
          (button) => button === document.activeElement
        );

        const previousIndex =
          currentIndex < 0
            ? buttons.length - 1
            : (currentIndex - 1 + buttons.length) %
              buttons.length;

        buttons[previousIndex]?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen]);

  function selectLanguage(code: LanguageCode) {
    setLanguage(code);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex shrink-0"
    >
      {/* ==================================
          BOUTON PRINCIPAL
          ================================== */}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={`Langue actuelle : ${selectedLanguage.label}. Changer de langue`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={[
          "inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3",
          "text-[13px] font-bold transition-colors duration-200",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0BC2D4]",
          isOpen
            ? "border-[#0BC2D4] bg-[#EFFBFD] text-[#083363]"
            : "border-[#E2EAF2] bg-white text-[#173958] hover:border-[#B9DCE5] hover:bg-[#F5FAFC]",
        ].join(" ")}
      >
        <Globe2
          size={17}
          strokeWidth={2}
          className="shrink-0 text-[#0A8FA9]"
        />

        <span
          aria-hidden="true"
          className="text-[16px] leading-none"
        >
          {selectedLanguage.flag}
        </span>

        <span className="hidden whitespace-nowrap sm:inline">
          {selectedLanguage.label}
        </span>

        <span className="whitespace-nowrap sm:hidden">
          {selectedLanguage.shortLabel}
        </span>

        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={[
            "shrink-0 transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* ==================================
          MENU DÉROULANT
          ================================== */}

      {isOpen && (
        <div
          ref={menuRef}
          role="group"
          aria-label="Choisir la langue du site"
          className="absolute right-0 top-[calc(100%+8px)] z-[80] w-[205px] overflow-hidden rounded-xl border border-[#E3EBF2] bg-white p-1.5 shadow-[0_12px_35px_rgba(7,38,75,0.16)]"
        >
          <div className="border-b border-[#EDF1F5] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#748BA0]">
              Langue du site
            </p>
          </div>

          <div className="py-1">
            {LANGUAGES.map((item) => {
              const active = item.code === language;

              return (
                <button
                  key={item.code}
                  type="button"
                  data-language-option="true"
                  onClick={() => selectLanguage(item.code)}
                  aria-pressed={active}
                  className={[
                    "flex min-h-[43px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0BC2D4]",
                    active
                      ? "bg-[#EAF8FC] text-[#006D91]"
                      : "text-[#173958] hover:bg-[#F2F7FB]",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className="text-lg leading-none"
                  >
                    {item.flag}
                  </span>

                  <span className="min-w-0 flex-1 text-[13px] font-semibold">
                    {item.label}
                  </span>

                  {active && (
                    <Check
                      size={17}
                      strokeWidth={2.5}
                      className="shrink-0 text-[#08AFC5]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
