import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

import { prisma } from "@/lib/prisma";
import JournauxPage from "@/components/admin/journaux/JournauxPage";

// Calcul serveur après connection(), partagé avec le rendu client.
function getReferenceTime() {
  return Date.now();
}

export const metadata: Metadata = {
  title: "Journaux publiés | Fondation Sauvons des Vies",
  description:
    "Administration des journaux et publications de la Fondation Sauvons des Vies.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminJournauxPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-slate-600">Chargement des publications…</p>}>
      <JournauxContent />
    </Suspense>
  );
}

async function JournauxContent() {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/connexion");

  // Récupération des véritables publications enregistrées.
  const publications = await prisma.publication.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      content: true,
      category: true,
      language: true,
      authorName: true,
      status: true,
      imageUrl: true,
      publicationDate: true,
      publishedAt: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Conversion des dates pour les composants interactifs.
  const journals = publications.map((publication) => {
    const publicationDate = publication.publicationDate;
    const publishedAt = publication.publishedAt;

    return {
      id: publication.id,
      slug: publication.slug,
      title: publication.title,
      shortDescription: publication.shortDescription,
      content: publication.content,
      category: publication.category,
      language: publication.language,
      authorName: publication.authorName,
      status: publication.status,
      imageUrl: publication.imageUrl,

      publicationDate:
        publicationDate instanceof Date
          ? publicationDate.toISOString()
          : publicationDate
            ? String(publicationDate)
            : null,

      publishedAt:
        publishedAt instanceof Date
          ? publishedAt.toISOString()
          : publishedAt
            ? String(publishedAt)
            : null,

      archivedAt: publication.archivedAt?.toISOString() ?? null,

      createdAt: publication.createdAt.toISOString(),
      updatedAt: publication.updatedAt.toISOString(),
    };
  });

  return <JournauxPage publications={journals} referenceTime={getReferenceTime()} />;
}
