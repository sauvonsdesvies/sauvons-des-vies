"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import PaymentStatus from "./PaymentStatus";

export default function PaymentReturn() {
  const { language } = useTranslation();
  const lang = language === "en" || language === "de" || language === "es" ? language : "fr";
  const [payment, setPayment] = useState<{ transactionId: string; accessToken: string } | null>(null);
  const text = { fr: "Voir les collectes", en: "View fundraisers", de: "Spendenaktionen ansehen", es: "Ver recaudaciones" }[lang];
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const transactionId = new URL(window.location.href).searchParams.get("transactionId");
        if (!transactionId || !/^[a-f0-9-]{36}$/i.test(transactionId)) return;
        const stored = JSON.parse(sessionStorage.getItem(`payment:${transactionId}`) || "null");
        if (stored?.transactionId === transactionId && /^[a-f0-9]{64}$/.test(stored.accessToken)) {
          setPayment(stored);
          // Hosted-checkout return is a verification request, never proof of success.
          void fetch("/api/payments/status", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "x-payment-access-token": stored.accessToken }, body: JSON.stringify({ transactionId }) }).catch(() => {});
        }
      } catch { /* Another browser/tab cannot read the private status credential. */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return <div className="w-full min-w-0 flex-1 bg-[#F3F8FC] px-3 py-3 sm:px-4 lg:px-6">
    <PaymentStatus transactionId={payment?.transactionId || ""} accessToken={payment?.accessToken || ""} language={lang} verifyOnRefresh />
    <Link href="/campagnes" className="mt-4 inline-block font-bold text-[#00869B]">{text}</Link>
  </div>;
}
