const assert = require('assert');
const solarTermManifest = require('../code/data-packs/solar-terms/manifest.json');
const hkoCandidatePack = require('../code/data-packs/solar-terms/candidates/hko-solar-terms-2024-2026-candidate.json');
const {
  findSolarTermRecord,
  getSolarTermDataPackCoverage,
  loadSolarTermDataPacks
} = require('../code/utils/bazi/solarTermDataPack');

const runtimePacks = loadSolarTermDataPacks();
assert.strictEqual(runtimePacks.length, 1);
assert.strictEqual(runtimePacks[0].id, 'hko-solar-terms-2024-2026-candidate');

const runtimeCoverage = getSolarTermDataPackCoverage();
assert.strictEqual(runtimeCoverage.runtimeEnabled, true);
assert.deepStrictEqual(runtimeCoverage.packIds, ['hko-solar-terms-2024-2026-candidate']);
assert.deepStrictEqual(runtimeCoverage.years, [2024, 2025, 2026]);

const defaultLichun2026 = findSolarTermRecord({ year: 2026, termKey: 'lichun' });
assert.ok(defaultLichun2026, 'approved HKO solar-term pack must be visible to runtime lookup');
assert.strictEqual(defaultLichun2026.local, '2026-02-04 04:02');

const blockedManifest = {
  ...solarTermManifest,
  status: 'hko-candidate-preview-not-runtime-approved',
  runtimeEnabled: false,
  runtimeEnabledPackIds: [],
  packs: [
    {
      ...solarTermManifest.packs[0],
      status: 'candidate-preview-not-runtime-approved',
      runtimeEnabled: false
    }
  ]
};

const blockedPackModules = {
  'candidates/hko-solar-terms-2024-2026-candidate.json': {
    ...hkoCandidatePack,
    status: 'candidate-preview-not-runtime-approved',
    runtimeApproval: {
      status: 'blocked',
      scope: 'test fixture only'
    }
  }
};

assert.deepStrictEqual(loadSolarTermDataPacks(blockedManifest, {
  packModules: blockedPackModules
}), []);

assert.strictEqual(
  findSolarTermRecord(
    { year: 2026, termKey: 'lichun' },
    blockedManifest,
    { packModules: blockedPackModules }
  ),
  null,
  'blocked HKO solar-term pack must not be visible to runtime lookup'
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
assert.strictEqual(lichun2026.term.zh, '\u7acb\u6625');
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
