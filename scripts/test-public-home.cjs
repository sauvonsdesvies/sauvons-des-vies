/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner and transpiled source loader. */
// Real database operations are rolled back; existing publications are never mutated.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require('@next/env').loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function loadSource(filename, client, authorized = true) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    function resolve(name) {
      if (name === 'server-only') return {};
      if (name === 'next/server') return { ...require(name), connection: async () => {} };
      if (name === '@/lib/prisma') return { prisma: client };
      if (name === '@/lib/admin-auth') return { getAdminSession: async () => authorized ? { id: 'test' } : null };
      if (name.startsWith('@/')) return load(path.resolve('src', name.slice(2) + '.ts'));
      if (name.startsWith('./')) return load(path.resolve(path.dirname(file), name + '.ts'));
      return require(name);
    }
    new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
    return mod.exports;
  }
  return load(filename);
}




async function main() {
  const { randomUUID } = require('node:crypto');
  const rollback = new Error('ROLLBACK');
  const category = await prisma.campaignCategory.findFirst({ select: { id: true } });
  assert.ok(category);
  try {
    await prisma.$transaction(async (tx) => {
      const home = loadSource('src/lib/public/home-data.ts', tx);
      const base = { title: 'Verification accueil annulee', slug: randomUUID(), description: 'Verification du filtrage public des donnees.', shortDescription: 'Verification technique annulee.', categoryId: category.id, targetAmount: 1000, currency: 'XOF', countryCode: 'BJ', isUrgent: true };
      const published = await tx.campaign.create({ data: { ...base, status: 'PUBLISHED', publishedAt: new Date(), startDate: new Date(Date.now() + 86400000) }, select: { id: true } });
      const draft = await tx.campaign.create({ data: { ...base, slug: randomUUID(), status: 'DRAFT' }, select: { id: true } });
      const donationId = randomUUID();
      await tx.$executeRaw`INSERT INTO "Donation" (id, "campaignId", amount, currency, status, "donorEmail", "confirmedAt", "createdAt") VALUES (${donationId}, ${published.id}, 250, 'XOF', 'CONFIRMED', 'private@example.invalid', NOW(), NOW())`;
      const cards = await home.getPublicCampaignCards({ limit: 100 });
      const card = cards.find((item) => item.id === published.id);
      assert.ok(card);
      assert.equal(card.collectedAmount, 250);
      assert.equal(card.remainingAmount, 750);
      assert.equal(card.progressPercentage, 25);
      assert.equal(card.donorCount, 1);
      assert.equal(card.isUrgent, true);
      assert.ok(!cards.some((item) => item.id === draft.id));
      assert.ok(!JSON.stringify(cards).includes('private@example.invalid'));
      const publicationData = { title: 'Publication de verification', shortDescription: 'Resume de verification public.', content: 'Contenu public de verification.', category: 'ACTION_REALISEE', slug: randomUUID(), status: 'PUBLISHED', publishedAt: new Date() };
      const visible = await tx.publication.create({ data: publicationData, select: { id: true } });
      const archived = await tx.publication.create({ data: { ...publicationData, slug: randomUUID(), archivedAt: new Date() }, select: { id: true } });
      const news = await home.getHomeNews();
      assert.ok(news.some((item) => item.id === visible.id));
      assert.ok(!news.some((item) => item.id === archived.id));
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  console.log('PASS: published content, urgency, confirmed amounts, draft/archive exclusion and privacy. All test writes rolled back.');
  const base = process.env.TEST_BASE_URL || 'http://localhost:3002';
  const response = await fetch(base + '/api/public/home');
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.ok(payload.success && payload.data);
  assert.deepEqual(payload.statistics, payload.data.statistics);
  assert.ok(!JSON.stringify(payload).includes('donorEmail'));
  const links = ['/', '/campagnes', '/causes', '/actualites', '/faire-un-don'];
  const campaign = [...payload.data.urgentCampaigns, ...payload.data.campaigns][0];
  if (campaign) links.push('/campagnes/' + campaign.slug);
  const campaigns = payload.data.campaigns;
  for (let index = 0; index < campaigns.length; index += 3) {
    await Promise.all(campaigns.slice(index, index + 3).map(async item => {
      if (!item.imageUrl) return;
      const image = await fetch(new URL(item.imageUrl, base), { method: 'HEAD', signal: AbortSignal.timeout(30000) });
      assert.equal(image.status, 200, 'Public image for ' + item.id);
      assert.ok(image.headers.get('content-type')?.startsWith('image/'));
    }));
  }
  console.log('PASS: public image URLs checked for ' + campaigns.length + ' published campaigns.');
  for (const item of campaigns) links.push('/campagnes/' + item.slug);
  for (const social of ['facebook', 'instagram', 'tiktok', 'youtube']) links.push('/icons/social/' + social + '.svg');
  if (payload.data.news[0]) links.push('/actualites/' + payload.data.news[0].slug);
  for (const link of links) {
    const result = await fetch(base + link);
    const html = await result.text();
    assert.equal(result.status, 200, link);
    assert.ok(!html.includes('data-msg='), link + ' server rendering');
    assert.ok(!/[\u00c3][\u00a0-\u00bf]|\u00e2\u20ac/.test(html), link + ' text encoding');
    if (link.startsWith('/campagnes/')) assert.ok(html.includes('campaign-donation-panel'), link + ' donation anchor');
  }
  console.log('PASS: home API and ' + links.length + ' public pages return HTTP 200 without server rendering errors.');
}
main().catch((error) => { console.error('Home test failed:', { type: error.name, code: error.code || 'ASSERTION', message: error instanceof assert.AssertionError ? error.message : undefined }); process.exitCode = 1; }).finally(() => prisma.$disconnect());
