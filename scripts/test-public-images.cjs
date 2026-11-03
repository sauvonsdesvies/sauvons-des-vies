/* eslint-disable @typescript-eslint/no-require-imports -- Isolated tests without network or database access. */
const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
function load(file) {
  const exports = {};
  new Function('exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exports);
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
  global.fetch = async () => { calls++; return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } }); };
  try {
    const { GET } = load('src/app/api/public/image/route.ts');
    const request = url => ({ nextUrl: new URL(`https://example.org/api/public/image?url=${encodeURIComponent(url)}`) });
    for (const invalid of ['http://test.supabase.co/storage/v1/object/public/a', 'https://evil.org/storage/v1/object/public/a', 'https://test.supabase.co/storage/v1/object/private/a', 'https://user:pass@test.supabase.co/storage/v1/object/public/a']) {
      assert.equal((await GET(request(invalid))).status, 400);
    }
    assert.equal(calls, 0);
    const response = await GET(request(image));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.match(response.headers.get('cache-control'), /max-age=3600/);
    assert.equal((await response.arrayBuffer()).byteLength, 3);
    global.fetch = async () => new Response('<html>', { headers: { 'Content-Type': 'text/html' } });
    assert.equal((await GET(request(image))).status, 415);
    global.fetch = async () => new Response(null, { status: 404 });
    assert.equal((await GET(request(image))).status, 404);
    console.log('PASS: same-domain image URLs, original bytes, cache, host/private-path restrictions, content types and missing files.');
  } finally {
    global.fetch = originalFetch;
    if (previous === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previous;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
