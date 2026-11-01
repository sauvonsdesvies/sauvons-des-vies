"use client";

import Link from "next/link";
import { HandHeart, Mail } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const text = {
  fr: { title: "Demander de l’aide", description: "Écrivez à la fondation en précisant votre besoin et un numéro pour vous joindre.", email: "Envoyer un e-mail", contact: "Nos coordonnées" },
  en: { title: "Request help", description: "Email the foundation with your needs and a phone number where we can reach you.", email: "Send an email", contact: "Contact details" },
  de: { title: "Hilfe anfragen", description: "Schreiben Sie der Stiftung, welche Hilfe Sie benötigen, und geben Sie eine Telefonnummer an.", email: "E-Mail senden", contact: "Kontaktdaten" },
  es: { title: "Solicitar ayuda", description: "Escriba a la fundación indicando qué necesita y un teléfono de contacto.", email: "Enviar un correo", contact: "Datos de contacto" },
};
export default function Page() {
  const { language } = useTranslation();
  const t = text[language];
  return <section className="w-full min-w-0 bg-[#F3F8FC] p-4 text-[#092B50] sm:p-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <HandHeart className="mb-3 h-9 w-9 text-[#00A9BF]" aria-hidden="true" />
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t.title}</h1>
      <p className="mt-3 text-base leading-relaxed">{t.description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={`mailto:contact@sauvonsdesvies.com?subject=${encodeURIComponent(t.title)}`} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#E71E3D] px-5 py-3 font-bold text-white"><Mail className="h-5 w-5" aria-hidden="true" />{t.email}</a>
        <Link href="/contact" className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 px-5 py-3 font-semibold">{t.contact}</Link>
      </div>
    </div>
  </section>;
}
