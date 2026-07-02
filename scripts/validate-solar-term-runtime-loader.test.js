const assert = require('assert');
const solarTermManifest = require('../code/data-packs/solar-terms/manifest.json');
const hkoCandidatePack = require('../code/data-packs/solar-terms/candidates/hko-solar-terms-2024-2026-candidate.json');
const {
  findSolarTermRecord,
  getSolarTermDataPackCoverage,
  loadSolarTermDataPacks
} = require('../code/utils/bazi/solarTermDataPack');

assert.deepStrictEqual(loadSolarTermDataPacks(), []);

const blockedCoverage = getSolarTermDataPackCoverage();
assert.strictEqual(blockedCoverage.runtimeEnabled, false);
assert.deepStrictEqual(blockedCoverage.packIds, []);
assert.deepStrictEqual(blockedCoverage.years, []);

assert.strictEqual(
  findSolarTermRecord({ year: 2026, termKey: 'lichun' }),
  null,
  'candidate HKO solar-term pack must not be visible to runtime lookup'
);

assert.throws(
  () => loadSolarTermDataPacks({
    ...solarTermManifest,
    runtimeEnabled: true,
    runtimeEnabledPackIds: ['missing-approved-pack'],
    packs: [
      {
        id: 'missing-approved-pack',
        path: 'candidates/missing-approved-pack.json',
        status: 'approved-for-runtime',
        runtimeEnabled: true,
        coveredYears: [2026],
        termCount: 24
      }
    ]
  }),
  (error) => error.code === 'SOLAR_TERM_DATA_PACK_NOT_REGISTERED'
);

const approvedManifest = {
  ...solarTermManifest,
  status: 'hko-runtime-preview',
  runtimeEnabled: true,
  runtimeEnabledPackIds: ['hko-solar-terms-2024-2026-candidate'],
  packs: [
    {
      ...solarTermManifest.packs[0],
      status: 'approved-for-runtime',
      runtimeEnabled: true
    }
  ]
};

const approvedPackModules = {
  'candidates/hko-solar-terms-2024-2026-candidate.json': {
    ...hkoCandidatePack,
    status: 'approved-for-runtime',
    runtimeApproval: {
      status: 'approved-for-runtime',
      approvedAt: '2026-07-03',
      scope: 'test fixture only'
    }
  }
};

const approvedPacks = loadSolarTermDataPacks(approvedManifest, {
  packModules: approvedPackModules
});
assert.strictEqual(approvedPacks.length, 1);
assert.strictEqual(approvedPacks[0].id, 'hko-solar-terms-2024-2026-candidate');

const lichun2026 = findSolarTermRecord(
  { year: 2026, termKey: 'lichun' },
  approvedManifest,
  { packModules: approvedPackModules }
);
assert.ok(lichun2026, 'approved HKO pack should expose 2026 lichun');
assert.strictEqual(lichun2026.local, '2026-02-04 04:02');
assert.strictEqual(lichun2026.term.zh, '立春');
assert.strictEqual(lichun2026.provider, 'Hong Kong Observatory');
assert.strictEqual(lichun2026.precision, 'minute');
assert.strictEqual(lichun2026.date.getFullYear(), 2026);
assert.strictEqual(lichun2026.date.getMonth(), 1);
assert.strictEqual(lichun2026.date.getDate(), 4);
assert.strictEqual(lichun2026.date.getHours(), 4);
assert.strictEqual(lichun2026.date.getMinutes(), 2);

const approvedCoverage = getSolarTermDataPackCoverage(approvedManifest, {
  packModules: approvedPackModules
});
assert.strictEqual(approvedCoverage.runtimeEnabled, true);
assert.deepStrictEqual(approvedCoverage.packIds, ['hko-solar-terms-2024-2026-candidate']);
assert.deepStrictEqual(approvedCoverage.years, [2024, 2025, 2026]);
assert.strictEqual(approvedCoverage.primaryAuthority, 'Hong Kong Observatory');

console.log('PASS solar-term runtime loader gate');
