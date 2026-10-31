import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import CategoryManager from "@/components/admin/categories/CategoryManager";

export const metadata = { title: "Catégories | Fondation Sauvons des Vies", robots: { index: false, follow: false } };

async function CategoriesContent() {
  if (!(await getAdminSession())) redirect("/admin/connexion");
  const categories = await prisma.campaignCategory.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } });
  return <CategoryManager categories={categories} />;
}

export default function CategoriesPage() {
  return <Suspense fallback={<p>Chargement des catégories...</p>}><CategoriesContent /></Suspense>;
}
