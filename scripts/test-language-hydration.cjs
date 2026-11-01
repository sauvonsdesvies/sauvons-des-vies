/* eslint-disable @typescript-eslint/no-require-imports -- React hydration regression runner. */
// Run with TEST_DOM_MODULE pointing to an installed jsdom package, or install jsdom locally for tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToString } = require('react-dom/server');
const { JSDOM } = require(process.env.TEST_DOM_MODULE || 'jsdom');

const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const resolve = name => {
    if (name === 'next/navigation') return { usePathname: () => '/a-propos' };
    if (name === 'next/link') return { __esModule: true, default: ({ children, prefetch, scroll, ...props }) => { void prefetch; void scroll; return React.createElement('a', props, children); } };
    if (name === 'next/image') return { __esModule: true, default: ({ fill, priority, unoptimized, ...props }) => { void fill; void priority; void unoptimized; return React.createElement('img', props); } };
    if (name.startsWith('@/') || name.startsWith('./')) {
      const base = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
      return load(base + (fs.existsSync(base + '.tsx') ? '.tsx' : '.ts'));
    }
    return require(name);
  };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  return mod.exports;
}
const { default: Provider, useLanguage } = load('src/lib/i18n/LanguageProvider.tsx');
const Header = load('src/components/public/layout/PublicHeader.tsx').default;
const config = load('src/lib/i18n/config.ts');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function scenario({ saved, cookie, initial = 'fr', expected = saved || initial, blocked = false }) {
  let phase = 'server', released = true, release;
  let gate = Promise.resolve();
  const renders = [], errors = [];
  function Probe() {
    const context = useLanguage();
    renders.push({ phase, language: context.language, ready: context.isReady });
    return React.createElement('div', null,
      React.createElement('output', { id: 'language' }, context.language),
      ...['fr', 'en', 'de', 'es'].map(language => React.createElement('button', { key: language, id: `choose-${language}`, onClick: () => context.setLanguage(language) }, language)));
  }
  function DelayedHeader() {
    if (!released) throw gate;
    return React.createElement(Header);
  }
  const tree = () => React.createElement(Provider, { initialLanguage: initial }, React.createElement(Probe), React.createElement(React.Suspense, { fallback: 'Navigation' }, React.createElement(DelayedHeader)));
  const serverHTML = renderToString(tree());
  const dom = new JSDOM(`<html lang="fr"><body><div id="root">${serverHTML}</div></body></html>`, { url: 'https://foundation.example/a-propos', pretendToBeVisual: true });
  Object.assign(global, { window: dom.window, document: dom.window.document, Node: dom.window.Node, HTMLElement: dom.window.HTMLElement, Event: dom.window.Event, CustomEvent: dom.window.CustomEvent });
  if (saved) window.localStorage.setItem(config.LANGUAGE_STORAGE_KEY, saved);
  if (cookie) document.cookie = `${config.LANGUAGE_COOKIE_NAME}=${cookie}; Path=/`;
  if (blocked) {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
    Object.defineProperty(document, 'cookie', { configurable: true, get() { throw new Error('Cookies blocked'); }, set() { throw new Error('Cookies blocked'); } });
  }
  phase = 'client'; released = false;
  gate = new Promise(resolve => { release = resolve; });
  const { hydrateRoot } = require('react-dom/client');
  const root = hydrateRoot(document.getElementById('root'), tree(), { onRecoverableError: error => errors.push(error.message) });
  try {
    await delay(60); // Preference restoration runs while the header is still dehydrated.
    assert.equal(renders.find(row => row.phase === 'client')?.language, initial, 'First browser render matches SSR');
    released = true; release();
    await delay(100);
    assert.equal(document.getElementById('language').textContent, expected, 'Remembered preference restored');
    assert.equal(document.documentElement.lang, expected);
    assert.deepEqual(errors, [], 'No recoverable hydration mismatch inside Suspense');
    for (const language of ['en', 'de', 'es', 'fr']) {
      document.getElementById(`choose-${language}`).dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      await delay(25);
      assert.equal(document.getElementById('language').textContent, language);
      assert.equal(document.documentElement.lang, language);
      if (!blocked) {
        assert.equal(window.localStorage.getItem(config.LANGUAGE_STORAGE_KEY), language);
        assert.ok(document.cookie.includes(`${config.LANGUAGE_COOKIE_NAME}=${language}`));
      }
    }
    if (!blocked) {
      window.dispatchEvent(new window.StorageEvent('storage', { key: config.LANGUAGE_STORAGE_KEY, newValue: 'de' }));
      await delay(30);
      assert.equal(document.getElementById('language').textContent, 'de', 'Other-tab selection synchronized');
      window.dispatchEvent(new window.StorageEvent('storage', { key: 'unrelated-key', newValue: 'es' }));
      await delay(20);
      assert.equal(document.getElementById('language').textContent, 'de');
    }
    assert.deepEqual(errors, []);
  } finally {
    root.unmount(); await delay(40); dom.window.close();
    for (const key of ['window', 'document', 'Node', 'HTMLElement', 'Event', 'CustomEvent']) delete global[key];
  }
}
(async () => {
  for (const saved of ['fr', 'en', 'de', 'es']) await scenario({ saved, cookie: saved });
  await scenario({ saved: 'de' });
  await scenario({ saved: 'de', cookie: 'es', expected: 'es' });
  await scenario({ saved: 'de', initial: 'en' });
  await scenario({ saved: 'invalid', expected: 'fr' });
  await scenario({ blocked: true, expected: 'fr' });
  console.log('PASS: real React SSR/hydration with delayed Header + LanguageSwitcher, FR/EN/DE/ES persistence, cookie priority, manual changes, cross-tab sync, blocked storage. No hydration errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
