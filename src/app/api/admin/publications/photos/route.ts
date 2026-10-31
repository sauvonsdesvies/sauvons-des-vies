
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { unstable_rethrow } from "next/navigation";
import { uploadPublicationPhoto } from "@/lib/publications/storage";

const MAX_BYTES = 5 * 1024 * 1024;

function sameOrigin(request: NextRequest): boolean {
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

    if (!(await getAdminSession())) {
      return NextResponse.json(
        { error: "Session administrateur requise." },
        { status: 401 }
      );
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucune photo reçue." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "La photo doit peser au maximum 5 Mo." },
        { status: 400 }
      );
    }

    const photo = await uploadPublicationPhoto(file);

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Téléversement d'une photo :", error);

    return NextResponse.json(
      { error: "Impossible de téléverser la photo." },
      { status: 500 }
    );
  }
}
