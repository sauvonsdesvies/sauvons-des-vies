
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getPublishedCampaignBySlug } from "@/lib/campaigns/service";
import PublicCampaignDetail from "@/components/public/campaigns/PublicCampaignDetail";


type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const campaign = await getPublishedCampaignBySlug(slug);

  if (!campaign) {
    return {
      title: "Collecte introuvable | Fondation Sauvons des Vies",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${campaign.title} | Fondation Sauvons des Vies`,
    description: campaign.shortDescription,
    openGraph: {
      title: campaign.title,
      description: campaign.shortDescription,
      type: "article",
      images: campaign.imageUrl
        ? [{ url: campaign.imageUrl }]
        : [],
    },
  };
}

async function PublicCampaignContent({ params }: Props) {
  await connection();

  const { slug } = await params;
  const campaign = await getPublishedCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  return <PublicCampaignDetail campaign={campaign} />;
}

export default function PublicCampaignPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-6">Chargement de la collecte...</p>}>
      <PublicCampaignContent {...props} />
    </Suspense>
  );
}
