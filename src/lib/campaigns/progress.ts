
import { prisma } from "@/lib/prisma";
import type { CampaignProgressData } from "@/types/campaign";
import { countParticipants } from "./participants";

export async function getConfirmedCampaignProgress(
  campaignId: string,
  targetAmount: number
): Promise<CampaignProgressData> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { currency: true, initialCollectedAmount: true, initialDonorCount: true } });
  const donations = await prisma.donation.findMany({
    where: {
      campaignId,
      status: "CONFIRMED",
      confirmedAt: { not: null },
      currency: campaign?.currency ?? "XOF",
    },
    select: { id: true, amount: true, donorEmail: true },
  });


  const collectedAmount = donations.reduce((sum, donation) => sum + donation.amount, 0) + (campaign?.initialCollectedAmount ?? 0);
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
    confirmedDonationsCount: countParticipants(donations) + (campaign?.initialDonorCount ?? 0),
  };
}
