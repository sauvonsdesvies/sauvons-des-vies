
import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  HandHeart,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";

// ============================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — CONTACT
// ============================================================
//
// Route : /contact
//
// Compatible :
// - Next.js 16
// - App Router
// - TypeScript
// - Tailwind CSS
//
// Fonctionnalités :
// - Email officiel
// - Contacts téléphoniques
// - Bureaux internationaux
// - Liens de contact
// - Responsive PC / tablette / mobile
//
// Aucun fichier supplémentaire.
// Aucun Header/Footer dupliqué.
//
// ============================================================

// ------------------------------------------------------------
// SEO
// ------------------------------------------------------------

export const metadata: Metadata = {
  title: "Contact | Fondation Sauvons des Vies",

  description:
    "Contactez la Fondation Sauvons des Vies. Retrouvez notre adresse e-mail officielle, nos contacts téléphoniques et nos bureaux internationaux.",

  openGraph: {
    title: "Contactez la Fondation Sauvons des Vies",
    description:
      "Retrouvez nos coordonnées et nos représentations internationales.",
    type: "website",
    siteName: "Fondation Sauvons des Vies",
  },

  robots: {
    index: true,
    follow: true,
  },
};

// ------------------------------------------------------------
// COORDONNÉES
// ------------------------------------------------------------

const CONTACT_EMAIL = "contact@sauvonsdesvies.com";

// Remplacer les numéros d'exemple par les vrais numéros.
// Les numéros ne sont pas cliquables tant qu'ils ne sont
// pas confirmés.

const PHONE_CONTACTS = [
  {
    country: "France",
    flag: "🇫🇷",
    location: "Paris",
    number: "+33 6 35 03 34 08",
    label: "Contact France",
  },
  {
    country: "États-Unis",
    flag: "🇺🇸",
    location: "Washington, D.C.",
    number: "+1 6463257236",
    label: "Contact États-Unis",
  },
  {
    country: "Royaume-Uni",
    flag: "🇬🇧",
    location: "Londres",
    number: "+44 79 8526 0404",
    label: "Contact Royaume-Uni",
  },
] as const;

// ------------------------------------------------------------
// BUREAUX INTERNATIONAUX
// ------------------------------------------------------------

const OFFICES = [
  {
    country: "Bénin",
    city: "Cotonou",
    flag: "🇧🇯",
    region: "Afrique",
  },
  {
    country: "Côte d'Ivoire",
    city: "Abidjan",
    flag: "🇨🇮",
    region: "Afrique",
  },
  {
    country: "Togo",
    city: "Lomé",
    flag: "🇹🇬",
    region: "Afrique",
  },
  {
    country: "Sénégal",
    city: "Dakar",
    flag: "🇸🇳",
    region: "Afrique",
  },
  {
    country: "Mali",
    city: "Bamako",
    flag: "🇲🇱",
    region: "Afrique",
  },
  {
    country: "Niger",
    city: "Niamey",
    flag: "🇳🇪",
    region: "Afrique",
  },
  {
    country: "Liberia",
    city: "Monrovia",
    flag: "🇱🇷",
    region: "Afrique",
  },
  {
    country: "France",
    city: "Paris",
    flag: "🇫🇷",
    region: "Europe",
  },
  {
    country: "Belgique",
    city: "Bruxelles",
    flag: "🇧🇪",
    region: "Europe",
  },
  {
    country: "Italie",
    city: "Milan",
    flag: "🇮🇹",
    region: "Europe",
  },
  {
    country: "Royaume-Uni",
    city: "Londres",
    flag: "🇬🇧",
    region: "Europe",
  },
  {
    country: "États-Unis",
    city: "Washington, D.C.",
    flag: "🇺🇸",
    region: "Amérique",
  },
] as const;

const OFFICE_REGIONS = [
  {
    name: "Afrique",
    subtitle: "Nos bureaux sur le continent africain",
  },
  {
    name: "Europe",
    subtitle: "Nos représentations européennes",
  },
  {
    name: "Amérique",
    subtitle: "Notre représentation en Amérique du Nord",
  },
] as const;

// ============================================================
// TITRE DE SECTION
// ============================================================

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 max-w-3xl">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#008FA7]">
        {eyebrow}
      </p>

      <h2 className="text-[27px] font-black leading-tight tracking-[-0.035em] text-[#092B50] sm:text-[34px]">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-[13px] leading-6 text-[#637D98] sm:text-[15px]">
          {description}
        </p>
      )}
    </div>
  );
}

// ============================================================
// HERO
// ============================================================

function ContactHero() {
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#092B50] px-5 py-6 text-white sm:px-6 sm:py-6 lg:px-6 lg:py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[48px] border-[#0BC2D4]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-12 h-64 w-64 rounded-full bg-[#0BC2D4]/10 blur-3xl"
      />

      <div className="relative z-10 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7CE3E9]">
            <MessageCircle size={16} />
            Restons en contact
          </div>

          <h1 className="text-[28px] font-black leading-[1.12] tracking-[-0.045em] sm:text-[36px] lg:text-[40px]">
            Une question ?{" "}
            <span className="text-[#6CE2EA]">
              Parlons ensemble.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-[14px] leading-[1.9] text-[#D3E2F0] sm:text-[16px]">
            Notre fondation rassemble des personnes
            engagées dans plusieurs pays. Pour une
            demande d&apos;information, une collaboration
            ou une question concernant nos actions,
            retrouvez ici nos coordonnées officielles.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-6 text-[13px] font-black text-white transition hover:bg-[#CB1935]"
            >
              <Mail size={18} />
              Nous écrire
              <ArrowRight size={17} />
            </a>

            <a
              href="#nos-bureaux"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 text-[13px] font-bold text-white transition hover:bg-white/20"
            >
              <Globe2 size={18} />
              Nos bureaux
            </a>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-[22px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex h-15 w-15 items-center justify-center rounded-2xl bg-[#0BC2D4]/20">
              <HandHeart
                size={34}
                className="text-[#7CE3E9]"
              />
            </div>

            <h2 className="mt-4 text-[21px] font-black">
              Une fondation à votre écoute
            </h2>

            <p className="mt-3 text-[13px] leading-6 text-[#D5E3F1]">
              Notre réseau international permet
              d&apos;organiser les échanges et de
              rapprocher les personnes autour de
              notre mission humanitaire.
            </p>

            <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-3 text-[12px] font-bold text-[#7CE3E9]">
              <ShieldCheck size={17} />
              Solidarité • Respect • Engagement
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// EMAIL OFFICIEL
// ============================================================

function EmailContact() {
  return (
    <section className="mt-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[20px] border border-[#DCE9F2] bg-white p-4 shadow-[0_5px_20px_rgba(9,43,80,0.04)] sm:p-5">
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-xl bg-[#E8F7FC] text-[#087FA8]">
            <Mail size={26} />
          </div>

          <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#008FA7]">
            Adresse e-mail officielle
          </p>

          <h2 className="mt-2 text-[23px] font-black text-[#092B50]">
            Écrivez-nous directement
          </h2>

          <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#6C839B]">
            Pour les demandes générales, les propositions
            de partenariat et les informations concernant
            les activités de la fondation.
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-4 inline-flex max-w-full items-center gap-2 break-all text-[15px] font-black text-[#087CF3] hover:underline sm:text-[19px]"
          >
            <Mail
              size={19}
              className="shrink-0"
            />
            {CONTACT_EMAIL}
          </a>

          <div className="mt-4">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#092B50] px-5 text-[12px] font-extrabold text-white transition hover:bg-[#12436F]"
            >
              <Send size={16} />
              Envoyer un e-mail
              <ArrowRight size={16} />
            </a>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#DCE9F2] bg-[#EAF6FC] p-4 sm:p-5">
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-xl bg-white text-[#087FA8]">
            <ShieldCheck size={26} />
          </div>

          <h2 className="text-[22px] font-black text-[#092B50]">
            Une communication responsable
          </h2>

          <p className="mt-3 text-[13px] leading-6 text-[#587792]">
            Pour faciliter le traitement de votre demande,
            indiquez clairement son objet et les
            informations utiles, sans transmettre
            publiquement de documents médicaux
            confidentiels.
          </p>

          <div className="mt-4 space-y-3">
            {[
              "Demandes d'information",
              "Propositions de collaboration",
              "Questions sur nos actions",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-[12px] font-bold text-[#315F7D]"
              >
                <CheckCircle2
                  size={17}
                  className="shrink-0 text-[#079C81]"
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// CONTACTS TÉLÉPHONIQUES
// ============================================================

function PhoneContacts() {
  return (
    <section className="mt-6">
      <SectionHeading
        eyebrow="Nos coordonnées"
        title="Contacts téléphoniques"
        description="Retrouvez les points de contact prévus pour la France, les États-Unis et le Royaume-Uni."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {PHONE_CONTACTS.map((contact) => (
          <div
            key={contact.country}
            className="rounded-[18px] border border-[#DFE9F2] bg-white p-4 shadow-[0_4px_18px_rgba(9,43,80,0.035)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-[#F0F6FA] text-[29px]">
                {contact.flag}
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7FC] text-[#087FA8]">
                <Phone size={20} />
              </div>
            </div>

            <h3 className="mt-3 text-[18px] font-black text-[#092B50]">
              {contact.label}
            </h3>

            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#7C90A5]">
              <MapPin size={14} />
              {contact.location}
            </p>

            <p className="mt-3 break-words text-[18px] font-black tracking-tight text-[#087CF3]">
              {contact.number}
            </p>

            <div className="mt-3 border-t border-[#E8EFF5] pt-4">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#8093A6]">
                <Clock3 size={15} />
                Numéro à confirmer
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] leading-6 text-[#758AA0]">
      </p>
    </section>
  );
}

// ============================================================
// NOS BUREAUX
// ============================================================

function InternationalOffices() {
  return (
    <section
      id="nos-bureaux"
      className="mt-6 scroll-mt-24"
    >
      <SectionHeading
        eyebrow="Notre présence internationale"
        title="Nos bureaux et représentations"
        description="Un réseau de membres et de représentants répartis dans plusieurs pays pour accompagner notre engagement humanitaire."
      />

      <div className="space-y-4">
        {OFFICE_REGIONS.map((region) => {
          const offices = OFFICES.filter(
            (office) =>
              office.region === region.name
          );

          return (
            <div key={region.name}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7FC] text-[#087FA8]">
                  <Globe2 size={23} />
                </div>

                <div>
                  <h3 className="text-[19px] font-black text-[#092B50]">
                    {region.name}
                  </h3>

                  <p className="text-[12px] text-[#7C90A5]">
                    {region.subtitle}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {offices.map((office) => (
                  <div
                    key={`${office.country}-${office.city}`}
                    className="group flex min-w-0 items-center gap-4 rounded-xl border border-[#DFE9F2] bg-white px-4 py-4 shadow-[0_3px_12px_rgba(9,43,80,0.03)] transition hover:border-[#A8D8E7] hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0F6FA] text-[27px]">
                      {office.flag}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-black text-[#092B50]">
                        {office.country}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#6E859C]">
                        <MapPin
                          size={13}
                          className="shrink-0 text-[#0794B3]"
                        />
                        <span className="truncate">
                          {office.city}
                        </span>
                      </p>
                    </div>

                    <Building2
                      size={17}
                      className="shrink-0 text-[#A8BCCD]"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[12px] leading-6 text-[#758AA0]">
      </p>
    </section>
  );
}

// ============================================================
// AIDE ET PARTENARIATS
// ============================================================

function ContactGuidance() {
  const options = [
    {
      title: "Vous avez besoin d'aide ?",
      description:
        "Découvrez comment présenter une demande de soutien à la fondation.",
      href: "/demander-de-laide",
      label: "Demander de l'aide",
      Icon: HandHeart,
    },
    {
      title: "Vous souhaitez contribuer ?",
      description:
        "Consultez les campagnes et participez aux initiatives solidaires.",
      href: "/campagnes",
      label: "Voir les campagnes",
      Icon: Heart,
    },
  ];

  return (
    <section className="mt-6">
      <SectionHeading
        eyebrow="Comment pouvons-nous vous aider ?"
        title="Trouvez le bon point de départ"
        description="Accédez directement aux informations utiles selon votre besoin."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {options.map(
          ({
            title,
            description,
            href,
            label,
            Icon,
          }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-[20px] border border-[#DCE9F2] bg-white p-4 shadow-sm sm:p-5"
            >
              <div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F7FC] text-[#087FA8]">
                  <Icon size={25} />
                </div>

                <h3 className="text-[21px] font-black text-[#092B50]">
                  {title}
                </h3>

                <p className="mt-3 text-[13px] leading-6 text-[#6A839B]">
                  {description}
                </p>
              </div>

              <Link
                href={href}
                className="mt-4 inline-flex w-fit items-center gap-2 text-[13px] font-extrabold text-[#087CF3] transition hover:gap-3"
              >
                {label}
                <ArrowRight size={18} />
              </Link>
            </div>
          )
        )}
      </div>
    </section>
  );
}

// ============================================================
// BANDEAU FINAL
// ============================================================

function ContactFooterBanner() {
  return (
    <section className="mt-6 rounded-[22px] bg-[#092B50] px-6 py-6 text-white sm:px-6 sm:py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#67DCE7]">
            Fondation Sauvons des Vies
          </p>

          <h2 className="text-[24px] font-black leading-tight sm:text-[30px]">
            Ensemble, faisons avancer la solidarité.
          </h2>

          <p className="mt-3 text-[13px] leading-6 text-[#C5D6E7]">
            Pour toute question, notre adresse e-mail
            officielle reste votre point de contact.
          </p>
        </div>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-6 text-[13px] font-black text-white transition hover:bg-[#CB1935]"
        >
          <Mail size={18} />
          Nous contacter
          <ChevronRight size={18} />
        </a>
      </div>
    </section>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function ContactPage() {
  return (
    <main className="w-full min-w-0 bg-[#F4F9FD]">
      <div className="h-1 w-full bg-gradient-to-r from-[#092B50] via-[#0BC2D4] to-[#087CF3]" />

      <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 lg:px-8">
        <ContactHero />

        <EmailContact />

        <PhoneContacts />

        <InternationalOffices />

        <ContactGuidance />

        <ContactFooterBanner />
      </div>
    </main>
  );
}
