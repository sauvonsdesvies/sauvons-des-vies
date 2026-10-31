import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { deletePublication, updatePublicationText } from "@/lib/publications/service";

type Context = { params: Promise<{ id: string }> };
const textSchema = z.object({
  title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caractères.").max(180),
  shortDescription: z.string().trim().min(10, "Le résumé doit contenir au moins 10 caractères.").max(250),
  content: z.string().trim().min(20, "Le contenu doit contenir au moins 20 caractères.").max(30000),
}).strict();

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
function sameOrigin(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin;
}
function failure(error: unknown) {
  unstable_rethrow(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return json({ error: "Publication introuvable." }, 404);
  }
  console.error("Opération sur une publication impossible:", {
    type: error instanceof Error ? error.name : "UnknownError",
    code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
  });
  return json({ error: "Impossible de terminer l’opération. Réessayez." }, 500);
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    if (!(await getAdminSession())) return json({ error: "Session administrateur requise." }, 401);
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return json({ error: "Identifiant invalide." }, 400);
    const publication = await prisma.publication.findUnique({ where: { id }, include: { photos: { orderBy: { position: "asc" } } } });
    return publication ? json({ publication }) : json({ error: "Publication introuvable." }, 404);
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
    if (!(await getAdminSession())) return json({ error: "Session administrateur requise." }, 401);
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return json({ error: "Identifiant invalide." }, 400);
    let body: unknown;
    try { body = await request.json(); } catch { return json({ error: "Corps JSON invalide." }, 400); }
    const parsed = textSchema.safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    return json({ publication: await updatePublicationText(id, parsed.data) });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403);
    if (!(await getAdminSession())) return json({ error: "Session administrateur requise." }, 401);
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return json({ error: "Identifiant invalide." }, 400);
    await deletePublication(id);
    return json({ success: true, message: "Publication supprimée." });
  } catch (error) { return failure(error); }
}
