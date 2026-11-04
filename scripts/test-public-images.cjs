/* eslint-disable @typescript-eslint/no-require-imports -- Isolated tests without network or database access. */
const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const sharp = require('sharp');
function load(file) {
  const exports = {};
  new Function('exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText)(exports, require);
  return exports;
}
async function main() {
  const { publicImageSource } = load('src/lib/public/image-source.ts');
  const image = 'https://test.supabase.co/storage/v1/object/public/campaign-photos/photo.png';
  assert.equal(publicImageSource('/logo/logo.png'), '/logo/logo.png');
  assert.equal(publicImageSource(image), `/api/public/image?url=${encodeURIComponent(image)}`);
  assert.equal(publicImageSource('https://example.org/photo.png'), 'https://example.org/photo.png');
  const previous = process.env.SUPABASE_URL;
  const originalFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  let calls = 0;
  const original = await sharp({ create: { width: 1800, height: 1200, channels: 3, background: '#00aabb' } }).png().toBuffer();
  global.fetch = async () => { calls++; return new Response(original, { headers: { 'Content-Type': 'image/png' } }); };
  try {
    const { GET } = load('src/app/api/public/image/route.ts');
    const request = url => ({ nextUrl: new URL(`https://example.org/api/public/image?url=${encodeURIComponent(url)}`) });
    for (const invalid of ['http://test.supabase.co/storage/v1/object/public/a', 'https://evil.org/storage/v1/object/public/a', 'https://test.supabase.co/storage/v1/object/private/a', 'https://user:pass@test.supabase.co/storage/v1/object/public/a']) {
      assert.equal((await GET(request(invalid))).status, 400);
    }
    assert.equal(calls, 0);
    const response = await GET(request(image));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    assert.match(response.headers.get('cache-control'), /max-age=3600/);
    const optimized = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(optimized).metadata();
    assert.equal(metadata.width, 1280);
    assert.equal(metadata.height, 853);
    assert.ok(optimized.length < original.length);
    assert.equal((await GET(request(image))).status, 200);
    assert.equal(calls, 1);
    global.fetch = async () => new Response('<html>', { headers: { 'Content-Type': 'text/html' } });
    assert.equal((await GET(request(image + '?invalid=1'))).status, 415);
    global.fetch = async () => new Response(null, { status: 404 });
    assert.equal((await GET(request(image + '?missing=1'))).status, 404);
    console.log('PASS: same-domain image URLs, WebP resizing, aspect ratio, cache reuse, host/private-path restrictions, content types and missing files.');
  } finally {
    global.fetch = originalFetch;
    if (previous === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previous;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
