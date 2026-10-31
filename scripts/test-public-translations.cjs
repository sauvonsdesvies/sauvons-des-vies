/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node regression tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');

function load(filename) {
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  function resolve(name) {
    if (name === 'server-only') return {};
    if (name.startsWith('./')) return load(path.resolve(path.dirname(filename), name + '.ts'));
    return require(name);
  }
  new Function('require', 'module', 'exports', source)(resolve, mod, mod.exports);
  return mod.exports;
}

async function main() {
  const originalKey = process.env.DEEPL_API_KEY;
  const originalFetch = global.fetch;
  const originalWarn = console.warn;
  try {
    delete process.env.DEEPL_API_KEY;
    const { localizePublicContent } = load('src/lib/i18n/public-content.ts');
    const dto = { id: 'unchanged', slug: 'collecte', title: 'Soins solidaires', description: 'Aide aux soins.', category: { slug: 'sante', name: 'Santé' }, beneficiary: { name: 'Nom de personne' }, targetAmount: 123456, imageUrl: 'https://example.invalid/photo.png' };
    assert.equal(await localizePublicContent(dto, 'en'), dto, 'Missing key preserves original content');
    process.env.DEEPL_API_KEY = 'unit-test-only:fx';
    let calls = 0;
    global.fetch = async (url, options) => {
      calls++;
      assert.equal(url, 'https://api-free.deepl.com/v2/translate');
      const body = JSON.parse(options.body);
      assert.equal(body.target_lang, 'EN-GB');
      assert.ok(!body.text.includes('Nom de personne'));
      assert.ok(!body.text.includes(dto.imageUrl));
      return Response.json({ translations: body.text.map(text => ({ text: 'EN: ' + text })) });
    };
    const english = await localizePublicContent(dto, 'en');
    assert.equal(english.title, 'EN: Soins solidaires');
    assert.equal(english.category.name, 'EN: Santé');
    assert.equal(english.beneficiary.name, dto.beneficiary.name);
    assert.equal(english.imageUrl, dto.imageUrl);
    assert.equal(english.targetAmount, dto.targetAmount);
    assert.equal(english.slug, dto.slug);
    await Promise.all([localizePublicContent(dto, 'en'), localizePublicContent(dto, 'en')]);
    assert.equal(calls, 1, 'Unchanged content uses cache');
    const changed = await localizePublicContent({ ...dto, title: 'Nouveau titre' }, 'en');
    assert.equal(changed.title, 'EN: Nouveau titre');
    assert.equal(calls, 2, 'Changed content is retranslated');
    assert.equal(await localizePublicContent(dto, 'fr'), dto);
    assert.equal(await localizePublicContent(dto, 'unsupported'), dto);
    console.warn = () => {};
    global.fetch = async () => new Response(null, { status: 429 });
    assert.deepEqual(await localizePublicContent(dto, 'de'), dto, 'Provider failure preserves original content');

    const header = fs.readFileSync('src/components/public/layout/PublicHeader.tsx', 'utf8');
    const sizes = [...header.matchAll(/sizes="([^"]+)"/g)];
    assert.ok(sizes.length >= 2);
    sizes.forEach(match => assert.ok(!/[\r\n]/.test(match[1]), 'Logo preload sizes must stay on one line'));
    console.log('PASS: translation cache, changed content, unsupported language, provider failure, unchanged amounts/links/names, and single-line logo sizes. No external service called.');
  } finally {
    global.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalKey === undefined) delete process.env.DEEPL_API_KEY;
    else process.env.DEEPL_API_KEY = originalKey;
  }
}
main().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : error.name); process.exitCode = 1; });
