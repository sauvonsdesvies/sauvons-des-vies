
import "server-only";

import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { countryName } from "@/lib/countries";
import { countParticipants } from "@/lib/campaigns/participants";

import {
  getPublicStatistics,
} from "@/lib/statistics/service";

import type {
  HomeData,
  HomeCampaign,
  HomeCause,
  HomeNewsItem,
  HomeStatistics,
} from "./home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// SERVICE DE DONNÉES — PAGE D'ACCUEIL
// ==========================================================
//
// - Lecture côté serveur uniquement
// - Source officielle : PostgreSQL / Prisma
// - Statistiques identiques à l'administration
// - Pas de données fictives
// - Pas d'informations privées
// - Compatible Next.js 16 / Cache Components
//
// ==========================================================

// ----------------------------------------------------------
// LIMITES D'AFFICHAGE
// ----------------------------------------------------------

export const HOME_DISPLAY_LIMITS = {
  urgentCampaigns: 100,
  causes: 5,
  news: 3,
} as const;

function publicCampaignFilter() {
  const now = new Date();
  return {
    status: "PUBLISHED", publishedAt: { not: null, lte: now },
  };
}

export async function getPublicCampaignCards(options: { urgent?: boolean; category?: string; limit?: number } = {}): Promise<HomeCampaign[]> {
  await connection();
  const rows = await prisma.campaign.findMany({
    where: { ...publicCampaignFilter(), ...(options.urgent === undefined ? {} : { isUrgent: options.urgent }), ...(options.category ? { category: { slug: options.category } } : {}) },
    take: Math.min(options.limit ?? 24, 100), orderBy: { publishedAt: "desc" },
    select: {
      id: true, slug: true, title: true, shortDescription: true, imageUrl: true,
      initialCollectedAmount: true, initialDonorCount: true, countryCode: true, targetAmount: true, currency: true, isUrgent: true, startDate: true, endDate: true, completedAt: true,
      category: { select: { id: true, name: true, slug: true } },
      photos: { take: 1, orderBy: { position: "asc" }, select: { imageUrl: true } },
      donations: { where: { status: "CONFIRMED", confirmedAt: { not: null } }, select: { id: true, amount: true, currency: true, donorEmail: true } },
    },
  });
  return rows.map(({ donations: allDonations, photos, completedAt, ...row }) => {
    const donations = allDonations.filter(donation => donation.currency === row.currency);
    const collectedAmount = (row.initialCollectedAmount ?? 0) + donations.reduce((sum, donation) => sum + donation.amount, 0);
    return {
      ...row, imageUrl: row.imageUrl ?? photos[0]?.imageUrl ?? null,
      country: row.countryCode ? countryName(row.countryCode) : null,
      status: completedAt ? "COMPLETED" : row.endDate && row.endDate.toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10) ? "CLOSED" : "ACTIVE", startDate: row.startDate?.toISOString() ?? null, endDate: row.endDate?.toISOString() ?? null,
      collectedAmount, remainingAmount: Math.max(0, row.targetAmount - collectedAmount),
      progressPercentage: row.targetAmount > 0 ? Math.min(100, collectedAmount / row.targetAmount * 100) : 0,
      donorCount: (row.initialDonorCount ?? 0) + countParticipants(donations),
    };
  });
}

// ----------------------------------------------------------
// STATISTIQUES OFFICIELLES
// ----------------------------------------------------------

export async function getHomeStatistics(): Promise<HomeStatistics> {
  await connection();

  const statistics = await getPublicStatistics();

  return {
    activeCampaigns: statistics.activeCampaigns,
    beneficiariesHelped:
      statistics.beneficiariesHelped,
    verifiedFiles: statistics.verifiedFiles,
    updatedAt: statistics.updatedAt,
  };
}

// ----------------------------------------------------------
// CAMPAGNES URGENTES
// ----------------------------------------------------------
//
// Only published campaigns marked urgent are returned.

export async function getHomeUrgentCampaigns(): Promise<
  HomeCampaign[]
> {
  return getPublicCampaignCards({ urgent: true, limit: HOME_DISPLAY_LIMITS.urgentCampaigns });
}

// ----------------------------------------------------------
// CAUSES
// ----------------------------------------------------------
//
// Les catégories doivent provenir du modèle officiel
// utilisé par l'administration.
//
// Aucun nom ou visuel fictif n'est injecté.
// ----------------------------------------------------------

export async function getHomeCauses(): Promise<HomeCause[]> {
  await connection();
  const rows = await prisma.campaignCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, campaigns: { where: publicCampaignFilter(), orderBy: { publishedAt: "desc" }, select: { imageUrl: true } } },
  });
  return rows.filter((row) => row.campaigns.length > 0).map(({ campaigns, ...row }) => ({ ...row, description: null, imageUrl: campaigns.find((campaign) => campaign.imageUrl)?.imageUrl ?? null, campaignCount: campaigns.length }));
}

// ----------------------------------------------------------
// JOURNAUX ET ACTUALITÉS
// ----------------------------------------------------------
//
// Les publications devront être filtrées selon leur
// statut public avant d'être affichées.
// ----------------------------------------------------------

export async function getHomeNews(): Promise<HomeNewsItem[]> {
  await connection();
  const rows = await prisma.publication.findMany({
    where: { status: "PUBLISHED", archivedAt: null, publishedAt: { not: null, lte: new Date() } },
    orderBy: { publishedAt: "desc" }, take: 100,
    select: { id: true, slug: true, title: true, shortDescription: true, imageUrl: true, publishedAt: true },
  });
  return rows.map((row) => ({ id: row.id, slug: row.slug, title: row.title, excerpt: row.shortDescription, imageUrl: row.imageUrl, publishedAt: row.publishedAt!.toISOString() }));
}

export async function getPublicNewsBySlug(slug: string) {
  await connection();
  return prisma.publication.findFirst({
    where: { slug, status: "PUBLISHED", archivedAt: null, publishedAt: { not: null, lte: new Date() } },
    select: { title: true, shortDescription: true, content: true, imageUrl: true, publishedAt: true },
  });
}

// ----------------------------------------------------------
// DONNÉES COMPLÈTES DE LA PAGE D'ACCUEIL
// ----------------------------------------------------------

export async function getPublicHomeData(): Promise<HomeData> {
  await connection();

  const [
    statistics,
    urgentCampaigns,
    causes,
    news,
    campaigns,
  ] = await Promise.all([
    getHomeStatistics(),
    getHomeUrgentCampaigns(),
    getHomeCauses(),
    getHomeNews(),
    getPublicCampaignCards({ limit: 100 }),
  ]);

  return {
    statistics,
    urgentCampaigns,
    causes,
    news,
    campaigns,
    generatedAt: new Date().toISOString(),
  };
}

export default getPublicHomeData;
