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
  const rollback = new Error('ROLLBACK');
  try {
    await prisma.$transaction(async (tx) => {
      const service = loadSource('src/lib/statistics/service.ts', tx);
      const route = loadSource('src/app/api/admin/beneficiaires/route.ts', tx);
      const { NextRequest } = require('next/server');
      function request(data, origin = 'http://localhost:3000') {
        return new NextRequest('http://localhost:3000/api/admin/beneficiaires', { method: 'PUT', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      }
      const values = { activeCampaigns: 45, beneficiariesHelped: 289, verifiedFiles: 4235 };
      assert.equal((await route.PUT(request(values, 'https://external.invalid'))).status, 403);
      assert.equal((await loadSource('src/app/api/admin/beneficiaires/route.ts', tx, false).PUT(request(values))).status, 401);
      for (const bad of [-1, 1.5, '12', Number.MAX_SAFE_INTEGER + 1, null]) {
        assert.equal((await route.PUT(request({ ...values, activeCampaigns: bad }))).status, 400);
      }
      assert.equal((await route.PUT(request(values))).status, 200);
      const saved = await service.getPublicStatistics();
      for (const k of Object.keys(values)) assert.equal(saved[k], values[k]);
      assert.ok(saved.updatedAt);
      const zeros = { activeCampaigns: 0, beneficiariesHelped: 0, verifiedFiles: 0 };
      assert.equal((await route.PUT(request(zeros))).status, 200);
      const reread = await service.getPublicStatistics();
      for (const k of Object.keys(zeros)) assert.equal(reread[k], 0);
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.deepEqual(await prisma.adminNotification.findUnique({ where: { id: key } }), before);
  console.log('PASS: PUT, validation, repeat save, zero values, persisted reread and rollback. Existing statistics preserved.');
  const auth = loadSource('src/lib/admin-auth.ts', prisma);
  const { token } = await auth.createAdminSession();
  const { payload } = await require('jose').jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
  try {
    const base = 'http://localhost:3000';
    const headers = { cookie: auth.SESSION_COOKIE + '=' + token };
    assert.equal((await fetch(base + '/api/admin/beneficiaires')).status, 401);
    const admin = await fetch(base + '/api/admin/beneficiaires', { headers });
    assert.equal(admin.status, 200);
    const data = await admin.json();
    const publicResponse = await fetch(base + '/api/public/statistiques');
    assert.equal(publicResponse.status, 200);
    const publicData = await publicResponse.json();
    for (const key of ['activeCampaigns', 'beneficiariesHelped', 'verifiedFiles']) assert.equal(data.statistics[key], publicData.statistics[key]);
    const page = await fetch(base + '/admin/beneficiaires', { headers });
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.ok(!html.includes('PrismaClientValidationError') && !html.includes('NEXT_REDIRECT'));
    console.log('PASS: signed session accepted over HTTP; unauthenticated access denied; public and admin figures agree; page renders.');
  } finally {
    await prisma.adminSession.update({ where: { id: payload.sessionId }, data: { expiresAt: new Date(0) } });
  }
}
main().catch((error) => { console.error('Statistics test failed:', { type: error.name, code: error.code || 'ASSERTION', message: error instanceof assert.AssertionError ? error.message : undefined }); process.exitCode = 1; }).finally(() => prisma.$disconnect());
