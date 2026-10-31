import { connection, NextResponse } from "next/server";

import {
  getPublicStatistics,
} from "@/lib/statistics/service";

export async function GET() {
  await connection();
  try {
    const statistics = await getPublicStatistics();

    return NextResponse.json(
      {
        success: true,
        statistics: {
          activeCampaigns: statistics.activeCampaigns,
          beneficiariesHelped: statistics.beneficiariesHelped,
          verifiedFiles: statistics.verifiedFiles,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Statistiques publiques :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Statistiques temporairement indisponibles.",
      },
      {
        status: 500,
      }
    );
  }
}
