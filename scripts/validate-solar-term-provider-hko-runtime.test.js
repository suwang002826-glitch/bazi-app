const assert = require('assert');
const {
  findSolarTermTime,
  getSolarTermProviderInfo,
  jieTerms
} = require('../code/utils/bazi/solarTermProvider');

function formatLocalMinute(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const lichun = jieTerms.find((term) => term.index === 0);
assert.ok(lichun, 'lichun jie term must exist');

const lichun2026 = findSolarTermTime(2026, lichun);
assert.strictEqual(
  formatLocalMinute(lichun2026),
  '2026-02-04 04:02',
  '2026 lichun must come from HKO approved runtime data'
);

const providerInfo = getSolarTermProviderInfo();
assert.strictEqual(providerInfo.provider, 'hko-solar-term-data-pack-with-local-fallback');
assert.strictEqual(providerInfo.status, 'hko-runtime-preview-with-local-fallback');
assert.strictEqual(providerInfo.authority, 'Hong Kong Observatory');
assert.deepStrictEqual(providerInfo.runtimeCoverage.years, [2024, 2025, 2026]);
assert.strictEqual(providerInfo.fallbackProvider, 'local-solar-longitude-search');

const lichun2028 = findSolarTermTime(2028, lichun);
assert.match(
  formatLocalMinute(lichun2028),
  /^2028-02-\d{2} \d{2}:\d{2}$/,
  'out-of-scope years must still use local fallback instead of failing'
);

console.log('PASS solar-term provider HKO runtime integration');
