
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCampaignInput } from "@/lib/campaigns/validation";
import { createCampaign } from "@/lib/campaigns/service";
import { getAdminSession } from "@/lib/admin-auth";



function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Session administrateur non autorisée." },
        { status: 401 }
      );
    }

    const categories = await prisma.campaignCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      { categories },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erreur de lecture des catégories :", error);

    return NextResponse.json(
      { error: "Impossible de charger les catégories." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) {
      return NextResponse.json(
        { error: "Origine de la requête non autorisée." },
        { status: 403 }
      );
    }

    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Session administrateur non autorisée." },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const validation = validateCampaignInput(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const prefix = `campaign-uploads/${session.id}/`;

    const authorizedPhotos = validation.data.photos.every(
      (photo) => photo.storagePath.startsWith(prefix)
    );

    if (!authorizedPhotos) {
      return NextResponse.json(
        { error: "Une ou plusieurs photos ne sont pas autorisées." },
        { status: 403 }
      );
    }

    const campaign = await createCampaign(validation.data);

    return NextResponse.json(
      { campaign },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur de création de collecte :", error);

    return NextResponse.json(
      { error: "Impossible d'enregistrer la collecte." },
      { status: 500 }
    );
  }
}
