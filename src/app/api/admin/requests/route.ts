import { unstable_rethrow } from "next/navigation";

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { listRequests } from "@/lib/requests/service";


export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Session administrateur expirée." },
        { status: 401 }
      );
    }

    const params = request.nextUrl.searchParams;
    const rawPage = Number(params.get("page") ?? "1");
    const page = Number.isSafeInteger(rawPage)
      ? Math.max(1, Math.min(rawPage, 100000))
      : 1;

    const category = params.get("category") ?? "";
    const status = params.get("status") ?? "";
    const period = params.get("period") ?? "all";

    const result = await listRequests({
      page,
      pageSize: 10,
      category,
      status,
      period,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Erreur de chargement des demandes :", error);

    return NextResponse.json(
      { error: "Impossible de charger les demandes." },
      { status: 500 }
    );
  }
}
