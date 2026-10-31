
import { prisma } from "@/lib/prisma";
import type { CampaignProgressData } from "@/types/campaign";

export async function getConfirmedCampaignProgress(
  campaignId: string,
  targetAmount: number
): Promise<CampaignProgressData> {
  const result = await prisma.donation.aggregate({
    where: {
      campaignId,
      status: "CONFIRMED",
      confirmedAt: { not: null },
      currency: "XOF",
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const collectedAmount = Math.max(0, result._sum.amount ?? 0);
  const target = Math.max(0, targetAmount);

  const remainingAmount = Math.max(0, target - collectedAmount);

  const percentage =
    target > 0
      ? Math.min(100, (collectedAmount / target) * 100)
      : 0;

  return {
    collectedAmount,
    targetAmount: target,
    remainingAmount,
    percentage: Number(percentage.toFixed(2)),
    confirmedDonationsCount: result._count.id,
  };
}
