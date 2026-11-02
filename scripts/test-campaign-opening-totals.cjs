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
      const currencyBaseline = new Map((await dashboard.getAdminDashboardData('all')).collectionTotalsByCurrency.map(total => [total.currency, total.collectedAmount]));
      for (const currency of ['USD', 'EUR', 'XOF', 'GNF', 'XAF']) {
        const parsedCurrency = validate({ ...input, currency });
        assert.equal(parsedCurrency.success, true);
        const other = await load('src/lib/campaigns/service.ts').createCampaign(parsedCurrency.data);
        await tx.donation.create({ data: { campaignId: other.id, currency, amount: 25, status: 'CONFIRMED', confirmedAt: new Date() } });
        await tx.donation.create({ data: { campaignId: other.id, currency: currency === 'XOF' ? 'EUR' : 'XOF', amount: 9000, status: 'CONFIRMED', confirmedAt: new Date() } });
        const cards = await home.getPublicCampaignCards({ limit: 100 });
        const listing = await list.getPublicCampaigns({ search: input.title });
        const page = await detail.getPublicCampaignDetail(other.slug);
        for (const item of [cards.find(row => row.id === other.id), listing.campaigns.find(row => row.id === other.id), page]) {
          assert.ok(item); assert.equal(item.currency, currency);
          assert.equal(item.collectedAmount, 225); assert.equal(item.remainingAmount, 775);
          assert.equal(item.donorCount, 5);
        }
        const progress = await load('src/lib/campaigns/progress.ts').getConfirmedCampaignProgress(other.id, 1000);
        assert.equal(progress.collectedAmount, 225);
        const adminCurrency = (await dashboard.getAdminDashboardData('all')).collectionTotalsByCurrency.find(total => total.currency === currency);
        assert.ok(adminCurrency);
        assert.equal(adminCurrency.collectedAmount - (currencyBaseline.get(currency) ?? 0), 225);
        const format = load('src/lib/public/formatters.ts').formatMoney;
        for (const language of ['fr', 'en', 'de', 'es']) assert.ok(format(225, currency, language).includes(currency));
        const edit = new NextRequest(`https://example.org/api/admin/campaigns/${other.id}`, { method: 'PUT', headers: { origin: 'https://example.org', host: 'example.org', 'content-type': 'application/json' }, body: JSON.stringify({ ...input, currency: currency === 'XOF' ? 'EUR' : 'XOF' }) });
        assert.equal((await route.PUT(edit, { params: Promise.resolve({ id: other.id }) })).status, 400);
      }
      assert.equal(validate({ ...input, currency: 'INVALID' }).success, false);
      throw rollback;
    }, { timeout: 180000, isolationLevel: 'RepeatableRead' });
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
