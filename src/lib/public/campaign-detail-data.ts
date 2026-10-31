
import "server-only";

import { prisma } from "@/lib/prisma";

// ==========================================================
// FONDATION SAUVONS DES VIES
// SERVICE PRISMA — DÉTAIL D'UNE CAMPAGNE PUBLIQUE
// ==========================================================
//
// Utilisé par :
// - /campagnes/[slug]
// - /api/public/campaigns/[slug]
//
// Fonctionnalités :
// - Campagne publiée uniquement
// - Galerie de photos réelles
// - Catégorie et bénéficiaire
// - Dons confirmés
// - Montant collecté, restant et pourcentage
// - Nombre de dons confirmés
// - Dates et état de la collecte
// - Publications publiques associées
// - Campagnes similaires
//
// Aucune donnée administrative privée.
// Aucune donnée bancaire.
// Aucune donnée fictive.
//
// ==========================================================

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------

const PUBLISHED_CAMPAIGN_STATUS = "PUBLISHED";
const CONFIRMED_DONATION_STATUS = "CONFIRMED";
const PUBLISHED_PUBLICATION_STATUS = "PUBLISHED";

const MAX_SIMILAR_CAMPAIGNS = 6;
const MAX_CAMPAIGN_PHOTOS = 5;
const MAX_UPDATES = 20;

// ----------------------------------------------------------
// TYPES PUBLICS
// ----------------------------------------------------------

export type PublicCampaignDetailStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "CLOSED";

export type PublicCampaignDetailPriority =
  | "URGENT"
  | "PRIORITY"
  | "NORMAL";

export type PublicCampaignDetailCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicCampaignDetailPhoto = {
  id: string;
  imageUrl: string;
  position: number;
};

export type PublicCampaignDetailBeneficiary = {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  country: string | null;
};

export type PublicCampaignDetailUpdate = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  category: string;
  imageUrl: string | null;
  publishedAt: string | null;
};

export type PublicCampaignDetailSimilar = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  imageUrl: string | null;

  category: PublicCampaignDetailCategory | null;
  country: string | null;

  currency: string;
  targetAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  donorCount: number;

  isUrgent: boolean;
  status: PublicCampaignDetailStatus;
};

export type PublicCampaignDetail = {
  id: string;
  slug: string;

  title: string;
  shortDescription: string;
  description: string;

  imageUrl: string | null;
  photos: PublicCampaignDetailPhoto[];

  category: PublicCampaignDetailCategory | null;
  beneficiary: PublicCampaignDetailBeneficiary | null;

  country: string | null;
  countryCode: string | null;

  currency: string;
  targetAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  donorCount: number;

  isUrgent: boolean;
  priority: PublicCampaignDetailPriority;
  status: PublicCampaignDetailStatus;

  startDate: string | null;
  endDate: string | null;
  publishedAt: string | null;
  completedAt: string | null;

  updates: PublicCampaignDetailUpdate[];
  similarCampaigns: PublicCampaignDetailSimilar[];
};

// ----------------------------------------------------------
// TYPES INTERNES
// ----------------------------------------------------------

type DonationSummary = {
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  donorCount: number;
};

type CampaignStatusInput = {
  completedAt: Date | null;
  endDate: Date | null;
  targetAmount: number;
  collectedAmount: number;
};

// ----------------------------------------------------------
// OUTILS
// ----------------------------------------------------------

function toIsoString(
  value: Date | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString();
}

function normalizeSlug(value: string): string {
  return value.trim();
}

function isValidSlug(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 200 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)
  );
}

function safeAmount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function calculateProgress(
  collectedAmount: number,
  targetAmount: number
): number {
  if (targetAmount <= 0) {
    return 0;
  }

  const percentage =
    (collectedAmount / targetAmount) * 100;

  return Math.min(
    100,
    Math.max(0, Math.round(percentage))
  );
}

function calculateDonationSummary(
  donations: Array<{
    amount: number;
    currency: string;
  }>,
  targetAmount: number,
  campaignCurrency: string
): DonationSummary {
  let collectedAmount = 0;
  let donorCount = 0;

  for (const donation of donations) {
    // Les montants de devises différentes
    // ne sont jamais additionnés directement.
    //
    // La conversion doit être effectuée
    // par le système de paiement si nécessaire.

    if (
      donation.currency !== campaignCurrency
    ) {
      continue;
    }

    const amount = safeAmount(
      donation.amount
    );

    if (amount <= 0) {
      continue;
    }

    collectedAmount += amount;
    donorCount += 1;
  }

  const remainingAmount = Math.max(
    0,
    targetAmount - collectedAmount
  );

  return {
    collectedAmount,
    remainingAmount,
    progressPercentage: calculateProgress(
      collectedAmount,
      targetAmount
    ),
    donorCount,
  };
}

function getCampaignStatus(
  campaign: CampaignStatusInput,
  now: Date
): PublicCampaignDetailStatus {
  if (
    campaign.completedAt !== null ||
    (campaign.targetAmount > 0 &&
      campaign.collectedAmount >=
        campaign.targetAmount)
  ) {
    return "COMPLETED";
  }

  if (
    campaign.endDate !== null &&
    campaign.endDate.getTime() <
      now.getTime()
  ) {
    return "CLOSED";
  }

  return "ACTIVE";
}

function getPriority(
  isUrgent: boolean
): PublicCampaignDetailPriority {
  return isUrgent
    ? "URGENT"
    : "NORMAL";
}

function normalizeImageUrl(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const imageUrl = value.trim();

  if (!imageUrl) {
    return null;
  }

  // Les images sont récupérées telles qu'elles
  // sont enregistrées dans la base.
  //
  // On accepte les URLs HTTPS ainsi que les
  // chemins locaux publics du projet.

  if (
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("/")
  ) {
    return imageUrl;
  }

  return null;
}

// ----------------------------------------------------------
// SÉLECTION PRISMA
// ----------------------------------------------------------

const CAMPAIGN_SELECT = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  description: true,

  imageUrl: true,

  countryCode: true,
  currency: true,

  targetAmount: true,
  isUrgent: true,

  startDate: true,
  endDate: true,
  publishedAt: true,
  completedAt: true,

  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },

  beneficiary: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      city: true,
      country: true,
    },
  },

  photos: {
    orderBy: {
      position: "asc",
    },
    take: MAX_CAMPAIGN_PHOTOS,
    select: {
      id: true,
      imageUrl: true,
      position: true,
    },
  },

  donations: {
    where: {
      status: CONFIRMED_DONATION_STATUS,
      confirmedAt: {
        not: null,
      },
    },
    select: {
      amount: true,
      currency: true,
    },
  },

  updates: {
    where: {
      publication: {
        status: PUBLISHED_PUBLICATION_STATUS,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: MAX_UPDATES,
    select: {
      publication: {
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          content: true,
          category: true,
          imageUrl: true,
          publishedAt: true,
        },
      },
    },
  },
} as const;

// ----------------------------------------------------------
// SÉLECTION DES CAMPAGNES SIMILAIRES
// ----------------------------------------------------------

const SIMILAR_CAMPAIGN_SELECT = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,

  imageUrl: true,
  countryCode: true,

  currency: true,
  targetAmount: true,
  isUrgent: true,

  endDate: true,
  completedAt: true,

  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },

  photos: {
    orderBy: {
      position: "asc",
    },
    take: 1,
    select: {
      imageUrl: true,
    },
  },

  donations: {
    where: {
      status: CONFIRMED_DONATION_STATUS,
      confirmedAt: {
        not: null,
      },
    },
    select: {
      amount: true,
      currency: true,
    },
  },
} as const;

// ----------------------------------------------------------
// GALERIE
// ----------------------------------------------------------

function buildGallery(
  campaignId: string,
  mainImage: string | null,
  photos: Array<{
    id: string;
    imageUrl: string;
    position: number;
  }>
): PublicCampaignDetailPhoto[] {
  const gallery: PublicCampaignDetailPhoto[] = [];

  const seen = new Set<string>();

  const primaryImage =
    normalizeImageUrl(mainImage);

  if (primaryImage) {
    gallery.push({
      id: `main-${campaignId}`,
      imageUrl: primaryImage,
      position: -1,
    });

    seen.add(primaryImage);
  }

  for (const photo of photos) {
    const imageUrl = normalizeImageUrl(
      photo.imageUrl
    );

    if (
      !imageUrl ||
      seen.has(imageUrl)
    ) {
      continue;
    }

    gallery.push({
      id: photo.id,
      imageUrl,
      position: photo.position,
    });

    seen.add(imageUrl);

    if (
      gallery.length >= MAX_CAMPAIGN_PHOTOS
    ) {
      break;
    }
  }

  return gallery.slice(
    0,
    MAX_CAMPAIGN_PHOTOS
  );
}

// ----------------------------------------------------------
// PUBLICATIONS
// ----------------------------------------------------------

function buildUpdates(
  updates: Array<{
    publication: {
      id: string;
      title: string;
      slug: string;
      shortDescription: string;
      content: string;
      category: string;
      imageUrl: string | null;
      publishedAt: Date | null;
    };
  }>
): PublicCampaignDetailUpdate[] {
  const result: PublicCampaignDetailUpdate[] =
    [];

  const seen = new Set<string>();

  for (const update of updates) {
    const publication =
      update.publication;

    if (
      !publication ||
      seen.has(publication.id)
    ) {
      continue;
    }

    result.push({
      id: publication.id,
      title: publication.title,
      slug: publication.slug,
      shortDescription:
        publication.shortDescription,
      content: publication.content,
      category: publication.category,
      imageUrl: normalizeImageUrl(
        publication.imageUrl
      ),
      publishedAt: toIsoString(
        publication.publishedAt
      ),
    });

    seen.add(publication.id);
  }

  return result;
}

// ----------------------------------------------------------
// CAMPAGNES SIMILAIRES
// ----------------------------------------------------------

async function getSimilarCampaigns(
  campaignId: string,
  categoryId: string,
  now: Date
): Promise<PublicCampaignDetailSimilar[]> {
  const similarCampaigns =
    await prisma.campaign.findMany({
      where: {
        status: PUBLISHED_CAMPAIGN_STATUS,
        id: {
          not: campaignId,
        },
        categoryId,
      },

      orderBy: [
        {
          isUrgent: "desc",
        },
        {
          publishedAt: "desc",
        },
      ],

      take: MAX_SIMILAR_CAMPAIGNS,

      select: SIMILAR_CAMPAIGN_SELECT,
    });

  return similarCampaigns.map(
    (campaign): PublicCampaignDetailSimilar => {
      const targetAmount = safeAmount(
        campaign.targetAmount
      );

      const summary =
        calculateDonationSummary(
          campaign.donations,
          targetAmount,
          campaign.currency
        );

      const status = getCampaignStatus(
        {
          completedAt:
            campaign.completedAt,
          endDate: campaign.endDate,
          targetAmount,
          collectedAmount:
            summary.collectedAmount,
        },
        now
      );

      const imageUrl =
        normalizeImageUrl(
          campaign.imageUrl
        ) ??
        normalizeImageUrl(
          campaign.photos[0]?.imageUrl
        );

      return {
        id: campaign.id,
        slug: campaign.slug,
        title: campaign.title,
        shortDescription:
          campaign.shortDescription,

        imageUrl,

        category: campaign.category
          ? {
              id: campaign.category.id,
              name: campaign.category.name,
              slug: campaign.category.slug,
            }
          : null,

        country:
          campaign.countryCode ?? null,

        currency: campaign.currency,

        targetAmount,
        collectedAmount:
          summary.collectedAmount,
        remainingAmount:
          summary.remainingAmount,
        progressPercentage:
          summary.progressPercentage,
        donorCount:
          summary.donorCount,

        isUrgent: campaign.isUrgent,
        status,
      };
    }
  );
}

// ----------------------------------------------------------
// SERVICE PRINCIPAL
// ----------------------------------------------------------

export async function getPublicCampaignDetail(
  rawSlug: string
): Promise<PublicCampaignDetail | null> {
  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------

  const slug = normalizeSlug(rawSlug);

  if (!isValidSlug(slug)) {
    return null;
  }

  // --------------------------------------------------------
  // DATE ACTUELLE
  // --------------------------------------------------------
  //
  // Le service est dynamique.
  //
  // La page Next.js et l'API doivent appeler
  // await connection() avant ce service.

  const now = new Date();

  // --------------------------------------------------------
  // RECHERCHE DE LA CAMPAGNE
  // --------------------------------------------------------

  const campaign =
    await prisma.campaign.findFirst({
      where: {
        slug,
        status:
          PUBLISHED_CAMPAIGN_STATUS,
      },

      select: CAMPAIGN_SELECT,
    });

  if (!campaign) {
    return null;
  }

  // --------------------------------------------------------
  // CALCUL DES DONS
  // --------------------------------------------------------

  const targetAmount = safeAmount(
    campaign.targetAmount
  );

  const summary =
    calculateDonationSummary(
      campaign.donations,
      targetAmount,
      campaign.currency
    );

  // --------------------------------------------------------
  // STATUT
  // --------------------------------------------------------

  const status = getCampaignStatus(
    {
      completedAt:
        campaign.completedAt,
      endDate: campaign.endDate,
      targetAmount,
      collectedAmount:
        summary.collectedAmount,
    },
    now
  );

  // --------------------------------------------------------
  // GALERIE DE PHOTOS
  // --------------------------------------------------------

  const photos = buildGallery(
    campaign.id,
    campaign.imageUrl,
    campaign.photos
  );

  const mainImage =
    photos[0]?.imageUrl ?? null;

  // --------------------------------------------------------
  // MISES À JOUR
  // --------------------------------------------------------

  const updates = buildUpdates(
    campaign.updates
  );

  // --------------------------------------------------------
  // CAMPAGNES SIMILAIRES
  // --------------------------------------------------------

  const similarCampaigns =
    await getSimilarCampaigns(
      campaign.id,
      campaign.category.id,
      now
    );

  // --------------------------------------------------------
  // RÉPONSE PUBLIQUE
  // --------------------------------------------------------

  return {
    id: campaign.id,
    slug: campaign.slug,

    title: campaign.title,

    shortDescription:
      campaign.shortDescription,

    description:
      campaign.description,

    imageUrl: mainImage,
    photos,

    category: {
      id: campaign.category.id,
      name: campaign.category.name,
      slug: campaign.category.slug,
    },

    beneficiary: campaign.beneficiary
      ? {
          id: campaign.beneficiary.id,
          firstName:
            campaign.beneficiary.firstName,
          lastName:
            campaign.beneficiary.lastName,
          city:
            campaign.beneficiary.city,
          country:
            campaign.beneficiary.country,
        }
      : null,

    country:
      campaign.beneficiary?.country ??
      campaign.countryCode ??
      null,

    countryCode:
      campaign.countryCode ?? null,

    currency:
      campaign.currency,

    targetAmount,

    collectedAmount:
      summary.collectedAmount,

    remainingAmount:
      summary.remainingAmount,

    progressPercentage:
      summary.progressPercentage,

    donorCount:
      summary.donorCount,

    isUrgent:
      campaign.isUrgent,

    priority:
      getPriority(campaign.isUrgent),

    status,

    startDate:
      toIsoString(campaign.startDate),

    endDate:
      toIsoString(campaign.endDate),

    publishedAt:
      toIsoString(campaign.publishedAt),

    completedAt:
      toIsoString(campaign.completedAt),

    updates,
    similarCampaigns,
  };
}

export default getPublicCampaignDetail;
