/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node test runner; no real payment or database writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { randomUUID, createHash } = require('node:crypto');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { NextRequest } = require('next/server');

function loader(stubs = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const resolve = name => {
      if (name in stubs) return stubs[name];
      if (name === 'server-only') return {};
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
  const campaignId = randomUUID();
  const input = { campaignId, amount: 2500, currency: 'XOF', paymentMethod: 'CARD', donor: { email: 'test@example.com', phone: '+2290100000000' }, language: 'fr', idempotencyKey: randomUUID() };
  const donations = new Map(), transactions = new Map();
  let campaignStatus = 'PUBLISHED', verifiedStatus = 'PENDING', verifiedAmount = input.amount;
  let tail = Promise.resolve();
  const matches = (row, where) => Object.entries(where).every(([key, value]) => typeof value === 'object' && value !== null ? ('not' in value ? row[key] !== value.not : value.in.includes(row[key])) : row[key] === value);
  const updateMany = (rows, { where, data }) => {
    let count = 0;
    for (const row of rows.values()) if (matches(row, where)) { Object.assign(row, data); count++; }
    return { count };
  };
  const db = {
    campaign: { findUnique: async () => ({ id: campaignId, status: campaignStatus, publishedAt: new Date(), currency: 'XOF', startDate: null, endDate: null }) },
    donation: {
      create: async ({ data }) => { const row = { ...data, id: randomUUID(), confirmedAt: null }; donations.set(row.id, row); return row; },
      updateMany: async args => updateMany(donations, args),
    },
    paymentTransaction: {
      create: async ({ data }) => {
        if ([...transactions.values()].some(row => row.idempotencyKey === data.idempotencyKey)) throw Object.assign(new Error('Unique idempotency key'), { code: 'P2002' });
        const row = { ...data, id: randomUUID(), confirmedAt: null, providerTransactionId: null, providerReference: null };
        transactions.set(row.id, row); return row;
      },
      findUnique: async ({ where, include }) => {
        const row = [...transactions.values()].find(item => matches(item, where));
        return row ? { ...row, ...(include?.donation ? { donation: { ...donations.get(row.donationId) } } : {}) } : null;
      },
      updateMany: async args => updateMany(transactions, args),
    },
    $transaction: callback => {
      const result = tail.then(async () => {
        const oldD = structuredClone(donations), oldT = structuredClone(transactions);
        try { return await callback(db); } catch (error) {
          for (const key of donations.keys()) if (!oldD.has(key)) donations.delete(key);
          for (const key of transactions.keys()) if (!oldT.has(key)) transactions.delete(key);
          throw error;
        }
      });
      tail = result.catch(() => {}); return result;
    },
  };
  const adapter = {
    createPayment: async request => ({ provider: 'FEDAPAY', status: 'PENDING', providerTransactionId: '12345', nextAction: { type: 'REDIRECT', url: 'https://checkout.fedapay.com/test-only' }, request }),
    verifyPayment: async row => ({ provider: row.provider, status: verifiedStatus, amount: verifiedAmount, currency: row.currency, providerTransactionId: row.providerTransactionId }),
  };
  const stubs = { '@/lib/prisma': { prisma: db }, './fedapay': { fedaPayAdapter: adapter, validateFedaPayReturnUrl: () => {}, resumeFedaPayPayment: async () => ({ provider: 'FEDAPAY', status: 'PENDING', nextAction: { type: 'REDIRECT', url: 'https://checkout.fedapay.com/test-only' } }) }, './kkiapay': { kkiapayAdapter: adapter }, './methods': { getPaymentProviderCandidates: async () => [{ provider: 'FEDAPAY', priority: 1 }] } };
  const load = loader(stubs);
  const service = load('src/lib/payments/service.ts');
  for (const bad of [{ donor: { email: '', phone: input.donor.phone } }, { donor: { email: input.donor.email, phone: '' } }, { amount: 0 }, { amount: 1.5 }]) {
    assert.equal((await service.createPayment({ ...input, ...bad })).success, false);
  }
  campaignStatus = 'DRAFT';
  assert.equal((await service.createPayment(input)).success, false);
  campaignStatus = 'PUBLISHED';
  const checkoutPage = loader({
    '@/lib/prisma': { prisma: db },
    'next/server': { connection: async () => {} },
    'next/navigation': { redirect: destination => { throw new Error(`Unexpected redirect: ${destination}`); } },
    '@/components/public/donations/DonationCheckout': { __esModule: true, default: () => null },
  })('src/app/(public)/faire-un-don/page.tsx').default;
  const shell = checkoutPage({ searchParams: Promise.resolve({ campagne: campaignId, montant: '25000' }) });
  const checkout = await shell.props.children.type(shell.props.children.props);
  assert.equal(checkout.props.campaign.id, campaignId);
  assert.equal(checkout.props.defaultAmount, 25000);
  const results = await Promise.all([service.createPayment(input), service.createPayment(input)]);
  assert.equal(results.filter(result => result.success).length, 1);
  assert.equal(donations.size, 1); assert.equal(transactions.size, 1);
  const created = results.find(result => result.success);
  assert.match(created.accessToken, /^[a-f0-9]{64}$/);
  const transaction = transactions.get(created.transactionId);
  assert.equal(transaction.providerData.accessTokenHash, createHash('sha256').update(created.accessToken).digest('hex'));
  assert.equal(donations.get(created.donationId).donorName, null);
  assert.equal(donations.get(created.donationId).message, null);
  const resumed = await service.createPayment(input);
  assert.equal(resumed.success, true);
  assert.equal(resumed.donationId, created.donationId);
  assert.equal(resumed.transactionId, created.transactionId);
  assert.equal(donations.size, 1);
  created.accessToken = resumed.accessToken;

  const verification = load('src/lib/payments/verification.ts');
  for (const status of ['PENDING', 'PROCESSING', 'FAILED', 'CANCELLED', 'EXPIRED']) {
    verifiedStatus = status;
    const result = await verification.verifyPaymentById(created.transactionId);
    assert.equal(result.confirmed, false);
    assert.notEqual(donations.get(created.donationId).status, 'CONFIRMED');
  }
  verifiedStatus = 'CONFIRMED'; verifiedAmount = 9999;
  await assert.rejects(() => verification.verifyPaymentById(created.transactionId));
  assert.notEqual(donations.get(created.donationId).status, 'CONFIRMED');
  verifiedAmount = input.amount;
  const confirmed = await Promise.all([verification.verifyPaymentById(created.transactionId), verification.verifyPaymentById(created.transactionId)]);
  assert.equal(confirmed.filter(row => !row.alreadyProcessed).length, 1);
  assert.equal([...donations.values()].filter(row => row.status === 'CONFIRMED').reduce((sum, row) => sum + row.amount, 0), input.amount);

  let posted;
  const routeLoad = loader({ '@/lib/payments/service': { createPayment: async data => { posted = data; return created; } }, '@/lib/prisma': { prisma: db } });
  const route = routeLoad('src/app/api/payments/create/route.ts');
  const request = body => new NextRequest('https://example.org/api/payments/create', { method: 'POST', headers: { origin: 'https://example.org', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await route.POST(request({ ...input, donor: { email: input.donor.email } }))).status, 400);
  assert.equal((await route.POST(request({ ...input, donor: { phone: input.donor.phone } }))).status, 400);
  const validResponse = await route.POST(request({ ...input, donor: { ...input.donor, name: 'Ignored', country: 'BJ', isAnonymous: true }, message: 'Ignored' }));
  assert.equal(validResponse.status, 200, JSON.stringify(await validResponse.json()));
  assert.deepEqual(Object.keys(posted.donor).sort(), ['email', 'phone']); assert.equal(posted.message, undefined);
  const originCheck = loader()('src/lib/payments/request-origin.ts').getPaymentRequestOrigin;
  const proxied = headers => new NextRequest('http://internal:3000/api/payments/create', { headers: { origin: 'https://donations.example.org', ...headers } });
  assert.equal(originCheck(proxied({ host: 'donations.example.org' })), 'https://donations.example.org');
  const proxyHeaders = { host: 'internal:3000', 'x-forwarded-host': 'donations.example.org', 'x-forwarded-proto': 'https', 'sec-fetch-site': 'same-origin' };
  assert.equal(originCheck(proxied(proxyHeaders)), 'https://donations.example.org');
  assert.equal(originCheck(proxied({ ...proxyHeaders, 'sec-fetch-site': 'cross-site' })), null);
  assert.equal(originCheck(proxied({ ...proxyHeaders, 'sec-fetch-site': 'none' })), null);
  assert.equal(originCheck(proxied({ ...proxyHeaders, origin: 'https://attacker.example.org' })), null);
  const rejected = await route.POST(new NextRequest('https://example.org/api/payments/create', { method: 'POST', headers: { origin: 'https://attacker.example.org', 'content-type': 'application/json' }, body: '{}' }));
  assert.equal(rejected.status, 403);
  const proxyValidation = await route.POST(new NextRequest('http://internal:3000/api/payments/create', { method: 'POST', headers: { origin: 'https://donations.example.org', ...proxyHeaders, 'content-type': 'application/json' }, body: '{}' }));
  assert.equal(proxyValidation.status, 400); // Origin accepted; invalid body never reaches a provider.
  const statusRoute = routeLoad('src/app/api/payments/status/route.ts');
  const statusRequest = token => new NextRequest(`https://example.org/api/payments/status?transactionId=${created.transactionId}`, { headers: { 'x-payment-access-token': token } });
  assert.equal((await statusRoute.GET(statusRequest('0'.repeat(64)))).status, 403);
  assert.equal((await statusRoute.GET(statusRequest(created.accessToken))).status, 200);

  const form = loader({ './PaymentMethods': { __esModule: true, default: () => null }, './PaymentStatus': { __esModule: true, default: () => null } })('src/components/public/donations/PaymentForm.tsx').default;
  for (const language of ['fr', 'en', 'de', 'es']) {
    const html = renderToStaticMarkup(React.createElement(form, { campaignId, language }));
    assert.equal((html.match(/<input/g) || []).length, 3);
    for (const type of ['email', 'tel', 'number']) assert.match(html, new RegExp(`type="${type}"[^>]*required`));
    assert.doesNotMatch(html, /autoComplete="(?:name|country)"|type="checkbox"|<textarea|FedaPay|Kkiapay/);
    assert.match(html, /2500|2.500|2,500|2 500/);
  }
  // Only test-process placeholders: no env file or real provider calls.
  for (const key of ['FEDAPAY_SECRET_KEY', 'FEDAPAY_WEBHOOK_SECRET', 'KKIAPAY_PUBLIC_KEY', 'KKIAPAY_PRIVATE_KEY', 'KKIAPAY_SECRET_KEY', 'KKIAPAY_WEBHOOK_SECRET']) process.env[key] = 'isolated-test-placeholder';
  delete process.env.KKIAPAY_SANDBOX;
  const configs = [
    { provider: 'FEDAPAY', paymentMethod: 'CARD', priority: 20, isEnabled: true },
    { provider: 'KKIAPAY', paymentMethod: 'CARD', priority: 10, isEnabled: true },
    { provider: 'KKIAPAY', paymentMethod: 'WAVE', priority: 1, isEnabled: true },
    { provider: 'FEDAPAY', paymentMethod: 'MOBILE_MONEY', priority: 1, isEnabled: false },
  ];
  const methodLoad = loader({ '@/lib/prisma': { prisma: { paymentMethodConfig: { findMany: async () => configs } } } });
  const methodService = methodLoad('src/lib/payments/methods.ts');
  const methodsRoute = loader({ '@/lib/payments/methods': { getAvailablePaymentMethodsResponse: async () => ({ success: true, methods: [], currency: 'XOF' }) } })('src/app/api/payments/methods/route.ts');
  const unavailable = await methodsRoute.GET(new NextRequest('https://example.org/api/payments/methods'));
  assert.equal(unavailable.status, 200);
  assert.deepEqual((await unavailable.json()).methods, []);
  assert.deepEqual((await methodService.getAvailablePaymentMethods()).map(row => row.id), ['CARD']);
  assert.equal((await methodService.getPaymentProviderCandidates('CARD'))[0].provider, 'KKIAPAY');
  delete process.env.KKIAPAY_PRIVATE_KEY;
  assert.equal((await methodService.getPaymentProviderCandidates('CARD'))[0].provider, 'FEDAPAY');
  process.env.KKIAPAY_PRIVATE_KEY = 'isolated-test-placeholder';
  const record = { ...transaction, provider: 'KKIAPAY', providerTransactionId: 'external-test' };
  let remote = { transactionId: 'external-test', status: 'SUCCESS', amount: input.amount, currency: 'XOF', partnerId: record.id };
  const kk = loader({ 'kkiapay-nodejs-sdk': () => ({ verify: async () => remote }) })('src/lib/payments/kkiapay.ts');
  assert.equal((await kk.verifyKkiapayPayment(record)).status, 'CONFIRMED');
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  process.env.KKIAPAY_SANDBOX = 'true';
  let serverSandbox;
  const sandboxKk = loader({ 'kkiapay-nodejs-sdk': credentials => {
    serverSandbox = credentials.sandbox;
    return { verify: async () => remote };
  } })('src/lib/payments/kkiapay.ts');
  for (const paymentMethod of ['CARD', 'MOBILE_MONEY']) {
    const prepared = await sandboxKk.createKkiapayPayment({ ...input, paymentMethod, donationId: created.donationId, transactionId: record.id });
    assert.equal(prepared.nextAction.type, 'SDK');
    assert.equal(prepared.nextAction.payload.sandbox, true);
    assert.deepEqual(prepared.nextAction.payload.paymentmethod, [paymentMethod === 'CARD' ? 'card' : 'momo']);
    assert.equal(prepared.nextAction.payload.name, undefined);
    assert.equal(prepared.nextAction.payload.partnerId, record.id);
  }
  await sandboxKk.verifyKkiapayPayment(record);
  assert.equal(serverSandbox, true);
  process.env.NODE_ENV = 'production';
  await assert.rejects(() => sandboxKk.createKkiapayPayment(input), /SANDBOX_REQUIRES_TEST_DEPLOYMENT/);
  assert.equal(methodService.isProviderConfigured('KKIAPAY', 'CARD'), false);
  delete process.env.KKIAPAY_SANDBOX;
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
  for (const changed of [{ partnerId: randomUUID() }, { currency: 'EUR' }, { amount: 1 }, { transactionId: 'wrong' }]) {
    const original = remote; remote = { ...remote, ...changed };
    await assert.rejects(() => kk.verifyKkiapayPayment(record)); remote = original;
  }
  const realFetch = global.fetch;
  let providerBody;
  let currencyIso = 'XOF';
  global.fetch = async (url, options) => {
    if (options.body) providerBody = JSON.parse(options.body);
    return Response.json(String(url).includes('/currencies/') ? { 'v1/currency': { id: 1, iso: currencyIso } } : String(url).endsWith('/token') ? { url: 'https://checkout.fedapay.com/test-only' } : { 'v1/transaction': { id: 12345, amount: input.amount, status: 'pending', currency_id: 1 } });
  };
  try {
    const feda = loader()('src/lib/payments/fedapay.ts');
    await feda.createFedaPayPayment({ ...input, donationId: created.donationId, transactionId: created.transactionId, description: 'Isolated test', returnUrl: 'https://example.org/paiement/retour' });
    assert.equal(providerBody.customer?.firstname, undefined);
    assert.equal(providerBody.customer?.lastname, undefined);
    assert.equal(providerBody.customer?.email, input.donor.email);
    assert.equal(providerBody.custom_metadata.transactionId, created.transactionId);
    process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY = 'pk_live_isolated-test';
    delete process.env.FEDAPAY_PUBLIC_KEY;
    for (const language of ['fr', 'en', 'de', 'es']) {
      const integrated = await feda.createFedaPayPayment({ ...input, language, donationId: created.donationId, transactionId: created.transactionId, description: 'Isolated test' });
      assert.equal(integrated.nextAction.type, 'SDK');
      assert.deepEqual(integrated.nextAction.payload.transaction, { id: 12345 });
      assert.equal(integrated.nextAction.payload.locale, language);
      assert.doesNotMatch(JSON.stringify(integrated.nextAction), /isolated-test-placeholder|secret_key/);
    }
    const resumedWidget = await feda.resumeFedaPayPayment(transaction, 'es');
    assert.equal(resumedWidget.nextAction.type, 'SDK');
    assert.equal(resumedWidget.nextAction.payload.transaction.id, 12345);
    assert.equal(resumedWidget.nextAction.payload.locale, 'es');
    delete process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
    const previousMode = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    feda.validateFedaPayReturnUrl('http://localhost:3000/paiement/retour');
    feda.validateFedaPayReturnUrl('http://127.0.0.1:3000/paiement/retour');
    assert.throws(() => feda.validateFedaPayReturnUrl('http://example.org/paiement/retour'));
    process.env.NODE_ENV = 'production';
    assert.throws(() => feda.validateFedaPayReturnUrl('http://localhost:3000/paiement/retour'));
    feda.validateFedaPayReturnUrl('https://example.org/paiement/retour');
    if (previousMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousMode;
    assert.equal((await feda.verifyFedaPayPayment(transaction)).currency, 'XOF');
    currencyIso = 'EUR';
    await assert.rejects(() => feda.verifyFedaPayPayment(transaction));
  } finally { global.fetch = realFetch; }
  const { openFedaPayCheckout } = loader()('src/components/public/donations/fedapay-checkout.ts');
  let officialOptions, opens = 0, completions = 0;
  global.window = { FedaPay: { DIALOG_DISMISSED: 99, init: options => { officialOptions = options; return { open: () => { opens++; } }; } } };
  try {
    const dismissals = [];
    const widget = await openFedaPayCheckout({ public_key: 'pk_live_test', environment: 'live', locale: 'de', transaction: { id: 12345 }, amount: 9999, secret_key: 'must-not-be-forwarded' }, dismissed => { completions++; dismissals.push(dismissed); });
    assert.equal(opens, 1);
    assert.deepEqual(officialOptions.transaction, { id: 12345 });
    assert.equal(officialOptions.secret_key, undefined);
    assert.equal(officialOptions.amount, undefined);
    officialOptions.onComplete();
    assert.equal(completions, 1);
    officialOptions.onComplete({ reason: 99 });
    officialOptions.onComplete({ reason: 1 });
    assert.deepEqual(dismissals, [false, true, false]);
    widget.open(); assert.equal(opens, 2);
    await assert.rejects(() => openFedaPayCheckout({ public_key: 'sk_live_secret', environment: 'live', transaction: { id: 1 } }, () => {}));
    await assert.rejects(() => openFedaPayCheckout({ public_key: 'pk_live_test', environment: 'sandbox', transaction: { id: 1 } }, () => {}));
  } finally { delete global.window; }
  const brand = loader()('src/components/public/donations/PaymentBrand.tsx').default;
  const cardArtwork = renderToStaticMarkup(React.createElement(brand, { method: 'CARD' }));
  assert.match(cardArtwork, /visa\.svg/); assert.match(cardArtwork, /mastercard\.svg/);
  const mobileArtwork = renderToStaticMarkup(React.createElement(brand, { method: 'MOBILE_MONEY' }));
  assert.match(mobileArtwork, /mtn\.svg/); assert.match(mobileArtwork, /moov\.svg/);
  let pathname = '/faire-un-don';
  const footer = loader({ 'next/navigation': { usePathname: () => pathname }, '@/lib/i18n/LanguageProvider': { useTranslation: () => ({ t: key => key }) } })('src/components/public/layout/PublicFooter.tsx').default;
  assert.equal(renderToStaticMarkup(React.createElement(footer)), '');
  pathname = '/contact';
  assert.match(renderToStaticMarkup(React.createElement(footer)), /<footer/);
  for (const provider of ['fedapay', 'kkiapay']) {
    const webhook = loader({ '@/lib/prisma': { prisma: db } })(`src/app/api/payments/webhooks/${provider}/route.ts`);
    const response = await webhook.POST(new NextRequest(`https://example.org/api/payments/webhooks/${provider}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }));
    assert.ok([400, 401].includes(response.status));
    const invalid = await webhook.POST(new NextRequest(`https://example.org/api/payments/webhooks/${provider}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-fedapay-signature': 'invalid', 'x-kkiapay-secret': 'invalid' }, body: '{}' }));
    assert.ok([400, 401].includes(invalid.status));
  }
  console.log('PASS: required contacts, amount/campaign validation, concurrent idempotency, token authorization, unconfirmed exclusion, single confirmation, four-language form.');
  console.log('Isolated test doubles only: no provider payment or production database mutation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
