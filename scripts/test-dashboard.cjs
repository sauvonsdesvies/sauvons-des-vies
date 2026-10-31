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
  const key = 'fondation-public-statistics-v1';
  const before = await prisma.adminNotification.findUnique({ where: { id: key } });
  const service = loadSource('src/lib/admin-dashboard.ts', prisma);
  const data = await service.getAdminDashboardData('all');
  assert.ok(data.notifications.every((n) => n.id !== key && n.type !== 'SYSTEM_STATISTICS'));
  assert.equal(data.stats.activeCampaigns, await prisma.campaign.count({ where: { status: { in: ['ACTIVE', 'PUBLISHED'] }, completedAt: null } }));
  assert.equal(data.stats.completedCampaigns, await prisma.campaign.count({ where: { status: { in: ['COMPLETED', 'CLOSED'] } } }));
  const donations = await prisma.donation.aggregate({ where: { status: 'CONFIRMED', currency: 'XOF', confirmedAt: { not: null } }, _sum: { amount: true }, _count: true });
  assert.equal(data.stats.totalDonations, donations._sum.amount || 0);
  assert.equal(data.stats.confirmedDonations, donations._count);
  assert.deepEqual(await prisma.adminNotification.findUnique({ where: { id: key } }), before);
  console.log('PASS: dashboard totals match real operations; technical JSON excluded; public figures preserved.');
  const auth = loadSource('src/lib/admin-auth.ts', prisma);
  const { token } = await auth.createAdminSession();
  const { payload } = await require('jose').jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
  try {
    const base = process.env.TEST_BASE_URL || 'http://localhost:3002';
    const headers = { cookie: auth.SESSION_COOKIE + '=' + token };
    const dashboard = await fetch(base + '/admin', { headers });
    const html = await dashboard.text();
    assert.equal(dashboard.status, 200);
    assert.ok(!html.includes('SYSTEM_STATISTICS') && !html.includes(key));
    assert.ok(!html.includes('data-msg='), 'No server rendering error');
    const hrefs = [...new Set([...html.matchAll(/href="(\/admin[^"#]*)"/g)].map((m) => m[1].replaceAll('&amp;', '&')))];
    for (const expected of ['/admin/campagnes/nouvelle', '/admin/demandes', '/admin/dons', '/admin/paiements-hopitaux']) assert.ok(hrefs.includes(expected));
    for (let i = 0; i < hrefs.length; i += 3) {
      await Promise.all(hrefs.slice(i, i + 3).map(async (href) => {
        const response = await fetch(base + href, { headers });
        const body = await response.text();
        assert.equal(response.status, 200, href);
        assert.ok(!response.url.includes('/connexion'), 'Session accepted for ' + href);
        assert.ok(!body.includes('data-msg='), 'No server error for ' + href);
      }));
    }
    console.log('PASS: authenticated dashboard and ' + hrefs.length + ' admin links respond without 404 or server rendering error.');
  } finally {
    await prisma.adminSession.update({ where: { id: payload.sessionId }, data: { expiresAt: new Date(0) } });
  }
}
main().catch((error) => { console.error('Dashboard test failed:', { type: error.name, code: error.code || 'ASSERTION', message: error instanceof assert.AssertionError ? error.message : undefined }); process.exitCode = 1; }).finally(() => prisma.$disconnect());
