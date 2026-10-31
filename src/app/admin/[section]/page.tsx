import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { adminNavigation } from "@/lib/admin-navigation";

type Props = { params: Promise<{ section: string }> };

// Les routes déjà développées restent prioritaires sur cette page d’attente.
export function generateStaticParams() {
  return adminNavigation
    .filter((item) => item.href !== "/admin" && item.href !== "/admin/categories")
    .map((item) => ({ section: item.href.split("/")[2] }));
}

export const metadata = {
  title: "Administration | Fondation Sauvons des Vies",
  robots: { index: false, follow: false },
};

async function SectionContent({ params }: Props) {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/connexion");
  const { section } = await params;
  const item = adminNavigation.find((entry) => entry.href === `/admin/${section}`);
  if (!item) notFound();

  return (
    <div className="w-full min-w-0 space-y-5">
      <header>
        <h1>{item.label}</h1>
        <p className="mt-2 text-sm text-slate-600">Espace de gestion de la fondation.</p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2>En cours de développement</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Cette rubrique sera disponible prochainement. Vous pouvez continuer à utiliser les fonctionnalités déjà disponibles.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {item.children?.map((child) => (
            <Link key={child.href} href={child.href} className="rounded-xl bg-[#0868DB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              {child.label === "Nouvelle collecte" ? "Créer une collecte" : child.label}
            </Link>
          ))}
          <Link href="/admin" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#082B52] transition hover:bg-slate-50">
            Retour au tableau de bord
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function AdminSectionPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-4">Chargement de la rubrique...</p>}>
      <SectionContent {...props} />
    </Suspense>
  );
}
