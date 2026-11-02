"use client";

import { currencyUnit } from "@/lib/campaigns/currencies";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/public/formatters";
import type { PublicCampaignDetail } from "@/lib/public/campaign-detail-data";


import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import PaymentForm from "./PaymentForm";
import { ArrowLeft, LockKeyhole } from "lucide-react";

type CheckoutCampaign = Pick<PublicCampaignDetail, "id" | "title" | "slug" | "currency" | "imageUrl" | "shortDescription" | "collectedAmount" | "remainingAmount" | "targetAmount">;

export default function DonationCheckout({ campaign, defaultAmount }: { campaign: CheckoutCampaign; defaultAmount: number }) {
  const { language } = useTranslation();
  const lang = language === "en" || language === "de" || language === "es" ? language : "fr";
  const title = { fr: "Faire un don", en: "Make a donation", de: "Spenden", es: "Hacer una donación" }[lang];
  const [current, setCurrent] = useState(campaign);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const image = current.imageUrl && current.imageUrl !== failedImage ? current.imageUrl : "/logo/logo.png";
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch(`/api/public/campaigns/${encodeURIComponent(campaign.slug)}?lang=${lang}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const body = await response.json();
        const updated = body.campaign ?? body.data;
        if (!controller.signal.aborted && updated?.id === campaign.id) setCurrent(updated);
      } catch { /* Keep the last valid snapshot when offline. */ }
    }
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => { window.clearInterval(timer); controller.abort(); };
  }, [campaign.id, campaign.slug, lang]);
  const labels = {
    fr: ["Récolté", "Restant", "Objectif"], en: ["Raised", "Remaining", "Goal"],
    de: ["Gesammelt", "Verbleibend", "Ziel"], es: ["Recaudado", "Restante", "Objetivo"],
  }[lang];
  return <div className="w-full min-w-0 flex-1 bg-[#F3F8FC] px-3 py-3 font-sans text-[#092B50] sm:px-4 lg:px-6">
    <Link href={`/campagnes/${encodeURIComponent(campaign.slug)}`} className="mb-3 inline-flex max-w-full items-start gap-2 break-words text-sm font-semibold text-[#00869B]"><ArrowLeft className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0">{campaign.title}</span></Link>
    <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-[#092B50] px-4 py-4 text-white sm:px-6">
      <h1 className="text-xl font-extrabold sm:text-2xl">{title}</h1>
      <LockKeyhole className="h-8 w-8 text-cyan-300" aria-hidden="true" />
    </div>
    <section className="mb-4 grid overflow-hidden rounded-2xl border border-[#DCE8F1] bg-white sm:grid-cols-[240px_minmax(0,1fr)]" aria-label={current.title}>
      <div className="relative min-h-48 bg-[#EAF6FA] sm:min-h-56">
        <Image src={image} alt={current.title} fill unoptimized={image.startsWith("https://")} onError={() => { if (current.imageUrl) setFailedImage(current.imageUrl); }} sizes="(max-width: 639px) 100vw, 240px" className={image === "/logo/logo.png" ? "object-contain p-6" : "object-cover"} />
      </div>
      <div className="min-w-0 p-4 sm:p-5">
        <h2 className="text-lg font-extrabold">{current.title}</h2>
        <p className="mt-2 text-sm text-[#58718D]">{current.shortDescription}</p>
        <dl className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-3">
          {[current.collectedAmount, current.remainingAmount, current.targetAmount].map((amount, index) => <div key={index} className="min-w-0 rounded-xl bg-[#F3F8FC] p-3">
            <dt className="text-sm text-[#58718D]">{labels[index]}</dt>
            <dd className="mt-1 break-words font-bold tabular-nums">{formatMoney(amount, current.currency, lang)}</dd>
          </div>)}
        </dl>
      </div>
    </section>
    {campaign.currency === "XOF" ? <PaymentForm key={campaign.id} campaignId={campaign.id} language={lang} defaultAmount={defaultAmount} /> :
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p>{({ fr: "Paiement en ligne indisponible pour cette devise.", en: "Online payment is unavailable for this currency.", de: "Online-Zahlungen sind für diese Währung nicht verfügbar.", es: "El pago en línea no está disponible para esta moneda." })[lang]} ({currencyUnit(campaign.currency)})</p>
        <Link href="/contact" className="mt-3 inline-block font-bold text-[#00869B]">{({ fr: "Contacter la fondation", en: "Contact the foundation", de: "Stiftung kontaktieren", es: "Contactar con la fundación" })[lang]}</Link>
      </div>}
  </div>;
}
