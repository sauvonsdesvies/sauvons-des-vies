import "server-only";
import { prisma } from "@/lib/prisma";

export const STATISTICS_RECORD_ID =
  "fondation-public-statistics-v1";

type StatisticsValues = {
  activeCampaigns: number;
  beneficiariesHelped: number;
  verifiedFiles: number;
};

export type PublicStatistics = StatisticsValues & {
  updatedAt: string | null;
};

function normalizeNumber(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error("Les statistiques doivent être des entiers positifs.");
  }

  return value;
}

function parseStoredValues(
  message: string
): StatisticsValues | null {
  try {
    const parsed: unknown = JSON.parse(message);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    const data = parsed as Record<string, unknown>;

    return {
      activeCampaigns: normalizeNumber(data.activeCampaigns),
      beneficiariesHelped: normalizeNumber(data.beneficiariesHelped),
      verifiedFiles: normalizeNumber(data.verifiedFiles),
    };
  } catch {
    return null;
  }
}

export async function getPublicStatistics(): Promise<PublicStatistics> {
  const saved = await prisma.adminNotification.findUnique({
    where: {
      id: STATISTICS_RECORD_ID,
    },
    select: {
      message: true,
      createdAt: true,
    },
  });

  if (saved) {
    const values = parseStoredValues(saved.message);

    if (!values) {
      throw new Error(
        "Les statistiques enregistrées sont invalides."
      );
    }

    return {
      ...values,
      updatedAt: saved.createdAt.toISOString(),
    };
  }

  const [activeCampaigns, beneficiariesHelped, verifiedFiles] =
    await Promise.all([
      prisma.campaign.count({
        where: {
          status: "PUBLISHED",
          completedAt: null,
        },
      }),

      prisma.beneficiary.count({
        where: {
          campaigns: {
            some: {
              payments: {
                some: {
                  status: "PAID",
                },
              },
            },
          },
        },
      }),

      prisma.aidRequest.count({
        where: {
          status: "VERIFIED",
        },
      }),
    ]);

  return {
    activeCampaigns,
    beneficiariesHelped,
    verifiedFiles,
    updatedAt: null,
  };
}

export async function savePublicStatistics(
  values: StatisticsValues
): Promise<PublicStatistics> {
  const normalized: StatisticsValues = {
    activeCampaigns: normalizeNumber(values.activeCampaigns),
    beneficiariesHelped: normalizeNumber(values.beneficiariesHelped),
    verifiedFiles: normalizeNumber(values.verifiedFiles),
  };

  const now = new Date();

  const saved = await prisma.adminNotification.upsert({
    where: {
      id: STATISTICS_RECORD_ID,
    },
    create: {
      id: STATISTICS_RECORD_ID,
      title: "Statistiques publiques de la fondation",
      message: JSON.stringify(normalized),
      type: "SYSTEM_STATISTICS",
      isRead: true,
      createdAt: now,
    },
    update: {
      message: JSON.stringify(normalized),
      createdAt: now,
    },
  });

  return {
    ...normalized,
    updatedAt: saved.createdAt.toISOString(),
  };
}
