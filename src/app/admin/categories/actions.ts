"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(120, "120 caractères maximum."),
});

export async function saveCategory(input: unknown): Promise<{ success: boolean; message: string }> {
  if (!(await getAdminSession())) return { success: false, message: "Session expirée. Reconnectez-vous." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message };
  const { id, name } = parsed.data;
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!id && !slug) return { success: false, message: "Le nom doit contenir au moins une lettre latine ou un chiffre pour générer son identifiant." };
  try {
    if (id) {
      // Conserver le slug et les relations des catégories déjà utilisées.
      await prisma.campaignCategory.update({ where: { id }, data: { name } });
    } else {
      await prisma.campaignCategory.create({ data: { name, slug } });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { success: false, message: "Une catégorie portant ce nom ou un nom équivalent existe déjà." };
      if (error.code === "P2025") return { success: false, message: "Cette catégorie est introuvable. Actualisez la page." };
    }
    console.error("Enregistrement de catégorie impossible:", error);
    return { success: false, message: "Impossible d’enregistrer la catégorie. Réessayez." };
  }
  revalidatePath("/admin/categories");
  return { success: true, message: id ? "Catégorie modifiée." : "Catégorie ajoutée." };
}
