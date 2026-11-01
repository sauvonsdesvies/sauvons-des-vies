
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getRequestStatistics } from "./statistics";
import type {
  RequestItem,
  RequestListResponse,
  RequestStatus,
  RequestUpdateInput,
} from "@/types/request";

type ListOptions = {
  page: number;
  pageSize: number;
  category: string;
  status: string;
  period: string;
};

const statuses: RequestStatus[] = [
  "PENDING",
  "VERIFYING",
  "PUBLISHED",
  "CLOSED",
  "DRAFT",
  "SUSPENDED",
  "REJECTED",
];

function getPeriodStart(period: string): Date | undefined {
  const now = new Date();

  if (period === "year") {
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  }

  if (period === "month") {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
  }

  return undefined;
}

type CampaignRow = Awaited<
  ReturnType<typeof prisma.campaign.findMany<{
    include: { category: true };
  }>>
>[number];

function toRequestItem(
  campaign: CampaignRow,
  collectedAmount: number
): RequestItem {
  const target = Math.max(0, campaign.targetAmount);
  const collected = Math.max(0, collectedAmount) + campaign.initialCollectedAmount;

  return {
    countryCode: campaign.countryCode,
    isUrgent: campaign.isUrgent,
    id: campaign.id,
    reference: campaign.id.slice(0, 8).toUpperCase(),
    title: campaign.title,
    shortDescription: campaign.shortDescription,
    description: campaign.description,
    categoryId: campaign.categoryId,
    categoryName: campaign.category.name,
    targetAmount: target,
    collectedAmount: collected,
    initialCollectedAmount: campaign.initialCollectedAmount,
    initialDonorCount: campaign.initialDonorCount,
    remainingAmount: Math.max(0, target - collected),
    percentage:
      target > 0
        ? Math.min(100, Math.round((collected / target) * 100))
        : 0,
    status: statuses.includes(campaign.status as RequestStatus)
      ? (campaign.status as RequestStatus)
      : "DRAFT",
    imageUrl: campaign.imageUrl,
    startDate: campaign.startDate?.toISOString() ?? null,
    endDate: campaign.endDate?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
  };
}

async function confirmedTotals(campaignIds: string[]) {
  if (campaignIds.length === 0) return new Map<string, number>();

  const totals = await prisma.donation.groupBy({
    by: ["campaignId"],
    where: {
      campaignId: { in: campaignIds },
      status: "CONFIRMED",
      confirmedAt: { not: null },
      currency: "XOF",
    },
    _sum: { amount: true },
  });

  return new Map(
    totals.map((item) => [
      item.campaignId,
      item._sum.amount ?? 0,
    ])
  );
}

export async function listRequests(
  options: ListOptions
): Promise<RequestListResponse> {
  const from = getPeriodStart(options.period);

  const where = {
    ...(options.category
      ? { categoryId: options.category }
      : {}),
    ...(statuses.includes(options.status as RequestStatus)
      ? { status: options.status }
      : {}),
    ...(from ? { createdAt: { gte: from } } : {}),
  };

  const [campaigns, total, categories, stats] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.campaign.count({ where }),
    prisma.campaignCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getRequestStatistics(),
  ]);

  const totals = await confirmedTotals(
    campaigns.map((campaign) => campaign.id)
  );

  return {
    items: campaigns.map((campaign) =>
      toRequestItem(campaign, totals.get(campaign.id) ?? 0)
    ),
    total,
    page: options.page,
    pageSize: options.pageSize,
    categories,
    stats,
  };
}

export async function getRequestById(
  id: string
): Promise<RequestItem | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!campaign) return null;

  const totals = await confirmedTotals([campaign.id]);

  return toRequestItem(
    campaign,
    totals.get(campaign.id) ?? 0
  );
}

export async function updateRequest(
  id: string,
  input: RequestUpdateInput
): Promise<RequestItem> {
  await prisma.campaign.update({
    where: { id },
    data: {
      countryCode: input.countryCode,
      isUrgent: input.isUrgent,
      title: input.title,
      shortDescription: input.shortDescription,
      description: input.description,
      targetAmount: input.targetAmount,
      initialCollectedAmount: input.initialCollectedAmount,
      initialDonorCount: input.initialDonorCount,
    },
  });

  const updated = await getRequestById(id);

  if (!updated) {
    throw new Error("Demande introuvable après modification.");
  }

  return updated;
}

export async function deleteRequest(id: string) {
  return prisma.$transaction(async (tx) => {
    const linked = await tx.campaign.findUnique({
      where: { id },
      select: { id: true, _count: { select: { donations: true, payments: true } } },
    });
    if (!linked) return "missing" as const;
    if (linked._count.donations || linked._count.payments) return "linked" as const;
    await tx.campaign.delete({ where: { id }, select: { id: true } });
    return "deleted" as const;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
