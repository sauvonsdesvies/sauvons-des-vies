/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner and transpiled source loader. */
// Real database operations are rolled back; existing publications are never mutated.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
require('@next/env').loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function loadSource(filename, client) {
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
      if (name.startsWith('./')) return load(path.resolve(path.dirname(file), name + '.ts'));
      return require(name);
    }
    new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
    return mod.exports;
  }
  return load(filename);
}

async function databaseChecks() {
  const before = [await prisma.publication.count(), await prisma.publicationPhoto.count()];
  const rollback = new Error('EXPECTED_ROLLBACK');
  try {
    await prisma.$transaction(async (tx) => {
      const service = loadSource('src/lib/publications/service.ts', tx);
      const photo = await tx.publicationPhoto.findFirst({ select: { storagePath: true } });
      const created = await service.createPublication({
        title: 'Verification transactionnelle des journaux',
        shortDescription: 'Verification technique non conservee.',
        content: 'Verification technique des modifications et suppressions, annulee avant validation.',
        category: 'ACTION_REALISEE', language: 'fr', status: 'DRAFT',
        publicationDate: '2000-01-01', tags: [], photos: photo ? [photo] : [],
      });
      const initial = await tx.publication.findUniqueOrThrow({ where: { id: created.id } });
      assert.equal(initial.archivedAt, null);
      const changes = {
        title: 'Publication modifiee dans une transaction annulee',
        shortDescription: 'Resume mis a jour pour verification.',
        content: 'Contenu mis a jour et relu directement dans la vraie base avant annulation.',
      };
      await service.updatePublicationText(created.id, changes);
      const updated = await tx.publication.findUniqueOrThrow({ where: { id: created.id } });
      for (const key of Object.keys(changes)) assert.equal(updated[key], changes[key]);
      assert.equal(updated.slug, initial.slug);
      assert.equal(updated.status, initial.status);
      await service.deletePublication(created.id);
      assert.equal(await tx.publication.findUnique({ where: { id: created.id } }), null);
      assert.equal(await tx.publicationPhoto.count({ where: { publicationId: created.id } }), 0);
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.deepEqual([await prisma.publication.count(), await prisma.publicationPhoto.count()], before);
  console.log('PASS database: archivedAt, update, delete, cascade, rollback; existing data preserved.');
}

async function httpChecks() {
  const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const auth = loadSource('src/lib/admin-auth.ts', prisma);
  const { token } = await auth.createAdminSession();
  const { jwtVerify } = require('jose');
  const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
  try {
    const cookie = `${auth.SESSION_COOKIE}=${token}`;
    const id = randomUUID();
    const endpoint = `/api/admin/publications/${id}`;
    async function check(url, method, expected, body, authenticated = true, origin = base) {
      const response = await fetch(base + url, {
        method, headers: { ...(authenticated ? { cookie } : {}), origin, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const text = await response.text();
      assert.equal(response.status, expected, `${method} ${url}`);
      if (expected === 200 && url.startsWith('/admin')) {
        assert.ok(!text.includes('PrismaClientValidationError') && !text.includes('PrismaClientKnownRequestError'), 'No Prisma error in streamed page');
        assert.ok(!text.includes('NEXT_REDIRECT'), 'Authenticated page must not redirect');
        if (url === '/admin/dons' && existing) {
          assert.ok(text.includes('Modifier la publication :'), 'Recent publication edit action');
          assert.ok(text.includes('Supprimer la publication :'), 'Recent publication delete action');
          assert.ok(text.includes('href="/admin/journaux"'), 'Full publication management link');
        }
      }
    }
    const data = { title: 'Verification technique', shortDescription: 'Resume de verification valide.', content: 'Contenu de verification technique suffisamment long.' };
    await check(endpoint, 'GET', 401, undefined, false);
    await check(endpoint, 'PATCH', 401, data, false);
    await check(endpoint, 'DELETE', 401, undefined, false);
    await check(endpoint, 'PATCH', 403, data, true, 'https://external.invalid');
    await check(endpoint, 'DELETE', 403, undefined, true, 'https://external.invalid');
    await check(endpoint, 'GET', 404);
    await check(endpoint, 'PATCH', 400, { title: 'x' });
    await check(endpoint, 'PATCH', 404, data);
    await check(endpoint, 'DELETE', 404);
    const existing = await prisma.publication.findFirst({ select: { id: true } });
    if (existing) await check(`/api/admin/publications/${existing.id}`, 'GET', 200);
    await check('/admin/journaux', 'GET', 200);
    await check('/admin/dons', 'GET', 200);
    await check('/api/admin/requests', 'GET', 200);
    await check(`/api/admin/requests/${id}`, 'DELETE', 401, undefined, false);
    await check(`/api/admin/requests/${id}`, 'DELETE', 403, undefined, true, 'https://external.invalid');
    await check(`/api/admin/requests/${id}`, 'DELETE', 404);
    const campaign = await prisma.campaign.findFirst({ select: { id: true } });
    if (campaign) {
      await check(`/admin/demandes/${campaign.id}/modifier`, 'GET', 200);
      await check(`/admin/demandes/${campaign.id}`, 'GET', 200);
    }
    await check('/admin', 'GET', 200);
    console.log('PASS HTTP: protected session, origin, validation, missing resource, Journaux and dashboard/requests reads.');
  } finally {
    await prisma.adminSession.update({ where: { id: payload.sessionId }, data: { expiresAt: new Date(0) } });
  }
}

databaseChecks().then(httpChecks).catch((error) => {
  console.error('Journaux verification failed:', { type: error.name, code: error.code || 'ASSERTION', message: error instanceof assert.AssertionError ? error.message : undefined });
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
