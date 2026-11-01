/* eslint-disable @typescript-eslint/no-require-imports -- Transactional integration runner. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
require('@next/env').loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
function loader(client, authorized = true) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    function resolve(name) {
      if (name === 'server-only') return {};
      if (name === 'next/server') return { ...require(name), connection: async () => {} };
      if (name === '@/lib/prisma') return { prisma: client };
      if (name === '@/lib/admin-auth') return { getAdminSession: async () => authorized ? { id: 'test' } : null };
      if (name.startsWith('@/') || name.startsWith('./')) return load((name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name)) + '.ts');
      return require(name);
    }
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
    return mod.exports;
  }
  return load;
}
async function main() {
  const rollback = new Error('ROLLBACK_TEST_ONLY');
  let id;
  try {
    await prisma.$transaction(async tx => {
      const load = loader(tx);
      const dashboard = load('src/lib/admin-dashboard.ts');
      const before = await dashboard.getAdminDashboardData('all');
      const category = await tx.campaignCategory.findFirst({ select: { id: true } });
      assert.ok(category);
      const input = { title: 'Test opening totals', shortDescription: 'Test opening totals summary.', description: 'Test opening totals full description.', categoryId: category.id, countryCode: 'BJ', isUrgent: true, targetAmount: 1000, initialCollectedAmount: '200', initialDonorCount: '4', status: 'PUBLISHED', photos: [] };
      const validate = load('src/lib/campaigns/validation.ts').validateCampaignInput;
      for (const field of ['initialCollectedAmount', 'initialDonorCount']) {
        for (const value of [-1, 1.5, true, 'invalid', 2147483648]) assert.equal(validate({ ...input, [field]: value }).success, false);
      }
      const parsed = validate(input); assert.equal(parsed.success, true);
      const created = await load('src/lib/campaigns/service.ts').createCampaign(parsed.data);
      id = created.id;
      for (const [status, amount] of [['CONFIRMED', 25], ['CONFIRMED', 25], ['PENDING', 700], ['FAILED', 800]]) {
        await tx.donation.create({ data: { campaignId: id, amount, currency: 'XOF', status, donorEmail: 'test@example.invalid', confirmedAt: status === 'CONFIRMED' ? new Date() : null } });
      }
      const home = load('src/lib/public/home-data.ts');
      const list = load('src/lib/public/campaigns-data.ts');
      const detail = load('src/lib/public/campaign-detail-data.ts');
      async function check(amount, donors) {
        const cards = await home.getPublicCampaignCards({ limit: 100 });
        const listing = await list.getPublicCampaigns({ search: input.title });
        const page = await detail.getPublicCampaignDetail(created.slug);
        for (const item of [cards.find(row => row.id === id), listing.campaigns.find(row => row.id === id), page]) {
          assert.ok(item); assert.equal(item.collectedAmount, amount); assert.equal(item.donorCount, donors);
          assert.equal(item.remainingAmount, Math.max(0, 1000 - amount));
          assert.equal(item.progressPercentage, Math.min(100, amount / 1000 * 100));
        }
        const progress = await load('src/lib/campaigns/progress.ts').getConfirmedCampaignProgress(id, 1000);
        assert.equal(progress.collectedAmount, amount);
        assert.equal(progress.confirmedDonationsCount, donors);
        const admin = await dashboard.getAdminDashboardData('all');
        assert.equal(admin.stats.totalDonations - before.stats.totalDonations, amount);
        assert.equal(admin.stats.confirmedDonations - before.stats.confirmedDonations, donors);
        const recent = admin.recentCampaigns.find(row => row.id === id);
        assert.ok(recent);
        assert.equal(recent.collectedAmount, amount);
        assert.equal(recent.donorCount, donors);
        assert.equal(admin.donationsByCategory.reduce((sum, row) => sum + row.amount, 0), admin.stats.totalDonations);
        assert.equal(admin.donationEvolution.reduce((sum, row) => sum + row.amount, 0), admin.stats.totalDonations);
      }
      await check(250, 5);
      const route = load('src/app/api/admin/campaigns/[id]/route.ts');
      const req = (origin = 'https://example.org') => new NextRequest(`https://example.org/api/admin/campaigns/${id}`, { method: 'PUT', headers: { origin, host: 'example.org', 'content-type': 'application/json' }, body: JSON.stringify({ ...input, initialCollectedAmount: 400, initialDonorCount: 8 }) });
      assert.equal((await loader(tx, false)('src/app/api/admin/campaigns/[id]/route.ts').PUT(req(), { params: Promise.resolve({ id }) })).status, 401);
      assert.equal((await route.PUT(req('https://invalid.org'), { params: Promise.resolve({ id }) })).status, 403);
      assert.equal((await route.PUT(req(), { params: Promise.resolve({ id }) })).status, 200);
      await check(450, 9);
      await tx.campaign.update({ where: { id }, data: { initialCollectedAmount: 1200, initialDonorCount: 10 } });
      await check(1250, 11);
      await tx.campaign.update({ where: { id }, data: { initialCollectedAmount: 0, initialDonorCount: 0 } });
      await check(50, 1);
      assert.equal(await tx.donation.count({ where: { campaignId: id } }), 4);
      throw rollback;
    }, { timeout: 120000, isolationLevel: 'RepeatableRead' });
  } catch (error) { if (error !== rollback) throw error; }
  assert.equal(await prisma.campaign.count({ where: { id } }), 0);
  const sync = loader(prisma)('src/lib/campaigns/live-updates.ts');
  global.window = new EventTarget();
  let storedKey, refreshes = 0;
  global.localStorage = { setItem: key => { storedKey = key; } };
  const unsubscribe = sync.subscribeCampaignUpdates(() => { refreshes++; });
  try {
    sync.notifyCampaignUpdate();
    assert.equal(refreshes, 1);
    const event = new Event('storage'); Object.defineProperty(event, 'key', { value: storedKey });
    window.dispatchEvent(event); assert.equal(refreshes, 2);
    unsubscribe(); sync.notifyCampaignUpdate(); assert.equal(refreshes, 2);
  } finally { delete global.window; delete global.localStorage; }
  console.log('PASS: unified home/list/detail/dashboard amounts and participants, dashboard charts, updates and cross-tab refresh, validation, unconfirmed exclusion. All test writes rolled back.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
