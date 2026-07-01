const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  validateLunarLimitedRuntimeCandidateRepository
} = require('./validate-lunar-limited-runtime-candidate');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected limited runtime candidate error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const result = validateLunarLimitedRuntimeCandidateRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.candidatePackCount, 1);
assert.strictEqual(result.summary.recordCount, 365);
assert.strictEqual(result.summary.firstSolarDate, '2023-01-01');
assert.strictEqual(result.summary.lastSolarDate, '2023-12-31');
assert.strictEqual(result.summary.runtimeEnabled, false);
assert.strictEqual(result.summary.manifestRegistered, false);
assert.strictEqual(result.summary.completeLunarCalendar, false);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-limited-runtime-candidate-test-'));
const lunarDir = path.join(tempRoot, 'code', 'data-packs', 'lunar');

writeJson(path.join(lunarDir, 'manifest.json'), {
  packs: [
    {
      dataPackId: 'fixture-candidate'
    }
  ]
});
writeJson(path.join(lunarDir, 'reviews', 'lunar-limited-runtime-scope-2023-hko.json'), {
  scopeId: 'lunar-limited-runtime-scope-2023-hko',
  status: 'design-only',
  runtimeEnabled: false,
  completeLunarCalendar: false,
  coverage: {
    mode: 'gregorian-year',
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  }
});
writeJson(path.join(lunarDir, 'drafts', 'lunar-conversions-2023-full-draft.json'), {
  dataPackId: 'lunar-conversions-2023-full-draft',
  recordsChecksum: {
    algorithm: 'sha256',
    value: 'fixture-records-checksum'
  }
});
writeJson(path.join(lunarDir, 'candidates', 'fixture-candidate.json'), {
  dataPackId: 'fixture-candidate',
  calendarDataVersion: 'lunar-data-pack@2026.07.01-hko-2023-limited.candidate.1',
  status: 'candidate',
  scopeId: 'lunar-limited-runtime-scope-2023-hko',
  sourceDraftDataPackId: 'lunar-conversions-2023-full-draft',
  runtimeEnabled: true,
  manifestRegistered: true,
  completeLunarCalendar: false,
  coverage: {
    mode: 'gregorian-year',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    completeGregorianCalendar: true,
    completeLunarCalendar: false
  },
  recordsChecksum: {
    algorithm: 'sha256',
    value: 'fixture-records-checksum'
  },
  sourceDraftRecordsChecksum: {
    algorithm: 'sha256',
    value: 'fixture-records-checksum'
  },
  records: []
});
writeJson(path.join(lunarDir, 'candidates', 'fixture-candidate.js'), {
  dataPackId: 'fixture-candidate'
});

const invalidResult = validateLunarLimitedRuntimeCandidateRepository({ rootDir: tempRoot });
assertHasError(invalidResult.errors, 'fixture-candidate: candidate pack must not be registered in runtime manifest');
assertHasError(invalidResult.errors, 'fixture-candidate: runtimeEnabled must be false');

console.log('PASS lunar limited runtime candidate validation');
