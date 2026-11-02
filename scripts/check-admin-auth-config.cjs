// Prints validation results only, never credentials, hashes or API keys.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@next/env').loadEnvConfig(process.cwd());

const checks = {
  ADMIN_EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((process.env.ADMIN_EMAIL || '').trim()),
  ADMIN_PASSWORD_HASH: /^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test((process.env.ADMIN_PASSWORD_HASH || '').trim()),
  AUTH_SECRET: (process.env.AUTH_SECRET || '').length >= 32,
  RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY?.trim()),
  MAIL_FROM: Boolean(process.env.MAIL_FROM?.trim()),
  ADMIN_ALLOWED_ORIGIN: false,
};
try {
  const url = new URL(process.env.ADMIN_ALLOWED_ORIGIN || '');
  checks.ADMIN_ALLOWED_ORIGIN = url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
} catch {}
for (const [name, valid] of Object.entries(checks)) console.log(`${name}: ${valid ? 'OK' : 'INVALIDE OU MANQUANT'}`);
process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
