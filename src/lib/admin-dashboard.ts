
import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STATISTICS_RECORD_ID } from "@/lib/statistics/service";

import type {
  AdminDashboardData,
  DashboardPeriod,
  DashboardDonationPoint,
  DashboardCategoryPoint,
} from "@/types/admin-dashboard";

/**
 * FONDATION SAUVONS DES VIES
 * Service serveur du tableau de bord.
 *
 * Source des données : PostgreSQL / Supabase.
 * ORM : Prisma.
 * Devise : XOF (FCFA).
 *
 * Aucun jeu de données fictives.
 */

const DONATION_CONFIRMED = "CONFIRMED";
const PAYMENT_PAID = "PAID";
const CAMPAIGN_ACTIVE = "ACTIVE";
const CAMPAIGN_COMPLETED = "COMPLETED";
const REQUEST_PENDING = "PENDING";

type DateRange = {
  start: Date | null;
  end: Date | null;
};

function getDateRange(
  period: DashboardPeriod,
  now: Date,
): DateRange {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  switch (period) {
    case "current_month":
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 1)),
      };

    case "previous_month":
      return {
        start: new Date(Date.UTC(year, month - 1, 1)),
        end: new Date(Date.UTC(year, month, 1)),
      };

    case "last_3_months":
      return {
        start: new Date(Date.UTC(year, month - 2, 1)),
        end: now,
      };

    case "last_6_months":
      return {
        start: new Date(Date.UTC(year, month - 5, 1)),
        end: now,
      };

    case "current_year":
      return {
        start: new Date(Date.UTC(year, 0, 1)),
        end: now,
      };

    case "all":
      return {
        start: null,
        end: null,
      };
  }
}

function buildDateFilter(
  range: DateRange,
): Prisma.DateTimeFilter | undefined {
  if (!range.start && !range.end) {
    return undefined;
  }

  return {
    ...(range.start ? { gte: range.start } : {}),
    ...(range.end ? { lt: range.end } : {}),
  };
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sumAmounts(
  values: ReadonlyArray<{ amount: number }>,
): number {
  return values.reduce(
    (sum, value) => sum + value.amount,
    0,
  );
}

export async function getAdminDashboardData(
  period: DashboardPeriod = "current_month",
): Promise<AdminDashboardData> {
  const now = new Date();
  const range = getDateRange(period, now);
  const dateFilter = buildDateFilter(range);

  const currentMonthStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
    ),
  );

  const nextMonthStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      1,
    ),
  );

  const [
    confirmedDonations,
    recentCampaigns,
    recentDonations,
    recentRequests,
    hospitalPayments,
    pendingRequestsCount,
    notifications,
    completedCampaignsCount,
    activeCampaignsCount,
    monthlyDonationsAggregate,
  ] = await Promise.all([
    prisma.donation.findMany({
      where: {
        status: DONATION_CONFIRMED,
        confirmedAt: {
          not: null,
          ...(dateFilter ?? {}),
        },
        currency: "XOF",
      },
      select: {
        id: true,
        amount: true,
        confirmedAt: true,
        campaign: {
          select: {
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        confirmedAt: "asc",
      },
    }),

    prisma.campaign.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        targetAmount: true,
        imageUrl: true,
        createdAt: true,
        donations: {
          where: {
            status: DONATION_CONFIRMED,
            currency: "XOF",
            confirmedAt: {
              not: null,
            },
          },
          select: {
            amount: true,
          },
        },
      },
    }),

    prisma.donation.findMany({
      take: 8,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        campaignId: true,
        donorName: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        confirmedAt: true,
        campaign: {
          select: {
            title: true,
          },
        },
      },
    }),

    prisma.campaign.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    }),

    prisma.hospitalPayment.findMany({
      where: {
        status: PAYMENT_PAID,
        currency: "XOF",
        paidAt: {
          not: null,
          ...(dateFilter ?? {}),
        },
      },
      select: {
        amount: true,
        campaignId: true,
      },
    }),

    prisma.campaign.count({
      where: {
        status: REQUEST_PENDING,
      },
    }),

    prisma.adminNotification.findMany({
      where: { id: { not: STATISTICS_RECORD_ID }, type: { not: "SYSTEM_STATISTICS" } },
      take: 8,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
      },
    }),

    prisma.campaign.count({
      where: {
        status: { in: [CAMPAIGN_COMPLETED, "CLOSED"] },
      },
    }),

    prisma.campaign.count({
      where: {
        status: { in: [CAMPAIGN_ACTIVE, "PUBLISHED"] },
        completedAt: null,
      },
    }),

    prisma.donation.aggregate({
      where: {
        status: DONATION_CONFIRMED,
        currency: "XOF",
        confirmedAt: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  // ========================================
  // TOTAL DES DONS CONFIRMÉS
  // ========================================

  const totalDonations = sumAmounts(
    confirmedDonations,
  );

  // ========================================
  // ÉVOLUTION DES DONS
  // ========================================

  const dailyMap = new Map<
    string,
    {
      amount: number;
      count: number;
    }
  >();

  for (const donation of confirmedDonations) {
    if (!donation.confirmedAt) {
      continue;
    }

    const key = formatDateKey(donation.confirmedAt);

    const previous = dailyMap.get(key) ?? {
      amount: 0,
      count: 0,
    };

    previous.amount += donation.amount;
    previous.count += 1;

    dailyMap.set(key, previous);
  }

  const donationEvolution: DashboardDonationPoint[] =
    Array.from(dailyMap.entries())
      .sort(([dateA], [dateB]) =>
        dateA.localeCompare(dateB),
      )
      .map(([date, values]) => ({
        date,
        label: date,
        amount: values.amount,
        count: values.count,
      }));

  // ========================================
  // RÉPARTITION PAR CATÉGORIE
  // ========================================

  const categoryMap = new Map<
    string,
    {
      name: string;
      amount: number;
    }
  >();

  for (const donation of confirmedDonations) {
    const categoryId =
      donation.campaign.categoryId;

    const categoryName =
      donation.campaign.category.name;

    const previous = categoryMap.get(categoryId) ?? {
      name: categoryName,
      amount: 0,
    };

    previous.amount += donation.amount;

    categoryMap.set(categoryId, previous);
  }

  const donationsByCategory: DashboardCategoryPoint[] =
    Array.from(categoryMap.entries())
      .map(([categoryId, values]) => ({
        categoryId,
        categoryName: values.name,
        amount: values.amount,
        percentage:
          totalDonations > 0
            ? (values.amount / totalDonations) * 100
            : 0,
      }))
      .sort(
        (categoryA, categoryB) =>
          categoryB.amount - categoryA.amount,
      );

  // ========================================
  // BÉNÉFICIAIRES AYANT REÇU UNE AIDE
  // ========================================

  const paidCampaignIds = Array.from(
    new Set(
      hospitalPayments.map(
        (payment) => payment.campaignId,
      ),
    ),
  );

  let beneficiariesHelped = 0;

  if (paidCampaignIds.length > 0) {
    const beneficiaries = await prisma.campaign.findMany({
      where: {
        id: {
          in: paidCampaignIds,
        },
      },
      select: {
        beneficiaryId: true,
      },
      distinct: ["beneficiaryId"],
    });

    beneficiariesHelped = beneficiaries.length;
  }

  // ========================================
  // CAMPAGNES RÉCENTES
  // ========================================

  const campaignItems = recentCampaigns.map(
    (campaign) => {
      const collectedAmount = sumAmounts(
        campaign.donations,
      );

      const progressPercentage =
        campaign.targetAmount > 0
          ? Math.min(
              100,
              Math.max(
                0,
                (collectedAmount /
                  campaign.targetAmount) *
                  100,
              ),
            )
          : 0;

      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        targetAmount: campaign.targetAmount,
        collectedAmount,
        progressPercentage,
        imageUrl: campaign.imageUrl,
        createdAt: campaign.createdAt.toISOString(),
      };
    },
  );

  // ========================================
  // DONS RÉCENTS
  // ========================================

  const donationItems = recentDonations.map(
    (donation) => ({
      id: donation.id,
      campaignId: donation.campaignId,
      campaignTitle: donation.campaign.title,
      donorName: donation.donorName,
      amount: donation.amount,
      currency: "XOF" as const,
      status: donation.status,
      createdAt: donation.createdAt.toISOString(),
      confirmedAt:
        donation.confirmedAt?.toISOString() ?? null,
    }),
  );

  // ========================================
  // DEMANDES RÉCENTES
  // ========================================

  const requestItems = recentRequests.map(
    (request) => ({
      id: request.id,
      reference: request.id.slice(0, 8).toUpperCase(),
      title: request.title,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    }),
  );

  // ========================================
  // NOTIFICATIONS
  // ========================================

  const notificationItems = notifications.map(
    (notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    }),
  );

  // ========================================
  // RÉSULTAT FINAL
  // ========================================

  return {
    generatedAt: new Date().toISOString(),

    currency: "XOF",

    period,

    dateRange: {
      start: range.start?.toISOString() ?? null,
      end: range.end?.toISOString() ?? null,
    },

    stats: {
      totalDonations,

      monthlyDonations:
        monthlyDonationsAggregate._sum.amount ?? 0,

      activeCampaigns: activeCampaignsCount,

      beneficiariesHelped,

      confirmedDonations:
        confirmedDonations.length,

      hospitalPayments:
        sumAmounts(hospitalPayments),

      pendingRequests: pendingRequestsCount,

      completedCampaigns:
        completedCampaignsCount,
    },

    trends: {},

    donationEvolution,

    donationsByCategory,

    recentCampaigns: campaignItems,

    recentDonations: donationItems,

    recentRequests: requestItems,

    notifications: notificationItems,
  };
}
