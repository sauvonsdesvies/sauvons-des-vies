import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import type { Metadata } from "next";
import { Suspense } from "react";

import BeneficiairesPage from "@/components/admin/beneficiaires/BeneficiairesPage";
import { getPublicStatistics } from "@/lib/statistics/service";

export const metadata: Metadata = {
  title: "Bénéficiaires | Fondation Sauvons des Vies",
  description:
    "Gestion des statistiques officielles de la Fondation Sauvons des Vies.",
  robots: {
    index: false,
    follow: false,
  },
};

// Chargement des statistiques depuis la base de données.
async function BeneficiairesContent() {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/connexion");
  const statistics = await getPublicStatistics();

  return (
    <BeneficiairesPage
      initialStatistics={statistics}
    />
  );
}

// Affichage temporaire pendant le chargement.
function BeneficiairesLoading() {
  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-8 w-72 max-w-full rounded bg-slate-200" />
        <div className="h-4 w-full max-w-lg rounded bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="h-5 w-20 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-36 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}

// Page principale compatible avec la navigation Next.js.
export default function AdminBeneficiairesPage() {
  return (
    <Suspense fallback={<BeneficiairesLoading />}>
      <BeneficiairesContent />
    </Suspense>
  );
}