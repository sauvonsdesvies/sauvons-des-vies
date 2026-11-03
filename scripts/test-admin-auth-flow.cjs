/* eslint-disable @typescript-eslint/no-require-imports -- Isolated auth tests; no real email or database access. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const bcrypt = require('bcryptjs');
const { NextRequest } = require('next/server');

async function main() {
  const snapshot = { ...process.env };
  const challenges = new Map();
  const sessions = new Map();
  let cookie = '';
  let otp = '';
  let attempts = 0;
  let failSession = false;
  let failEmail = false;
  const db = {
    adminLoginAttempt: { count: async () => attempts, create: async () => { attempts++; } },
    adminOtpChallenge: {
      create: async ({ data }) => { challenges.set(data.id, { consumedAt: null, ...data }); },
      findUnique: async ({ where }) => challenges.get(where.id),
      deleteMany: async ({ where }) => { challenges.delete(where.id); },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const row of challenges.values()) {
          if (where.id && row.id !== where.id) continue;
          if (row.consumedAt || (where.expiresAt && row.expiresAt <= where.expiresAt.gt) || (where.attempts && row.attempts >= where.attempts.lt)) continue;
          if (data.consumedAt) row.consumedAt = data.consumedAt;
          if (data.attempts) row.attempts += data.attempts.increment;
          count++;
        }
        return { count };
      },
    },
    adminSession: {
      create: async ({ data }) => { if (failSession) throw new Error('TEST_SESSION_FAILURE'); sessions.set(data.id, data); },
      findUnique: async ({ where }) => sessions.get(where.id),
      deleteMany: async ({ where }) => { sessions.delete(where.id); },
    },
    $transaction: async callback => {
      const before = structuredClone([...challenges]);
      try { return await callback(db); } catch (error) {
        challenges.clear(); for (const [id, row] of before) challenges.set(id, row);
        throw error;
      }
    },
  };
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const resolve = name => {
      if (name === 'server-only') return {};
      if (name === '@/lib/prisma') return { prisma: db };
      if (name === 'next/headers') return { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) };
      if (name === 'resend') return { Resend: class { emails = { send: async data => { otp = data.text.match(/\b\d{6}\b/)[0]; return { error: failEmail ? { name: 'test', message: 'test mail unavailable' } : null }; } }; } };
      if (name.startsWith('@/')) return load(path.resolve('src', name.slice(2)) + '.ts');
      return require(name);
    };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
    return mod.exports;
  }
  const originalError = console.error;
  console.error = () => {}; // Expected failures must not print test tokens or credentials.
  try {
    Object.assign(process.env, { NODE_ENV: 'production', ADMIN_EMAIL: 'admin@example.org', ADMIN_PASSWORD_HASH: await bcrypt.hash('isolated-test-password', 4), AUTH_SECRET: 'isolated-secret-for-tests-only-32-chars', RESEND_API_KEY: 'test-only', MAIL_FROM: 'admin@example.org', ADMIN_ALLOWED_ORIGIN: 'https://example.org' });
    const auth = load('src/lib/admin-auth.ts');
    const login = load('src/app/api/admin/auth/connexion/route.ts');
    const verify = load('src/app/api/admin/auth/verification/route.ts');
    const logout = load('src/app/api/admin/auth/deconnexion/route.ts');
    const request = (route, data, token) => new NextRequest(`http://internal:3000/api/admin/auth/${route}`, {
      method: 'POST', headers: { origin: 'https://example.org', host: 'example.org', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', ...(token ? { cookie: `${auth.PENDING_COOKIE}=${token}` } : {}) }, body: JSON.stringify(data),
    });
    const credentials = { email: 'admin@example.org', password: 'isolated-test-password' };
    assert.equal((await login.POST(request('connexion', { ...credentials, password: 'wrong' }))).status, 401);
    const signedIn = await login.POST(request('connexion', credentials));
    assert.equal(signedIn.status, 200);
    const pending = signedIn.cookies.get(auth.PENDING_COOKIE).value;
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=strict']) assert.equal(signedIn.headers.get('set-cookie').includes(flag), true);
    assert.equal((await verify.POST(request('verification', { code: '000000' === otp ? '111111' : '000000' }, pending))).status, 401);
    assert.equal((await verify.POST(request('verification', { code: otp }))).status, 401);
    failSession = true;
    assert.equal((await verify.POST(request('verification', { code: otp }, pending))).status, 500);
    assert.equal([...challenges.values()].find(row => !row.consumedAt)?.attempts, 1);
    failSession = false;
    const verified = await verify.POST(request('verification', { code: otp }, pending));
    assert.equal(verified.status, 200);
    cookie = verified.cookies.get(auth.SESSION_COOKIE).value;
    assert.ok(await auth.getAdminSession());
    assert.equal((await verify.POST(request('verification', { code: otp }, pending))).status, 401);
    const signoutRequest = request('deconnexion', {});
    signoutRequest.cookies.set(auth.SESSION_COOKIE, cookie);
    assert.equal((await logout.POST(signoutRequest)).status, 200);
    assert.equal(await auth.getAdminSession(), null);
    failEmail = true;
    assert.equal((await login.POST(request('connexion', credentials))).status, 503);
    assert.equal([...challenges.values()].filter(row => !row.consumedAt).length, 0);
    attempts = 5;
    assert.equal((await login.POST(request('connexion', credentials))).status, 429);
    process.env.AUTH_SECRET = 'short';
    assert.equal((await login.POST(request('connexion', credentials))).status, 503);
    console.log('PASS: production proxy login, bcrypt, OTP email mock, secure cookies, wrong/missing/reused codes, session retry rollback, session access, logout, email failure, rate limiting and invalid configuration.');
  } finally {
    console.error = originalError;
    for (const key of Object.keys(process.env)) if (!(key in snapshot)) delete process.env[key];
    Object.assign(process.env, snapshot);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
