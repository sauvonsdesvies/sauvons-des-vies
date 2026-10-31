
import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// ==========================================================
// FONDATION SAUVONS DES VIES
// DONNÉES PUBLIQUES — DÉTAIL D'UNE PUBLICATION
// ==========================================================
//
// Next.js 16 / TypeScript / Prisma / PostgreSQL
//
// Responsabilités :
// - Lire une publication réellement publiée
// - Charger ses images et campagnes associées
// - Lire les paiements hospitaliers confirmés
// - Charger les publications récentes
// - Compter les publications par catégorie
// - Préparer les informations pour la page PC/mobile
//
// Sécurité :
// - Aucune publication brouillon ou archivée
// - Aucun montant en attente comptabilisé
// - Aucune donnée fictive
// - Aucune écriture dans la base de données
//
// ==========================================================

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------

const PUBLICATION_STATUS = "PUBLISHED";
const PAYMENT_STATUS = "PAID";

const RECENT_PUBLICATIONS_LIMIT = 5;

const WORDS_PER_MINUTE = 200;

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

export type PublicNewsPhoto = {
  id: string;
  imageUrl: string;
  position: number;
};

export type PublicNewsCampaign = {
  id: string;
  title: string;
  slug: string;
  currency: string;
  beneficiaryName: string | null;
};

export type PublicNewsActionStats = {
  amountUsed: number | null;
  currency: string | null;
  beneficiariesHelped: number | null;
  interventionDate: string | null;
  hospitalName: string | null;
};

export type PublicNewsRecentPublication = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  imageUrl: string | null;
  publicationDate: string | null;
};

export type PublicNewsCategory = {
  name: string;
  count: number;
};

export type PublicNewsDetail = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  content: string;
  category: string;
  language: string;
  authorName: string;
  imageUrl: string | null;
  publicationDate: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  readingTimeMinutes: number;
  photos: PublicNewsPhoto[];
  campaigns: PublicNewsCampaign[];
  actionStats: PublicNewsActionStats;
};

export type PublicNewsDetailData = {
  publication: PublicNewsDetail;
  recentPublications: PublicNewsRecentPublication[];
  categories: PublicNewsCategory[];
};

// ----------------------------------------------------------
// SÉLECTION PRISMA
// ----------------------------------------------------------

const publicationDetailSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  content: true,
  category: true,
  language: true,
  authorName: true,
  imageUrl: true,
  publicationDate: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  tags: true,

  photos: {
    orderBy: {
      position: "asc",
    },
    select: {
      id: true,
      imageUrl: true,
      position: true,
    },
  },

  updates: {
    select: {
      campaign: {
        select: {
          id: true,
          title: true,
          slug: true,
          currency: true,

          beneficiary: {
            select: {
              firstName: true,
              lastName: true,
            },
          },

          payments: {
            where: {
              status: PAYMENT_STATUS,
            },
            select: {
              id: true,
              amount: true,
              currency: true,
              hospitalName: true,
              paidAt: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PublicationSelect;

type PublicationDetailRecord = Prisma.PublicationGetPayload<{
  select: typeof publicationDetailSelect;
}>;

// ----------------------------------------------------------
// OUTILS
// ----------------------------------------------------------

function toISOString(
  value: Date | null | undefined
): string | null {
  return value ? value.toISOString() : null;
}

function calculateReadingTime(
  content: string
): number {
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) {
    return 1;
  }

  const wordCount = plainText.split(" ").length;

  return Math.max(
    1,
    Math.ceil(wordCount / WORDS_PER_MINUTE)
  );
}

function getBeneficiaryName(
  beneficiary: {
    firstName: string;
    lastName: string;
  } | null
): string | null {
  if (!beneficiary) {
    return null;
  }

  const name = [
    beneficiary.firstName,
    beneficiary.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || null;
}

// ----------------------------------------------------------
// CONDITIONS DE VISIBILITÉ
// ----------------------------------------------------------

function publicPublicationWhere(
  slug: string
): Prisma.PublicationWhereInput {
  return {
    slug,
    status: PUBLICATION_STATUS,
    archivedAt: null,
    publishedAt: {
      not: null,
    },
  };
}

function publicPublicationsWhere(): Prisma.PublicationWhereInput {
  return {
    status: PUBLICATION_STATUS,
    archivedAt: null,
    publishedAt: {
      not: null,
    },
  };
}

// ----------------------------------------------------------
// TRANSFORMATION DES STATISTIQUES
// ----------------------------------------------------------

function buildActionStats(
  record: PublicationDetailRecord
): PublicNewsActionStats {
  const payments = record.updates.flatMap(
    (update) => update.campaign.payments
  );

  if (payments.length === 0) {
    return {
      amountUsed: null,
      currency: null,
      beneficiariesHelped: null,
      interventionDate: null,
      hospitalName: null,
    };
  }

  // Un paiement appartient à une campagne.
  // On déduplique les paiements par identifiant.

  const uniquePayments = Array.from(
    new Map(
      payments.map((payment) => [
        payment.id,
        payment,
      ])
    ).values()
  );

  const currencies = Array.from(
    new Set(
      uniquePayments.map(
        (payment) => payment.currency
      )
    )
  );

  // Ne jamais additionner des devises différentes.

  const hasSingleCurrency =
    currencies.length === 1;

  const amountUsed = hasSingleCurrency
    ? uniquePayments.reduce(
        (total, payment) =>
          total + payment.amount,
        0
      )
    : null;

  const currency = hasSingleCurrency
    ? currencies[0]
    : null;

  // Les bénéficiaires sont dédupliqués par campagne
  // lorsqu'un bénéficiaire est effectivement associé.
  //
  // Ce nombre représente les bénéficiaires distincts
  // liés aux campagnes ayant des paiements confirmés.
  // Il ne prouve pas à lui seul une intervention réalisée.

  const beneficiaryNames = new Set<string>();

  for (const update of record.updates) {
    const campaign = update.campaign;

    if (campaign.payments.length === 0) {
      continue;
    }

    const beneficiaryName = getBeneficiaryName(
      campaign.beneficiary
    );

    if (beneficiaryName) {
      beneficiaryNames.add(
        `${campaign.id}:${beneficiaryName}`
      );
    }
  }

  // paidAt représente la date du paiement,
  // pas nécessairement celle de l'intervention.
  //
  // On ne remplace donc pas la date médicale
  // par une date financière.

  const hospitalNames = Array.from(
    new Set(
      uniquePayments
        .map((payment) =>
          payment.hospitalName.trim()
        )
        .filter(Boolean)
    )
  );

  return {
    amountUsed,
    currency,
    beneficiariesHelped: null,
    interventionDate: null,
    hospitalName:
      hospitalNames.length === 1
        ? hospitalNames[0]
        : null,
  };
}

// ----------------------------------------------------------
// TRANSFORMATION D'UNE PUBLICATION
// ----------------------------------------------------------

function mapPublicationDetail(
  record: PublicationDetailRecord
): PublicNewsDetail {
  const campaignsMap = new Map<
    string,
    PublicNewsCampaign
  >();

  for (const update of record.updates) {
    const campaign = update.campaign;

    campaignsMap.set(campaign.id, {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      currency: campaign.currency,
      beneficiaryName: getBeneficiaryName(
        campaign.beneficiary
      ),
    });
  }

  const photos = record.photos
    .filter((photo) =>
      Boolean(photo.imageUrl.trim())
    )
    .map((photo) => ({
      id: photo.id,
      imageUrl: photo.imageUrl,
      position: photo.position,
    }));

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    shortDescription: record.shortDescription,
    content: record.content,
    category: record.category,
    language: record.language,
    authorName: record.authorName,

    imageUrl:
      record.imageUrl ||
      photos[0]?.imageUrl ||
      null,

    publicationDate: toISOString(
      record.publicationDate ??
        record.publishedAt
    ),

    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),

    tags: record.tags,

    readingTimeMinutes: calculateReadingTime(
      record.content
    ),

    photos,
    campaigns: Array.from(
      campaignsMap.values()
    ),

    actionStats: buildActionStats(record),
  };
}

// ----------------------------------------------------------
// PUBLICATION PAR SLUG
// ----------------------------------------------------------

export async function getPublicNewsBySlug(
  slug: string
): Promise<PublicNewsDetail | null> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  const record = await prisma.publication.findFirst({
    where: publicPublicationWhere(
      normalizedSlug
    ),
    select: publicationDetailSelect,
  });

  if (!record) {
    return null;
  }

  return mapPublicationDetail(record);
}

// ----------------------------------------------------------
// PUBLICATIONS RÉCENTES
// ----------------------------------------------------------

export async function getRecentPublicNews(
  excludeSlug?: string,
  limit: number = RECENT_PUBLICATIONS_LIMIT
): Promise<PublicNewsRecentPublication[]> {
  const safeLimit = Math.min(
    Math.max(Math.floor(limit) || 1, 1),
    20
  );

  const publications =
    await prisma.publication.findMany({
      where: {
        ...publicPublicationsWhere(),

        ...(excludeSlug
          ? {
              slug: {
                not: excludeSlug,
              },
            }
          : {}),
      },

      orderBy: [
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],

      take: safeLimit,

      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        category: true,
        imageUrl: true,
        publicationDate: true,
        publishedAt: true,

        photos: {
          orderBy: {
            position: "asc",
          },
          take: 1,
          select: {
            imageUrl: true,
          },
        },
      },
    });

  return publications.map((publication) => ({
    id: publication.id,
    slug: publication.slug,
    title: publication.title,
    shortDescription:
      publication.shortDescription,
    category: publication.category,

    imageUrl:
      publication.imageUrl ||
      publication.photos[0]?.imageUrl ||
      null,

    publicationDate: toISOString(
      publication.publicationDate ??
        publication.publishedAt
    ),
  }));
}

// ----------------------------------------------------------
// CATÉGORIES ET NOMBRE DE PUBLICATIONS
// ----------------------------------------------------------

export async function getPublicNewsCategories(): Promise<
  PublicNewsCategory[]
> {
  const grouped = await prisma.publication.groupBy({
    by: ["category"],

    where: publicPublicationsWhere(),

    _count: {
      _all: true,
    },

    orderBy: {
      category: "asc",
    },
  });

  return grouped.map((item) => ({
    name: item.category,
    count: item._count._all,
  }));
}

// ----------------------------------------------------------
// NOMBRE TOTAL DE PUBLICATIONS
// ----------------------------------------------------------

export async function getPublicNewsCount(): Promise<number> {
  return prisma.publication.count({
    where: publicPublicationsWhere(),
  });
}

// ----------------------------------------------------------
// DONNÉES COMPLÈTES DE LA PAGE
// ----------------------------------------------------------

export async function getPublicNewsDetailData(
  slug: string
): Promise<PublicNewsDetailData | null> {
  // Charger d'abord la publication.
  // Si elle est absente ou non publique,
  // ne pas lancer les autres requêtes.

  const publication = await getPublicNewsBySlug(
    slug
  );

  if (!publication) {
    return null;
  }

  // Les deux requêtes suivantes sont indépendantes.
  // Elles sont exécutées en parallèle.

  const [
    recentPublications,
    categories,
  ] = await Promise.all([
    getRecentPublicNews(publication.slug),
    getPublicNewsCategories(),
  ]);

  return {
    publication,
    recentPublications,
    categories,
  };
}
