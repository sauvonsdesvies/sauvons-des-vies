import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { validateCampaignInput } from "@/lib/campaigns/validation";
import { getCampaignPhotoUrl } from "@/lib/campaigns/storage";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
  } catch { return NextResponse.json({ error: "Origine invalide." }, { status: 403 }); }
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "Collecte invalide." }, { status: 400 });
  try {
    const validation = validateCampaignInput(await request.json());
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });
    const existing = await prisma.campaign.findUnique({ where: { id }, include: { photos: true } });
    if (!existing) return NextResponse.json({ error: "Collecte introuvable." }, { status: 404 });
    const input = validation.data;
    if (input.currency !== existing.currency && (existing.status !== "DRAFT" || await prisma.donation.count({ where: { campaignId: id } }) > 0)) {
      return NextResponse.json({ error: "La devise ne peut changer que sur un brouillon sans don enregistré, pour préserver les montants existants." }, { status: 400 });
    }
    if (!input.photos.every(photo => photo.storagePath.startsWith(`campaign-uploads/${session.id}/`) || existing.photos.some(saved => saved.storagePath === photo.storagePath))) {
      return NextResponse.json({ error: "Photo non autorisée." }, { status: 403 });
    }
    const photos = input.photos.map((photo, position) => ({ storagePath: photo.storagePath, imageUrl: getCampaignPhotoUrl(photo.storagePath), position }));
    const campaign = await prisma.campaign.update({ where: { id }, data: {
      title: input.title, shortDescription: input.shortDescription, description: input.description,
      categoryId: input.categoryId, targetAmount: input.targetAmount,
      currency: input.currency,
      initialCollectedAmount: input.initialCollectedAmount, initialDonorCount: input.initialDonorCount,
      countryCode: input.countryCode, isUrgent: input.isUrgent,
      startDate: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null,
      endDate: input.endDate ? new Date(`${input.endDate}T00:00:00.000Z`) : null,
      status: input.status, publishedAt: input.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null,
      imageUrl: photos[0]?.imageUrl ?? existing.imageUrl,
      photos: { deleteMany: {}, create: photos },
    }, select: { id: true, slug: true } });
    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ error: "Modification impossible. Vérifiez les informations." }, { status: 400 });
  }
}
