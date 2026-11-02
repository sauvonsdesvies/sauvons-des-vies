import { unstable_rethrow } from "next/navigation";

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getRequestById, updateRequest, deleteRequest } from "@/lib/requests/service";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { validateRequestUpdate } from "@/lib/requests/validation";


type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: Context) {
  try {
    if (!validOrigin(request)) return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
    if (!(await getAdminSession())) return NextResponse.json({ error: "Session administrateur requise." }, { status: 401 });
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const result = await deleteRequest(id);
    if (result === "missing") return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    unstable_rethrow(error);
    const conflict = error instanceof Prisma.PrismaClientKnownRequestError && ["P2003", "P2034"].includes(error.code);
    return NextResponse.json({ error: conflict ? "La collecte a changé ou possède des transactions liées. Actualisez la liste." : "Suppression impossible. Réessayez." }, { status: conflict ? 409 : 500 });
  }
}

function validOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest, context: Context) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const item = await getRequestById(id);

    if (!item) {
      return NextResponse.json(
        { error: "Demande introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { item },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("Erreur de lecture :", error);

    return NextResponse.json(
      { error: "Impossible de consulter la demande." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    if (!validOrigin(request)) {
      return NextResponse.json(
        { error: "Origine non autorisée." },
        { status: 403 }
      );
    }

    if (!(await getAdminSession())) {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const input: unknown = await request.json();
    const validation = validateRequestUpdate(input);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const existing = await getRequestById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Demande introuvable." },
        { status: 404 }
      );
    }

    const item = await updateRequest(id, validation.data);

    return NextResponse.json({ item });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Erreur de modification :", error);

    return NextResponse.json(
      { error: "Impossible de modifier la demande." },
      { status: 500 }
    );
  }
}
