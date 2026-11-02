
import { prisma } from "@/lib/prisma";
import type { RequestStatistics } from "@/types/request";

export async function getRequestStatistics(): Promise<RequestStatistics> {
  const grouped = await prisma.campaign.groupBy({
    by: ["status"],
    where: { status: { not: "DELETED" } },
    _count: {
      _all: true,
    },
  });

  const count = (status: string) =>
    grouped.find((item) => item.status === status)?._count._all ?? 0;

  return {
    total: grouped.reduce(
      (sum, item) => sum + item._count._all,
      0
    ),
    pending: count("PENDING"),
    verifying: count("VERIFYING"),
    published: count("PUBLISHED"),
    closed: count("CLOSED"),
  };
}
