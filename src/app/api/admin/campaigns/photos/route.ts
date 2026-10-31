
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { CampaignPhotoError, uploadCampaignPhoto } from "@/lib/campaigns/storage";


const MAX_SIZE = 5 * 1024 * 1024;

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

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) {
      return NextResponse.json(
        { error: "Origine non autorisée." },
        { status: 403 }
      );
    }

    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Session administrateur expirée." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier reçu." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La photo doit peser entre 1 octet et 5 Mo." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format de photo non autorisé." },
        { status: 400 }
      );
    }

    const photo = await uploadCampaignPhoto(file, session.id);

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    if (error instanceof CampaignPhotoError) {
      console.error("Erreur de téléversement:", { code: error.code, status: error.status });
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("Erreur de téléversement inattendue.");

    return NextResponse.json(
      { error: "Impossible de téléverser la photo." },
      { status: 500 }
    );
  }
}
