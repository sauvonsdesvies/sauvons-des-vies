
"use client";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import Link from "next/link";
import Image from "next/image";

import {
  Heart,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

// ==========================================================
// FONDATION SAUVONS DES VIES
// FOOTER PUBLIC — VERSION PC / TABLETTE / MOBILE
// ==========================================================

type FooterLink = {
  href: string;
  translationKey: string;
};

const QUICK_LINKS: FooterLink[] = [
  {
    href: "/",
    translationKey: "navigation.home",
  },
  {
    href: "/campagnes",
    translationKey: "navigation.campaigns",
  },
  {
    href: "/causes",
    translationKey: "navigation.causes",
  },
  {
    href: "/actualites",
    translationKey: "navigation.news",
  },
  {
    href: "/demander-aide",
    translationKey: "navigation.requestHelp",
  },
];

const INFORMATION_LINKS: FooterLink[] = [
  {
    href: "/transparence",
    translationKey: "navigation.transparency",
  },
  {
    href: "/a-propos",
    translationKey: "navigation.about",
  },
  {
    href: "/contact",
    translationKey: "navigation.contact",
  },
];

// Renseigner uniquement les véritables liens officiels.
// Les réseaux sans URL ne sont pas affichés.
const SOCIAL_LINKS: {
  name: string;
  url: string;
  icon: string;
}[] = [
  { name: "Facebook", url: "https://www.facebook.com/fondationsauvonsdes", icon: "facebook" },
  { name: "Instagram", url: "https://www.instagram.com/fondationsauvonsdes/", icon: "instagram" },
  { name: "TikTok", url: "https://www.tiktok.com/@fondationsauvonsdes", icon: "tiktok" },
  { name: "YouTube", url: "https://www.youtube.com/@fondationsauvonsdes", icon: "youtube" },
];

const subscribeToYear = () => () => {};
const getClientYear = () => String(new Date().getFullYear());
const getServerYear = () => "";

export default function PublicFooter() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const year = useSyncExternalStore(subscribeToYear, getClientYear, getServerYear);

  const availableSocialLinks = SOCIAL_LINKS.filter(
    (social) => social.url.trim().length > 0
  );

  if (pathname === "/faire-un-don") return null;

  return (
    <footer className="w-full bg-[#082B50] text-white">
      <div className="mx-auto w-full max-w-none px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">

          {/* ==========================================
              IDENTITÉ DE LA FONDATION
              ========================================== */}

          <section className="min-w-0 space-y-2">
            <Link
              href="/"
              aria-label={t("common.foundationName")}
              className="inline-flex max-w-full items-center"
            >
              <div className="relative h-[58px] w-[190px] max-w-full">
                <Image
                  src="/logo/logo.png"
                  alt={t("accessibility.logoAlt")}
                  fill
                  sizes="220px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            <p className="max-w-[310px] text-[12px] leading-5 text-[#D0DFEC]">
              {t("footer.description")}
            </p>

            {availableSocialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {availableSocialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    title={social.name}
                    className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 text-white transition-colors hover:border-[#12B8D0] hover:bg-[#12B8D0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Image src={`/icons/social/${social.icon}.svg`} alt="" width={20} height={20} className="shrink-0 invert" />

                    <span className="text-[10px] font-semibold">
                      {social.name}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* ==========================================
              LIENS RAPIDES
              ========================================== */}

          <nav
            aria-label={t("footer.quickLinks")}
            className="min-w-0"
          >
            <h2 className="mb-3 text-[15px] font-extrabold text-white">
              {t("footer.quickLinks")}
            </h2>

            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center text-[13px] leading-6 text-[#D0DFEC] transition-colors hover:text-[#22D3E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22D3E6]"
                  >
                    {t(link.translationKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ==========================================
              INFORMATIONS
              ========================================== */}

          <nav
            aria-label={t("footer.information")}
            className="min-w-0"
          >
            <h2 className="mb-3 text-[15px] font-extrabold text-white">
              {t("footer.information")}
            </h2>

            <ul className="space-y-2">
              {INFORMATION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center text-[13px] leading-6 text-[#D0DFEC] transition-colors hover:text-[#22D3E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22D3E6]"
                  >
                    {t(link.translationKey)}
                  </Link>
                </li>
              ))}
            </ul>

          </nav>

          {/* ==========================================
              CONTACT ET NEWSLETTER
              ========================================== */}

          <section className="min-w-0">
            <h2 className="mb-3 text-[15px] font-extrabold text-white">
              {t("footer.stayConnected")}
            </h2>

            <p className="mb-3 text-[12px] leading-5 text-[#D0DFEC]">
              {t("footer.stayConnectedDescription")}
            </p>

            <Link
              href="/faire-un-don"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-5 py-3 text-[13px] font-bold text-white transition-colors hover:bg-[#C91835] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Heart
                size={17}
                fill="currentColor"
              />

              {t("footer.donate")}
            </Link>
          </section>
        </div>

        {/* ==========================================
            BAS DU FOOTER
            ========================================== */}

        <div className="mt-5 flex flex-col gap-2 border-t border-white/15 pt-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-[12px] leading-6 text-[#B6CADB]">
            © {year} {t("common.foundationName")}.{" "}
            {t("footer.allRightsReserved")}
          </p>

          <p className="text-[12px] font-medium text-[#B6CADB]">
            {t("footer.motto")}
          </p>
        </div>
      </div>
    </footer>
  );
}
