/* eslint-disable @typescript-eslint/no-require-imports -- Isolated hot-reload regression test. */
const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const source = ts.transpileModule(fs.readFileSync('src/lib/prisma.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
let constructed = 0;
const Prisma = { prismaVersion: { client: '7.10.1' }, dmmf: { datamodel: { models: [{ name: 'Campaign', fields: ['id'] }] } } };
const context = vm.createContext({
  process: { env: { NODE_ENV: 'development', DATABASE_URL: 'isolated-test-only' } },
  require: name => {
    if (name === 'server-only') return {};
    if (name === '@prisma/adapter-pg') return { PrismaPg: class {} };
    if (name === '@prisma/client') return { Prisma, PrismaClient: class { constructor() { this.id = ++constructed; } } };
    throw new Error(`Unexpected import: ${name}`);
  },
});
function load() {
  context.exports = {};
  vm.runInContext(`(function(require,exports){${source}\n})(require,exports)`, context);
  return context.exports.prisma;
}
// Reproduce a server that already holds an unversioned pre-migration singleton.
context.prisma = { id: 'obsolete' };
const current = load();
assert.notEqual(current.id, 'obsolete');
assert.equal(load(), current);
Prisma.dmmf.datamodel.models[0].fields.push('initialCollectedAmount', 'initialDonorCount');
const regenerated = load();
assert.notEqual(regenerated, current);
assert.equal(load(), regenerated);
assert.equal(constructed, 2);
console.log('PASS: stale client replaced after schema regeneration; unchanged schema reuses one client. No database access.');
