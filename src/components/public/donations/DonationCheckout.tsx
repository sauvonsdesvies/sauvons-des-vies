"use client";

import { currencyUnit } from "@/lib/campaigns/currencies";


import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import PaymentForm from "./PaymentForm";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export default function DonationCheckout({ campaign, defaultAmount }: { campaign: { id: string; title: string; slug: string; currency: string }; defaultAmount: number }) {
  const { language } = useTranslation();
  const lang = language === "en" || language === "de" || language === "es" ? language : "fr";
  const title = { fr: "Faire un don", en: "Make a donation", de: "Spenden", es: "Hacer una donación" }[lang];
  return <div className="w-full min-w-0 flex-1 bg-[#F3F8FC] px-3 py-3 font-sans text-[#092B50] sm:px-4 lg:px-6">
    <Link href={`/campagnes/${encodeURIComponent(campaign.slug)}`} className="mb-3 inline-flex max-w-full items-start gap-2 break-words text-sm font-semibold text-[#00869B]"><ArrowLeft className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0">{campaign.title}</span></Link>
    <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-[#092B50] px-4 py-4 text-white sm:px-6">
      <h1 className="text-xl font-extrabold sm:text-2xl">{title}</h1>
      <LockKeyhole className="h-8 w-8 text-cyan-300" aria-hidden="true" />
    </div>
    {campaign.currency === "XOF" ? <PaymentForm key={campaign.id} campaignId={campaign.id} language={lang} defaultAmount={defaultAmount} /> :
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p>{({ fr: "Paiement en ligne indisponible pour cette devise.", en: "Online payment is unavailable for this currency.", de: "Online-Zahlungen sind für diese Währung nicht verfügbar.", es: "El pago en línea no está disponible para esta moneda." })[lang]} ({currencyUnit(campaign.currency)})</p>
        <Link href="/contact" className="mt-3 inline-block font-bold text-[#00869B]">{({ fr: "Contacter la fondation", en: "Contact the foundation", de: "Stiftung kontaktieren", es: "Contactar con la fundación" })[lang]}</Link>
      </div>}
  </div>;
}
