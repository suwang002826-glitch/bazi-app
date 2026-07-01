const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  validateLunarReviewMatrixRepository
} = require('./validate-lunar-review-matrix');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected review matrix error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const result = validateLunarReviewMatrixRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.matrixId, 'lunar-review-matrix-2023-hko-draft');
assert.strictEqual(result.summary.sourceDraftDataPackId, 'lunar-conversions-2023-full-draft');
assert.strictEqual(result.summary.sampleCount, 9);
assert.deepStrictEqual(result.summary.missingCategories, []);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-review-matrix-test-'));
const draftDir = path.join(tempRoot, 'code', 'data-packs', 'lunar', 'drafts');
const reviewDir = path.join(tempRoot, 'code', 'data-packs', 'lunar', 'reviews');
const draftPack = {
  dataPackId: 'fixture-draft',
  recordsChecksum: {
    algorithm: 'sha256',
    value: 'a'.repeat(64)
  },
  coverage: {
    gregorianYears: [2023],
    lunarYears: [2023],
    completeGregorianCalendar: true,
    completeLunarCalendar: false
  },
  records: [
    {
      caseId: 'FIXTURE-001',
      lunarYear: 2023,
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: false,
      solarDate: '2023-01-22',
      sourceNote: 'fixture row'
    }
  ]
};

writeJson(path.join(draftDir, 'fixture-draft.json'), draftPack);
writeJson(path.join(reviewDir, 'lunar-review-matrix-2023-hko-draft.json'), {
  matrixId: 'fixture-review-matrix',
  status: 'pending-review',
  sourceDraftDataPackId: 'fixture-draft',
  sourceRecordsChecksum: draftPack.recordsChecksum,
  runtimeApproval: false,
  coverage: draftPack.coverage,
  requiredCategories: ['lunar-year-start', 'leap-month-start'],
  samples: [
    {
      caseId: 'FIXTURE-001',
      category: 'lunar-year-start',
      title: 'fixture lunar new year',
      solarDate: '2023-01-22',
      lunarYear: 2023,
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: false,
      reviewFocus: 'must match draft data-pack exactly'
    }
  ]
});

const invalidResult = validateLunarReviewMatrixRepository({ rootDir: tempRoot });
assertHasError(invalidResult.errors, 'missing required category leap-month-start');

console.log('PASS lunar review matrix validation');
