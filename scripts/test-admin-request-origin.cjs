/* eslint-disable @typescript-eslint/no-require-imports -- Isolated origin tests, no credentials or database access. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const mod = { exports: {} };
const source = fs.readFileSync('src/lib/admin-request-origin.ts', 'utf8');
new Function('exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(mod.exports);
const allowed = mod.exports.isAdminRequestOriginAllowed;
const previous = { NODE_ENV: process.env.NODE_ENV, ADMIN_ALLOWED_ORIGIN: process.env.ADMIN_ALLOWED_ORIGIN, NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL };
const request = headers => new NextRequest('http://internal:3000/api/admin/auth/connexion', { headers });
try {
  process.env.NODE_ENV = 'production';
  process.env.ADMIN_ALLOWED_ORIGIN = 'http://localhost:3000';
  delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.equal(allowed(request({ origin: 'https://example.hostingersite.com', host: 'example.hostingersite.com', 'sec-fetch-site': 'same-origin' })), true);
  assert.equal(allowed(request({ origin: 'https://example.hostingersite.com', host: 'internal:3000', 'x-forwarded-host': 'example.hostingersite.com', 'x-forwarded-proto': 'https', 'sec-fetch-site': 'same-origin' })), true);
  assert.equal(allowed(request({ origin: 'https://evil.example', host: 'example.hostingersite.com', 'sec-fetch-site': 'cross-site' })), false);
  assert.equal(allowed(request({ origin: 'https://evil.example', host: 'internal:3000' })), false);
  assert.equal(allowed(request({ host: 'example.hostingersite.com' })), false);
  assert.equal(allowed(request({ origin: 'http://example.hostingersite.com', host: 'example.hostingersite.com' })), false);
  assert.equal(allowed(request({ origin: 'https://example.hostingersite.com/path', host: 'example.hostingersite.com' })), false);
  assert.equal(allowed(request({ origin: 'https://example.hostingersite.com', host: 'internal:3000', 'x-forwarded-host': 'example.hostingersite.com', 'x-forwarded-proto': 'https' })), false);
  process.env.ADMIN_ALLOWED_ORIGIN = 'https://example.hostingersite.com';
  assert.equal(allowed(request({ origin: 'https://example.hostingersite.com', host: 'internal:3000' })), true);
  process.env.NODE_ENV = 'development';
  assert.equal(allowed(new NextRequest('http://localhost:3000/api/admin/auth/connexion', { headers: { origin: 'http://localhost:3000' } })), true);
  for (const route of ['connexion', 'verification', 'deconnexion']) {
    assert.match(fs.readFileSync(`src/app/api/admin/auth/${route}/route.ts`, 'utf8'), /!isAdminRequestOriginAllowed\(request\)/);
  }
  console.log('PASS: Hostinger proxy, configured origin, localhost, cross-site rejection, HTTPS and all three auth routes.');
} finally {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
