import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import LiveRefresh from "@/components/LiveRefresh";

async function Campaigns({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/connexion");
  const query = await searchParams;
  const page = Math.max(1, Math.min(100000, Number(query.page) || 1));
  const campaigns = await prisma.campaign.findMany({ where: { status: { not: "DELETED" } }, take: 21, skip: (Math.floor(page) - 1) * 20, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, title: true, status: true } });
  return <div className="w-full min-w-0 space-y-4">
    <LiveRefresh />
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Collectes</h1><Link href="/admin/campagnes/nouvelle" className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white">Nouvelle collecte</Link></div>
    <div className="divide-y rounded-2xl border bg-white">
      {campaigns.slice(0, 20).map(campaign => <article key={campaign.id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><h2 className="break-words font-semibold">{campaign.title}</h2><p className="text-sm text-slate-500">{campaign.status === "PUBLISHED" ? "Publiée" : campaign.status === "DRAFT" ? "Brouillon" : "Clôturée"}</p></div><Link href={`/admin/campagnes/${campaign.id}/modifier`} className="shrink-0 rounded-lg border px-3 py-2 font-semibold text-blue-700">Modifier</Link></article>)}
      {!campaigns.length && <p className="p-4 text-slate-500">Aucune collecte.</p>}
    </div>
    <nav aria-label="Pagination" className="flex gap-4">{page > 1 && <Link href={`?page=${Math.floor(page) - 1}`}>Précédent</Link>}{campaigns.length > 20 && <Link href={`?page=${Math.floor(page) + 1}`}>Suivant</Link>}</nav>
  </div>;
}
export default function Page(props: { searchParams: Promise<{ page?: string }> }) {
  return <Suspense fallback={<p>Chargement…</p>}><Campaigns {...props} /></Suspense>;
}
