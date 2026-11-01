
import "server-only";
import { countParticipants } from "@/lib/campaigns/participants";
import { connection } from "next/server";

import { prisma } from "@/lib/prisma";

// ==========================================================
// FONDATION SAUVONS DES VIES
// DONNÉES PUBLIQUES — CAMPAGNES DE DONS
// ==========================================================
//
// Source : PostgreSQL / Prisma 7 / Supabase
//
// - Campagnes publiées uniquement
// - Campagnes urgentes et ordinaires
// - Recherche par titre et description
// - Filtrage par catégorie, statut et pays
// - Tri et pagination
// - Dons confirmés uniquement
// - Montants par devise, sans conversion fictive
// - Aucune donnée personnelle exposée
// - Aucun montant inventé
//
// ==========================================================

// ----------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 60;

const CONFIRMED_DONATION_STATUS = "CONFIRMED";

const PUBLISHED_CAMPAIGN_STATUS = "PUBLISHED";

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

export type PublicCampaignPriority =
  | "URGENT"
  | "PRIORITY"
  | "NORMAL";

export type PublicCampaignStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "CLOSED";

export type PublicCampaignSort =
  | "newest"
  | "oldest"
  | "most-funded"
  | "least-funded"
  | "ending-soon";

export type PublicCampaignQuery = {
  search?: string;
  category?: string;
  status?: string;
  country?: string;
  sort?: PublicCampaignSort;
  page?: number;
  pageSize?: number;
};

export type PublicCampaignCategory = {
  id: string;
  name: string;
  slug: string;
  campaignCount: number;
};

export type PublicCampaign = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  imageUrl: string | null;

  category: {
    id: string;
    name: string;
    slug: string;
  } | null;

  country: string | null;

  targetAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  donorCount: number;

  currency: string;

  isUrgent: boolean;
  priority: PublicCampaignPriority;
  status: PublicCampaignStatus;

  startDate: string | null;
  endDate: string | null;
};

export type PublicCampaignPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PublicCampaignsResult = {
  campaigns: PublicCampaign[];
  pagination: PublicCampaignPagination;
  categories: PublicCampaignCategory[];
};

// ----------------------------------------------------------
// NORMALISATION
// ----------------------------------------------------------

function normalizePage(value?: number): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    return 1;
  }

  return value;
}

function normalizePageSize(value?: number): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(value, MAX_PAGE_SIZE);
}

function normalizeText(
  value: string | undefined,
  maxLength = 200
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

// ----------------------------------------------------------
// CALCUL DES MONTANTS
// ----------------------------------------------------------

function calculateProgress(
  collected: number,
  target: number
): number {
  if (target <= 0) {
    return 0;
  }

  const percentage = (collected / target) * 100;

  return Math.min(
    100,
    Math.max(0, Math.round(percentage))
  );
}

function calculateRemaining(
  collected: number,
  target: number
): number {
  return Math.max(0, target - collected);
}

// ----------------------------------------------------------
// STATUT PUBLIC D'UNE CAMPAGNE
// ----------------------------------------------------------

function resolvePublicStatus(
  campaign: {
    completedAt: Date | null;
    endDate: Date | null;
  },
  collectedAmount: number,
  targetAmount: number,
  now: Date
): PublicCampaignStatus {
  if (
    campaign.completedAt !== null ||
    (
      targetAmount > 0 &&
      collectedAmount >= targetAmount
    )
  ) {
    return "COMPLETED";
  }

  if (
    campaign.endDate !== null &&
    campaign.endDate.getTime() < now.getTime()
  ) {
    return "CLOSED";
  }

  return "ACTIVE";
}

// ----------------------------------------------------------
// PRIORITÉ PUBLIQUE
// ----------------------------------------------------------

function resolvePriority(
  isUrgent: boolean
): PublicCampaignPriority {
  return isUrgent ? "URGENT" : "NORMAL";
}

// ----------------------------------------------------------
// LECTURE DES CATÉGORIES
// ----------------------------------------------------------

async function getPublicCategories(): Promise<
  PublicCampaignCategory[]
> {
  const categories =
    await prisma.campaignCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            campaigns: {
              where: {
                status: PUBLISHED_CAMPAIGN_STATUS,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

  return categories
    .filter((category) => category._count.campaigns > 0)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      campaignCount: category._count.campaigns,
    }));
}

// ----------------------------------------------------------
// FONCTION PRINCIPALE
// ----------------------------------------------------------

export async function getPublicCampaigns(
  query: PublicCampaignQuery = {}
): Promise<PublicCampaignsResult> {
  await connection();
  const page = normalizePage(query.page);
  const pageSize = normalizePageSize(query.pageSize);

  const search = normalizeText(query.search);
  const category = normalizeText(query.category, 100);
  const status = normalizeText(query.status, 50);
  const country = normalizeText(query.country, 100);

  const sort: PublicCampaignSort =
    query.sort ?? "newest";

  const now = new Date();

  // --------------------------------------------------------
  // FILTRE DE PUBLICATION
  // --------------------------------------------------------

  const where = {
    status: PUBLISHED_CAMPAIGN_STATUS,

    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              shortDescription: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(category
      ? {
          category: {
            slug: category,
          },
        }
      : {}),

    ...(country
      ? {
          countryCode: {
            equals: country,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  // --------------------------------------------------------
  // LECTURE DES CAMPAGNES
  // --------------------------------------------------------

  const [campaignRecords, categories] =
    await Promise.all([
      prisma.campaign.findMany({
        where,

        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          imageUrl: true,
          countryCode: true,
          targetAmount: true,
  initialCollectedAmount: true, initialDonorCount: true,
          currency: true,
          isUrgent: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          publishedAt: true,
          completedAt: true,

          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

          photos: {
            select: {
              imageUrl: true,
            },
            orderBy: {
              position: "asc",
            },
            take: 1,
          },

          donations: {
            where: {
              status: CONFIRMED_DONATION_STATUS,
              confirmedAt: {
                not: null,
              },
            },
            select: {
              id: true, donorEmail: true, amount: true,
              currency: true,
            },
          },
        },
      }),

      getPublicCategories(),
    ]);

  // --------------------------------------------------------
  // TRANSFORMATION EN DONNÉES PUBLIQUES
  // --------------------------------------------------------

  let campaigns = campaignRecords.map(
    (campaign): PublicCampaign & {
      _createdAt: number;
      _endAt: number | null;
    } => {
      // Les dons sont comptabilisés uniquement
      // dans la devise de la campagne.
      // Aucune conversion fictive.

      const confirmedDonations =
        campaign.donations.filter(
          (donation) =>
            donation.currency === campaign.currency &&
            donation.amount > 0
        );

      const collectedAmount =
        (campaign.initialCollectedAmount ?? 0) + confirmedDonations.reduce(
          (total, donation) =>
            total + donation.amount,
          0
        );

      const targetAmount = Math.max(
        0,
        campaign.targetAmount
      );

      const publicStatus = resolvePublicStatus(
        campaign,
        collectedAmount,
        targetAmount,
        now
      );

      return {
        id: campaign.id,
        slug: campaign.slug,
        title: campaign.title,
        shortDescription:
          campaign.shortDescription,

        imageUrl:
          campaign.imageUrl ||
          campaign.photos[0]?.imageUrl ||
          null,

        category: campaign.category,

        country: campaign.countryCode,

        targetAmount,
        collectedAmount,

        remainingAmount: calculateRemaining(
          collectedAmount,
          targetAmount
        ),

        progressPercentage: calculateProgress(
          collectedAmount,
          targetAmount
        ),

        donorCount: (campaign.initialDonorCount ?? 0) + countParticipants(confirmedDonations),

        currency: campaign.currency,

        isUrgent: campaign.isUrgent,

        priority: resolvePriority(
          campaign.isUrgent
        ),

        status: publicStatus,

        startDate:
          campaign.startDate?.toISOString() ?? null,

        endDate:
          campaign.endDate?.toISOString() ?? null,

        _createdAt:
          (
            campaign.publishedAt ??
            campaign.createdAt
          ).getTime(),

        _endAt:
          campaign.endDate?.getTime() ?? null,
      };
    }
  );

  // --------------------------------------------------------
  // FILTRE PAR STATUT PUBLIC
  // --------------------------------------------------------

  if (status) {
    const normalizedStatus =
      status.toUpperCase();

    if (
      normalizedStatus === "ACTIVE" ||
      normalizedStatus === "COMPLETED" ||
      normalizedStatus === "CLOSED"
    ) {
      campaigns = campaigns.filter(
        (campaign) =>
          campaign.status === normalizedStatus
      );
    }
  }

  // --------------------------------------------------------
  // TRI
  // --------------------------------------------------------

  switch (sort) {
    case "oldest":
      campaigns.sort(
        (a, b) =>
          a._createdAt - b._createdAt
      );
      break;

    case "most-funded":
      campaigns.sort(
        (a, b) =>
          b.collectedAmount - a.collectedAmount
      );
      break;

    case "least-funded":
      campaigns.sort(
        (a, b) =>
          a.collectedAmount - b.collectedAmount
      );
      break;

    case "ending-soon":
      campaigns.sort(
        (a, b) =>
          (a._endAt ?? Number.MAX_SAFE_INTEGER) -
          (b._endAt ?? Number.MAX_SAFE_INTEGER)
      );
      break;

    case "newest":
    default:
      campaigns.sort(
        (a, b) =>
          b._createdAt - a._createdAt
      );
      break;
  }

  // --------------------------------------------------------
  // PAGINATION
  // --------------------------------------------------------

  const total = campaigns.length;

  const totalPages = Math.ceil(
    total / pageSize
  );

  const startIndex = (page - 1) * pageSize;

  const paginatedCampaigns =
    campaigns.slice(
      startIndex,
      startIndex + pageSize
    );

  // --------------------------------------------------------
  // SUPPRESSION DES CHAMPS INTERNES
  // --------------------------------------------------------

  const publicCampaigns: PublicCampaign[] =
    paginatedCampaigns.map(
      ({
        _createdAt: _unusedCreatedAt,
        _endAt: _unusedEndAt,
        ...campaign
      }) => {
        void _unusedCreatedAt;
        void _unusedEndAt;

        return campaign;
      }
    );

  // --------------------------------------------------------
  // RÉSULTAT
  // --------------------------------------------------------

  return {
    campaigns: publicCampaigns,

    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage:
        page > 1 && totalPages > 0,
    },

    categories,
  };
}

export default getPublicCampaigns;
