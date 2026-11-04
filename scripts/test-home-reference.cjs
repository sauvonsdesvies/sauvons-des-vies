/* eslint-disable @typescript-eslint/no-require-imports -- Isolated rendering and public totals; no database writes. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loader(stubs) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const resolve = name => {
      if (name in stubs) return stubs[name];
      if (name === 'server-only') return {};
      if (name.endsWith('.module.css')) return { __esModule: true, default: { page: 'reference-home', mobileDonate: 'mobile-donate' } };
      if (name.startsWith('@/') || name.startsWith('./')) {
        const base = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
        return load(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx');
      }
      return require(name);
    };
    new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
    return mod.exports;
  }
  return load;
}

async function main() {
  const data = { statistics: { activeCampaigns: 2, beneficiariesHelped: 3, verifiedFiles: 4 }, urgentCampaigns: [], campaigns: [], causes: [], news: [] };
  for (const language of ['fr', 'en', 'de', 'es']) {
    const stubs = {
      '@/hooks/useHomeUpdates': { useHomeUpdates: () => ({ homeData: data, statistics: data.statistics }) },
      '@/lib/i18n/LanguageProvider': { useTranslation: () => ({ language }) },
      'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    };
    for (const name of ['HomeHero', 'HomeStats', 'UrgentCampaigns', 'HowItWorks', 'HomeNews', 'HomeDonationBanner', 'HomeCauses']) stubs['./' + name] = { __esModule: true, default: () => React.createElement('section', { 'data-section': name }) };
    const Page = loader(stubs)('src/components/public/home/HomePage.tsx').default;
    const html = renderToStaticMarkup(React.createElement(Page, { initialData: data }));
    assert.match(html, /data-section="HomeCauses"/);
    assert.match(html, /data-section="HomeNews"/);
    assert.doesNotMatch(html, /HomeTrust/);
    assert.match(html, /href="\/campagnes"/);
  }
  console.log('PASS: reference home sections and donation link in four languages.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
