
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { unstable_rethrow } from "next/navigation";
import {
  createPublication,
  listRecentPublications,
} from "@/lib/publications/service";
import { validatePublication } from "@/lib/publications/validation";

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

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json(
        { error: "Session administrateur requise." },
        { status: 401 }
      );
    }

    const publications = await listRecentPublications(10);

    return NextResponse.json(
      { publications },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("Lecture des publications :", error);

    return NextResponse.json(
      { error: "Impossible de charger les publications." },
      { status: 500 }
    );
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

    const body: unknown = await request.json();
    const validation = validatePublication(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const publication = await createPublication(validation.data);

    return NextResponse.json(
      { publication },
      { status: 201 }
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("Création d'une publication :", error);

    return NextResponse.json(
      { error: "Impossible d'enregistrer la publication." },
      { status: 500 }
    );
  }
}
