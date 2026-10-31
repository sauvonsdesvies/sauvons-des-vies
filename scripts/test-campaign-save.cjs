/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS integration test loader. */
// Écritures réelles dans une transaction systématiquement annulée :
// aucune collecte de test n’est conservée ni visible publiquement.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
require("@next/env").loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function loadService(client, filename = "src/lib/campaigns/service.ts") {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    function resolve(name) {
      if (name === "server-only") return {};
      if (name === "@/lib/prisma") return { prisma: client };
      if (name.startsWith("./")) return load(path.resolve(path.dirname(filename), name + ".ts"));
      return require(name);
    }
    new Function("require", "module", "exports", code)(resolve, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load(filename);
}

async function main() {
  const category = await prisma.campaignCategory.findFirst({ select: { id: true } });
  assert.ok(category, "Une catégorie réelle doit exister.");
  const objects = await prisma.$queryRaw`SELECT name FROM storage.objects WHERE bucket_id = ${process.env.SUPABASE_CAMPAIGNS_BUCKET} AND name LIKE 'campaign-uploads/%' ORDER BY created_at LIMIT 5`;
  assert.ok(objects.length, "Une photo réelle doit exister.");
  const before = { campaigns: await prisma.campaign.count(), photos: await prisma.campaignPhoto.count(), categories: await prisma.campaignCategory.count() };
  const rollback = new Error("ROLLBACK_EXPECTED");
  try {
    await prisma.$transaction(async (tx) => {
      const service = loadService(tx);
      const data = {
        countryCode: "BJ", isUrgent: true,
        title: "Vérification transactionnelle des collectes",
        shortDescription: "Vérification technique non conservée.",
        description: "Vérification technique de l’enregistrement et des photos. Transaction annulée avant toute publication effective.",
        categoryId: category.id, targetAmount: 1000, startDate: "2026-11-01", endDate: "2026-11-30",
        photos: objects.map((object) => ({ storagePath: object.name, imageUrl: "" })),
      };
      const draft = await service.createCampaign({ ...data, status: "DRAFT" });
      const row = await tx.campaign.findUniqueOrThrow({ where: { id: draft.id }, include: { photos: { orderBy: { position: "asc" } } } });
      assert.equal(row.publishedAt, null);
      assert.equal(row.currency, "XOF");
      assert.equal(row.beneficiaryId, null);
      assert.equal(row.photos.length, objects.length);
      assert.equal(row.startDate.toISOString(), "2026-11-01T00:00:00.000Z");
      assert.equal(await service.getPublishedCampaignBySlug(draft.slug), null);
      for (const [index, photo] of row.photos.entries()) {
        assert.equal(photo.position, index);
        assert.ok(photo.imageUrl.startsWith(process.env.SUPABASE_URL + "/storage/v1/object/public/"));
      }
      console.log(`PASS : brouillon, slug, catégorie réelle et ${objects.length} photo(s) enregistrés ensemble.`);
      const published = await service.createCampaign({ ...data, status: "PUBLISHED" });
      const detail = await service.getPublishedCampaignBySlug(published.slug);
      assert.ok(detail?.publishedAt);
      assert.equal(detail.photos.length, objects.length);
      assert.equal(detail.progress.collectedAmount, 0);
      assert.equal(detail.category.name.length > 0, true);
      assert.equal(detail.countryCode, "BJ");
      assert.equal(detail.isUrgent, true);
      const requests = loadService(new Proxy(tx, { get(target, key) { return key === "$transaction" ? (callback) => callback(tx) : target[key]; } }), "src/lib/requests/service.ts");
      const modified = await requests.updateRequest(draft.id, { ...data, title: "Collecte modifiee en transaction", countryCode: "TG", isUrgent: false });
      assert.equal(modified.title, "Collecte modifiee en transaction");
      assert.equal(modified.countryCode, "TG");
      assert.equal(modified.isUrgent, false);
      assert.equal(await requests.deleteRequest(draft.id), "deleted");
      assert.equal(await tx.campaign.findUnique({ where: { id: draft.id } }), null);
      assert.equal(await tx.campaignPhoto.count({ where: { campaignId: draft.id } }), 0);
      console.log("PASS : pays, urgence, modification et suppression des demandes avec cascade des photos.");
      console.log("PASS : statut publié et lecture publique avec photos, catégorie et progression.");
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  const after = { campaigns: await prisma.campaign.count(), photos: await prisma.campaignPhoto.count(), categories: await prisma.campaignCategory.count() };
  assert.deepEqual(after, before);
  console.log("PASS : transaction annulée, aucune collecte/photo/catégorie de test conservée.");
}

main().catch((error) => {
  console.error("Échec de la vérification transactionnelle:", { type: error.name, code: error.code || "TEST_FAILED" });
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
