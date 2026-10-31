import { Suspense } from "react";
import { getAdminSession } from "@/lib/admin-auth";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getRequestById } from "@/lib/requests/service";
import RequestDetail from "@/components/admin/requests/RequestDetail";

export const metadata: Metadata = {
  title: "Détail de la demande | Fondation Sauvons des Vies",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default function DemandeDetailPage(props: Props) { return <Suspense fallback={<p role="status">Chargement de la demande…</p>}><RequestContent {...props} /></Suspense>; }

async function RequestContent({ params }: Props) {
  await connection();
  if (!(await getAdminSession())) redirect("/admin/connexion");

  const { id } = await params;
  const item = await getRequestById(id);

  if (!item) notFound();

  return <RequestDetail item={item} />;
}
