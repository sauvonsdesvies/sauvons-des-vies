import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

import type { Metadata } from "next";
import { connection } from "next/server";
import RequestsPage from "@/components/admin/requests/RequestsPage";

export const metadata: Metadata = {
  title: "Demandes de don | Fondation Sauvons des Vies",
  description: "Gestion des demandes de don de la fondation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRequestsPage() {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/connexion");

  return <RequestsPage />;
}
