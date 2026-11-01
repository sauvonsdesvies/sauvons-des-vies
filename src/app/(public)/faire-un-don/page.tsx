import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import DonationCheckout from "@/components/public/donations/DonationCheckout";
import { Suspense } from "react";

type Props = { searchParams: Promise<{ campagne?: string; montant?: string }> };

export default function Page(props: Props) {
  return <Suspense fallback={<div className="min-h-40 w-full animate-pulse bg-[#F3F8FC]" aria-busy="true" />}><Checkout {...props} /></Suspense>;
}

async function Checkout({ searchParams }: Props) {
  await connection();
  const query = await searchParams;
  if (!query.campagne || !/^[0-9a-f-]{36}$/i.test(query.campagne)) redirect("/campagnes");
  const campaign = await prisma.campaign.findUnique({ where: { id: query.campagne }, select: { id: true, title: true, slug: true, status: true, publishedAt: true, currency: true } });
  if (!campaign || campaign.status !== "PUBLISHED" || !campaign.publishedAt || campaign.currency !== "XOF") redirect("/campagnes");
  const amount = Number(query.montant);
  return <DonationCheckout campaign={campaign} defaultAmount={Number.isSafeInteger(amount) && amount >= 100 && amount <= 10000000 ? amount : 5000} />;
}
