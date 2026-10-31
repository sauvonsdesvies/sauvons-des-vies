/* eslint-disable @typescript-eslint/no-require-imports -- Standalone React server-rendering regression tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(filename, language = 'fr') {
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  function resolve(name) {
    if (name === '@/lib/i18n/LanguageProvider') return { useTranslation: () => ({ language }) };
    if (name.startsWith('./')) return { default: load(path.resolve(path.dirname(filename), name + '.tsx'), language) };
    return require(name);
  }
  new Function('require', 'module', 'exports', source)(resolve, mod, mod.exports);
  return mod.exports.default;
}

const Body = load('src/components/public/news/PublicationContent.tsx');
const body = renderToStaticMarkup(React.createElement(Body, { content: '# Titre\n\nTexte **important**, *italique*, <u>souligné</u> et `code`.\n\n- Une action\n- Une autre\n\n> Citation enregistrée\n\n[lien](https://example.com) [interdit](javascript:alert)\n<script>alert(1)</script>\n\n*****4. Pourquoi les erreu**rs ?' }));
assert.match(body, /<h2/);
assert.match(body, /<strong[^>]*>important<\/strong>/);
assert.match(body, /<em>italique<\/em>/);
assert.match(body, /<u>souligné<\/u>/);
assert.match(body, /<ul/);
assert.match(body, /<blockquote/);
assert.match(body, /href="https:\/\/example.com"/);
assert.ok(!body.includes('href="javascript:'));
assert.ok(!body.includes('<script>'));
assert.ok(body.includes('&lt;script&gt;'));
assert.ok(body.includes('Pourquoi les erreurs'));
assert.ok(!body.includes('*****'));

const publication = {
  id: 'test-only', slug: 'publication-de-test', title: 'Publication de test', shortDescription: 'Résumé de test.', content: 'Texte public. '.repeat(80),
  category: 'ACTION_REALISEE', language: 'fr', authorName: 'Fondation Sauvons des Vies', imageUrl: '/logo/logo.png',
  publicationDate: '2026-10-31T12:00:00.000Z', createdAt: '2026-10-31T12:00:00.000Z', updatedAt: '2026-10-31T12:00:00.000Z',
  readingTimeMinutes: 2, tags: [], photos: [], campaigns: [],
  actionStats: { amountUsed: null, currency: null, beneficiariesHelped: null, interventionDate: null, hospitalName: null },
};
const data = { publication, recentPublications: [], categories: [{ name: 'ACTION_REALISEE', count: 1 }] };
const Page = load('src/components/public/news/NewsDetailPage.tsx');
const html = renderToStaticMarkup(React.createElement(Page, { data }));
assert.ok(html.includes('Cette action en chiffres'));
assert.ok(html.includes('pas encore renseignés'));
assert.ok(html.includes('Publications récentes'));
assert.ok(html.includes('Action réalisée'));
assert.ok(html.includes('/actualites?categorie=ACTION_REALISEE'));
assert.ok(!html.includes('>ACTION_REALISEE<'));
assert.ok(!html.includes('0 FCFA'));
assert.ok(!html.includes('max-w-[1500px]'));
assert.ok(!html.includes('max-w-[760px]'));
assert.ok(html.includes('Lire la suite'));
const withFigures = { ...data, publication: { ...publication, actionStats: { amountUsed: 123456, currency: 'XOF', beneficiariesHelped: 2, interventionDate: '2026-10-30T00:00:00.000Z', hospitalName: 'Partenaire de test' } } };
const populated = renderToStaticMarkup(React.createElement(Page, { data: withFigures }));
assert.ok(populated.includes('Partenaire de test'));
assert.ok(!populated.includes('pas encore renseignés'));
const English = load('src/components/public/news/NewsDetailPage.tsx', 'en');
const english = renderToStaticMarkup(React.createElement(English, { data }));
assert.ok(english.includes('Completed action'));
assert.ok(english.includes('Recent publications'));
console.log('PASS: editor formatting, escaped HTML, safe links, category labels, recent publication, real/absent figures, full-width layout and English labels. No database writes.');
