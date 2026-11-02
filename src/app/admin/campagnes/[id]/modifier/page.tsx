import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import CampaignForm from "@/components/admin/campaigns/CampaignForm";

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/connexion");
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const campaign = await prisma.campaign.findUnique({ where: { id }, include: { photos: { orderBy: { position: "asc" } } } });
  if (!campaign) notFound();
  return <div className="w-full min-w-0 space-y-4">
    <h1 className="text-2xl font-bold">Modifier la collecte</h1>
    <CampaignForm campaignId={id} initialData={{
      currency: campaign.currency,
      title: campaign.title, shortDescription: campaign.shortDescription, description: campaign.description,
      categoryId: campaign.categoryId, countryCode: campaign.countryCode ?? "", isUrgent: campaign.isUrgent,
      targetAmount: String(campaign.targetAmount), initialCollectedAmount: String(campaign.initialCollectedAmount), initialDonorCount: String(campaign.initialDonorCount),
      startDate: campaign.startDate?.toISOString().slice(0, 10) ?? "", endDate: campaign.endDate?.toISOString().slice(0, 10) ?? "",
      status: campaign.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      photos: campaign.photos.map(photo => ({ storagePath: photo.storagePath, imageUrl: photo.imageUrl })),
    }} />
  </div>;
}
export default function Page(props: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p>Chargement…</p>}><Editor {...props} /></Suspense>;
}
