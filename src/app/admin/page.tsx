
import "server-only";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tableau de bord | Fondation Sauvons des Vies",
  robots: { index: false, follow: false },
};

import { connection } from "next/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

import AdminDashboard from "@/components/admin/dashboard/AdminDashboard";
import { getAdminDashboardData } from "@/lib/admin-dashboard";

import type {
  DashboardPeriod,
} from "@/types/admin-dashboard";

/**
 * FONDATION SAUVONS DES VIES
 * Page principale du tableau de bord administrateur.
 *
 * Next.js 16
 * Rendu dynamique côté serveur.
 * Données réelles : Prisma / Supabase.
 * Administration : français uniquement.
 */

const VALID_PERIODS: readonly DashboardPeriod[] = [
  "current_month",
  "previous_month",
  "last_3_months",
  "last_6_months",
  "current_year",
  "all",
];

function normalizeDashboardPeriod(
  value: string | string[] | undefined,
): DashboardPeriod {
  if (typeof value !== "string") {
    return "current_month";
  }

  if (
    VALID_PERIODS.includes(
      value as DashboardPeriod,
    )
  ) {
    return value as DashboardPeriod;
  }

  return "current_month";
}

interface AdminPageProps {
  searchParams: Promise<{
    periode?: string | string[];
  }>;
}

async function AdminPageContent({
  searchParams,
}: AdminPageProps) {
  /**
   * Empêche Next.js de pré-générer cette page.
   * Les données sont récupérées lors de la requête.
   */
  await connection();
  const session = await getAdminSession();
  if (!session) redirect("/admin/connexion");

  /**
   * SÉCURITÉ :
   *
   * La vérification de session administrateur doit
   * impérativement être effectuée ici, avant l'accès
   * aux données du Dashboard.
   *
   * Réutiliser le système de session déjà présent
   * dans le projet. Ne pas créer une nouvelle
   * authentification parallèle.
   */

  /**
   * Récupération des paramètres de recherche.
   */
  const params = await searchParams;

  /**
   * Validation de la période sélectionnée.
   */
  const period = normalizeDashboardPeriod(
    params.periode,
  );

  /**
   * Lecture des données réelles de Supabase
   * à travers Prisma.
   */
  const data = await getAdminDashboardData(period);

  /**
   * Affichage du tableau de bord responsive.
   */
  return <AdminDashboard data={data} />;
}

export default function AdminPage(props: AdminPageProps) {
  return (
    <Suspense fallback={<p className="p-6">Chargement du tableau de bord...</p>}>
      <AdminPageContent {...props} />
    </Suspense>
  );
}
