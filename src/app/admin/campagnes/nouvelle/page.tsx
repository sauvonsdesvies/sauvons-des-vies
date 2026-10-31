
import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import CampaignCreatePage from "@/components/admin/campaigns/CampaignCreatePage";

export const metadata: Metadata = {
  title: "Nouvelle collecte | Fondation Sauvons des Vies",
  description: "Création et publication d'une collecte de dons.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NewCampaignPage() {
  await connection();
  const session = await getAdminSession();
  if (!session) redirect("/admin/connexion");

  return <CampaignCreatePage />;
}
