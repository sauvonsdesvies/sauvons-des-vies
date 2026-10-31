
import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPublicationPhotoUrl } from "./storage";
import type {
  PublicationCreateInput,
  PublicationSummary,
} from "@/types/publication";

export type PublicationTextUpdate = { title: string; shortDescription: string; content: string };

export async function updatePublicationText(id: string, data: PublicationTextUpdate) {
  return prisma.publication.update({
    where: { id }, data,
    select: { id: true, title: true, shortDescription: true, content: true, updatedAt: true },
  });
}

export async function deletePublication(id: string) {
  // Les métadonnées des photos suivent la relation Cascade ; aucun objet Storage n’est supprimé.
  return prisma.publication.delete({ where: { id }, select: { id: true } });
}

const summarySelect = {
  id: true, title: true, slug: true, category: true, language: true,
  status: true, imageUrl: true, publicationDate: true, createdAt: true,
} satisfies Prisma.PublicationSelect;

type PublicationSummaryRow = Prisma.PublicationGetPayload<{ select: typeof summarySelect }>;

function createSlug(title: string): string {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${normalized || "publication"}-${randomUUID().slice(0, 8)}`;
}

export async function createPublication(
  input: PublicationCreateInput
) {
  const publicationDate = new Date(
    `${input.publicationDate}T12:00:00.000Z`
  );

  const isPublished = input.status === "PUBLISHED";
  const isScheduled =
    isPublished && publicationDate.getTime() > Date.now();

  const status = isScheduled
    ? "SCHEDULED"
    : input.status;

  const publishedAt =
    status === "PUBLISHED" ? new Date() : null;

  const photos = input.photos.map((photo, index) => ({
    storagePath: photo.storagePath,
    imageUrl: getPublicationPhotoUrl(photo.storagePath),
    position: index,
  }));

  return prisma.publication.create({
    data: {
      title: input.title,
      slug: createSlug(input.title),
      shortDescription: input.shortDescription,
      content: input.content,
      category: input.category,
      language: input.language,
      authorName: "Fondation Sauvons des Vies",
      status,
      publicationDate,
      publishedAt,
      tags: input.tags,
      imageUrl: photos[0]?.imageUrl ?? null,
      photos: {
        create: photos,
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listRecentPublications(
  limit = 3
): Promise<PublicationSummary[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(Math.trunc(limit), 30)) : 3;
  const rows: PublicationSummaryRow[] = await prisma.publication.findMany({
    orderBy: { createdAt: "desc" },
    take: safeLimit,
    select: summarySelect,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    language: row.language,
    status: row.status,
    imageUrl: row.imageUrl,
    publicationDate: row.publicationDate?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}
