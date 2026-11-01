
import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe2,
  HandHeart,
  Heart,
  Hospital,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

// ============================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — À PROPOS
// ============================================================
//
// Route : /a-propos
//
// Next.js 16 / App Router / TypeScript / Tailwind CSS
//
// - Responsive PC / tablette / mobile
// - Présentation institutionnelle
// - Mission et valeurs
// - Réseau international de bureaux
// - Contact officiel
// - Numéros d'exemple à remplacer
// - Aucun fichier supplémentaire
// - Header/Footer fournis par le layout public
//
// ============================================================

export const metadata: Metadata = {
  title: "À propos | Fondation Sauvons des Vies",
  description:
    "Découvrez la Fondation Sauvons des Vies, une initiative humanitaire portée par des personnes engagées dans plusieurs pays pour soutenir les malades et les personnes en difficulté.",
  openGraph: {
    title: "À propos de la Fondation Sauvons des Vies",
    description:
      "Une initiative humanitaire collective pour accompagner les personnes dans le besoin.",
    type: "website",
    siteName: "Fondation Sauvons des Vies",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ============================================================
// DONNÉES DE PRÉSENTATION
// ============================================================

const CONTACT_EMAIL = "contact@sauvonsdesvies.com";

const CONTACT_PHONES = [
  {
    country: "France",
    flag: "🇫🇷",
    number: "+33 6 35 03 34 08",
    note: "Numéro à renseigner",
  },
  {
    country: "États-Unis",
    flag: "🇺🇸",
    number: "+1 6463257236",
    note: "Numéro à renseigner",
  },
  {
    country: "Royaume-Uni",
    flag: "🇬🇧",
    number: "+44 79 8526 0404",
    note: "Numéro à renseigner",
  },
];

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

const REGIONS = [
  {
    name: "Afrique",
    subtitle: "Notre réseau sur le continent africain",
  },
  {
    name: "Europe",
    subtitle: "Notre présence européenne",
  },
  {
    name: "Amérique",
    subtitle: "Notre présence en Amérique du Nord",
  },
] as const;

// ============================================================
// PETITS COMPOSANTS
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
    <div className="mx-auto mb-4 max-w-3xl text-center">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#008FA7]">
        {eyebrow}
      </p>

      <h2 className="text-[27px] font-black leading-tight tracking-[-0.035em] text-[#092B50] sm:text-[34px]">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-[13px] leading-6 text-[#647F99] sm:text-[15px]">
          {description}
        </p>
      )}
    </div>
  );
}

// ============================================================
// EN-TÊTE
// ============================================================

function AboutHero() {
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#092B50] px-5 py-6 text-white sm:px-6 sm:py-6 lg:px-6 lg:py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[48px] border-[#0BC2D4]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-16 h-64 w-64 rounded-full bg-[#0BC2D4]/10 blur-3xl"
      />

      <div className="relative z-10 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7CE3E9]">
            <Heart size={16} />
            À propos de notre fondation
          </div>

          <h1 className="text-[28px] font-black leading-[1.12] tracking-[-0.045em] sm:text-[36px] lg:text-[40px]">
            Ensemble, nous pouvons{" "}
            <span className="text-[#6CE2EA]">
              sauver des vies.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-[14px] leading-[1.9] text-[#D3E2F0] sm:text-[16px]">
            La Fondation Sauvons des Vies est une
            initiative humanitaire collective réunissant
            des personnes engagées dans différents pays
            autour d&apos;une même conviction : personne
            ne devrait être laissé seul face à la maladie
            ou à une situation de grande difficulté.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/campagnes"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-6 text-[13px] font-black text-white transition hover:bg-[#CB1935]"
            >
              <Heart size={18} fill="currentColor" />
              Découvrir nos campagnes
              <ArrowRight size={17} />
            </Link>

            <Link
              href="#nos-bureaux"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 text-[13px] font-bold text-white transition hover:bg-white/20"
            >
              Notre réseau international
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-[22px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0BC2D4]/20">
              <HandHeart
                size={35}
                className="text-[#7CE3E9]"
              />
            </div>

            <h2 className="mt-4 text-[22px] font-black">
              Une mission commune
            </h2>

            <p className="mt-3 text-[13px] leading-6 text-[#D5E3F1]">
              Mobiliser la solidarité, soutenir les
              personnes vulnérables et favoriser
              l&apos;accès à une aide concrète.
            </p>

            <div className="mt-4 border-t border-white/15 pt-3">
              <p className="text-[12px] font-extrabold text-[#7CE3E9]">
                Solidarité • Humanité • Engagement
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// QUI SOMMES-NOUS ?
// ============================================================

function AboutStory() {
  return (
    <section className="mt-6 grid items-center gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-5">
      <div>
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#008FA7]">
          Notre histoire
        </p>

        <h2 className="max-w-2xl text-[27px] font-black leading-tight tracking-[-0.035em] text-[#092B50] sm:text-[36px]">
          Une initiative née de la volonté d&apos;aider.
        </h2>

        <p className="mt-3 text-[14px] leading-[1.7] text-[#607C98]">
          Notre initiative rassemble des femmes et des
          hommes habitués à apporter leur soutien aux
          personnes hospitalisées et aux familles
          confrontées à des difficultés.
        </p>

        <p className="mt-4 text-[14px] leading-[1.7] text-[#607C98]">
          Pour donner davantage de portée à cet
          engagement, le collectif a choisi de développer
          un réseau international et une plateforme
          permettant à chacun de participer aux actions
          solidaires.
        </p>

        <Link
          href="/transparence"
          className="mt-4 inline-flex items-center gap-2 text-[13px] font-extrabold text-[#087CF3] transition hover:gap-3"
        >
          Découvrir notre démarche
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="rounded-[22px] border border-[#DCEAF3] bg-white p-4 shadow-[0_10px_35px_rgba(9,43,80,0.055)] sm:p-5">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7FC] text-[#087FA8]">
          <Globe2 size={29} />
        </div>

        <h3 className="text-[22px] font-black text-[#092B50]">
          Une solidarité sans frontières
        </h3>

        <p className="mt-3 text-[13px] leading-6 text-[#66809A]">
          Des membres et représentants présents dans
          plusieurs pays participent à une ambition
          commune : rendre l&apos;entraide plus accessible.
        </p>

        <div className="mt-4 space-y-4 border-t border-[#E7EFF5] pt-4">
          {[
            "Une initiative portée collectivement",
            "Une attention particulière aux besoins médicaux",
            "Un engagement pour les personnes en difficulté",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3"
            >
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-[#079C81]"
              />

              <p className="text-[13px] font-semibold leading-6 text-[#375875]">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// NOTRE MISSION
// ============================================================

function AboutMission() {
  const missions = [
    {
      title: "Soutien médical",
      description:
        "Contribuer à la prise en charge de personnes confrontées à des besoins de santé urgents.",
      Icon: Hospital,
    },
    {
      title: "Aide humanitaire",
      description:
        "Accompagner les personnes et les familles traversant des situations difficiles.",
      Icon: HandHeart,
    },
    {
      title: "Mobilisation collective",
      description:
        "Rassembler des personnes de différents horizons autour d'actions solidaires.",
      Icon: UsersRound,
    },
    {
      title: "Responsabilité",
      description:
        "Encourager la vérification des demandes et une communication transparente sur les actions.",
      Icon: ShieldCheck,
    },
  ];

  return (
    <section className="mt-6">
      <SectionHeading
        eyebrow="Notre raison d'être"
        title="Nos missions et nos valeurs"
        description="Un engagement humanitaire fondé sur la solidarité, le respect et la responsabilité."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {missions.map(
          ({ title, description, Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#E1EAF3] bg-white p-4 shadow-[0_4px_18px_rgba(9,43,80,0.04)] transition hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(9,43,80,0.08)]"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F7FC] text-[#087FA8]">
                <Icon size={25} />
              </div>

              <h3 className="text-[16px] font-black text-[#092B50]">
                {title}
              </h3>

              <p className="mt-3 text-[13px] leading-6 text-[#69819A]">
                {description}
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}

// ============================================================
// BUREAUX INTERNATIONAUX
// ============================================================

function AboutOffices() {
  return (
    <section
      id="nos-bureaux"
      className="mt-6 scroll-mt-24"
    >
      <SectionHeading
        eyebrow="Notre réseau international"
        title="Nos bureaux et représentations"
        description="Une présence dans plusieurs pays pour rapprocher les membres de notre initiative et faciliter la coordination des actions."
      />

      <div className="space-y-4">
        {REGIONS.map((region) => {
          const offices = OFFICES.filter(
            (office) =>
              office.region === region.name
          );

          return (
            <div key={region.name}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F5FA] text-[#087FA8]">
                  <Globe2 size={21} />
                </div>

                <div>
                  <h3 className="text-[18px] font-black text-[#092B50]">
                    {region.name}
                  </h3>

                  <p className="text-[11px] text-[#7890A8]">
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

      <p className="mt-4 text-center text-[12px] leading-6 text-[#7A8EA2]">
      </p>
    </section>
  );
}

// ============================================================
// CONTACT
// ============================================================

function AboutContact() {
  return (
    <section
      id="contact"
      className="mt-6 scroll-mt-24"
    >
      <SectionHeading
        eyebrow="Restons en contact"
        title="Contacter notre fondation"
        description="Pour toute demande d'information, de collaboration ou de soutien, vous pouvez nous écrire à notre adresse officielle."
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {/* EMAIL */}

        <div className="rounded-[20px] bg-[#092B50] p-4 text-white sm:p-5">
          <div className="mb-4 flex h-13 w-13 items-center justify-center rounded-xl bg-white/10 text-[#76E1E8]">
            <Mail size={27} />
          </div>

          <h3 className="text-[21px] font-black">
            Notre adresse officielle
          </h3>

          <p className="mt-3 text-[13px] leading-6 text-[#C8D9E9]">
            Un point de contact unique pour les demandes
            adressées à la Fondation Sauvons des Vies.
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-4 inline-flex max-w-full items-center gap-2 break-all text-[15px] font-extrabold text-[#78E4EC] hover:underline sm:text-[19px]"
          >
            <Mail size={19} className="shrink-0" />
            {CONTACT_EMAIL}
          </a>

          <div className="mt-4 border-t border-white/15 pt-3">
            <p className="text-[12px] text-[#C3D5E7]">
              Pour les demandes liées aux campagnes,
              consultez également notre page d&apos;aide.
            </p>

            <Link
              href="/demander-de-laide"
              className="mt-3 inline-flex items-center gap-2 text-[12px] font-extrabold text-white hover:text-[#7CE3E9]"
            >
              Demander de l&apos;aide
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* TÉLÉPHONES */}

        <div className="rounded-[20px] border border-[#E0EAF3] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F7FC] text-[#087FA8]">
              <Phone size={24} />
            </div>

            <div>
              <h3 className="text-[19px] font-black text-[#092B50]">
                Contacts téléphoniques
              </h3>

              <p className="text-[12px] text-[#778CA2]">
                Coordonnées en cours de préparation
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#E8EFF5]">
            {CONTACT_PHONES.map((phone) => (
              <div
                key={phone.country}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1F6FA] text-[25px]">
                    {phone.flag}
                  </span>

                  <div>
                    <p className="text-[13px] font-extrabold text-[#092B50]">
                      {phone.country}
                    </p>

                    <p className="mt-1 text-[11px] text-[#8A9DB0]">
                      {phone.note}
                    </p>
                  </div>
                </div>

                <span className="text-[13px] font-bold text-[#6D8298]">
                  {phone.number}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-lg bg-[#F2F7FB] px-4 py-3 text-[11px] leading-6 text-[#758AA0]">
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// BANDEAU FINAL
// ============================================================

function AboutFinalBanner() {
  return (
    <section className="mt-6 rounded-[22px] bg-[#E7F5FB] px-6 py-6 sm:px-6 sm:py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#008FA7]">
            Rejoignez notre élan de solidarité
          </p>

          <h2 className="text-[24px] font-black leading-tight text-[#092B50] sm:text-[30px]">
            Chaque geste peut faire la différence.
          </h2>

          <p className="mt-3 text-[13px] leading-6 text-[#627E98]">
            Découvrez les campagnes et contribuez, à
            votre échelle, à soutenir les personnes
            qui en ont besoin.
          </p>
        </div>

        <Link
          href="/campagnes"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-6 text-[13px] font-black text-white transition hover:bg-[#CB1935]"
        >
          <Heart size={18} fill="currentColor" />
          Soutenir une campagne
          <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function AboutPage() {
  return (
    <main className="w-full min-w-0 bg-[#F4F9FD]">
      <div className="h-1 w-full bg-gradient-to-r from-[#092B50] via-[#0BC2D4] to-[#087CF3]" />

      <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 lg:px-8">
        <AboutHero />

        <AboutStory />

        <AboutMission />

        <AboutOffices />

        <AboutContact />

        <AboutFinalBanner />
      </div>
    </main>
  );
}
