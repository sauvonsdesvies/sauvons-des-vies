
import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import PublicationForm from "@/components/admin/dons/PublicationForm";
import RecentPublications from "@/components/admin/dons/RecentPublications";
import { listRecentPublications } from "@/lib/publications/service";

export const metadata: Metadata = {
  title: "Publication de don | Fondation Sauvons des Vies",
  description: "Publication des actions réalisées par la fondation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDonPublicationsPage() {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/connexion");

  const recentPublications = await listRecentPublications(3);

  return (
    <div className="w-full min-w-0 [overflow-wrap:anywhere]">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#092d5b] sm:text-3xl">
          Publication d&apos;une mise à jour de don
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Partagez avec transparence l&apos;utilisation des dons collectés,
          les actions réalisées et leur impact sur les bénéficiaires.
        </p>
      </header>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <PublicationForm />

        <aside className="min-w-0 space-y-5">
          <RecentPublications publications={recentPublications} />
        </aside>
      </div>
    </div>
  );
}
