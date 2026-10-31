
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { CampaignCreateInput } from "@/types/campaign";
import { getConfirmedCampaignProgress } from "./progress";
import { getCampaignPhotoUrl } from "./storage";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

export async function createCampaign(input: CampaignCreateInput) {
  const category = await prisma.campaignCategory.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new Error("La catégorie sélectionnée n'existe pas.");
  }

  const slug = `${slugify(input.title) || "collecte"}-${randomUUID().slice(0, 8)}`;

  const photos = input.photos.map((photo) => ({
    storagePath: photo.storagePath,
    imageUrl: getCampaignPhotoUrl(photo.storagePath),
  }));

  const campaign = await prisma.campaign.create({
    data: {
      countryCode: input.countryCode || null,
      isUrgent: input.isUrgent ?? false,
      title: input.title,
      slug,
      shortDescription: input.shortDescription,
      description: input.description,
      targetAmount: input.targetAmount,
      currency: "XOF",
      status: input.status,
      categoryId: input.categoryId,
      beneficiaryId: null,
      imageUrl: photos[0]?.imageUrl ?? null,
      startDate: input.startDate
        ? new Date(`${input.startDate}T00:00:00.000Z`)
        : null,
      endDate: input.endDate
        ? new Date(`${input.endDate}T00:00:00.000Z`)
        : null,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      photos: {
        create: photos.map((photo, position) => ({
          storagePath: photo.storagePath,
          imageUrl: photo.imageUrl,
          position,
        })),
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  return campaign;
}

export async function getPublishedCampaignBySlug(slug: string) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: { not: null },
    },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      photos: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          imageUrl: true,
          position: true,
        },
      },
    },
  });

  if (!campaign) return null;

  const progress = await getConfirmedCampaignProgress(
    campaign.id,
    campaign.targetAmount
  );

  return {
    countryCode: campaign.countryCode,
    isUrgent: campaign.isUrgent,
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    shortDescription: campaign.shortDescription,
    description: campaign.description,
    targetAmount: campaign.targetAmount,
    currency: campaign.currency,
    imageUrl: campaign.imageUrl,
    category: campaign.category,
    photos: campaign.photos,
    startDate: campaign.startDate?.toISOString() ?? null,
    endDate: campaign.endDate?.toISOString() ?? null,
    publishedAt: campaign.publishedAt?.toISOString() ?? null,
    progress,
  };
}
