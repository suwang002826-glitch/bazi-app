const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  validateLunarPromotionReadinessRepository
} = require('./validate-lunar-promotion-readiness');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected promotion readiness error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const result = validateLunarPromotionReadinessRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.checklistId, 'lunar-promotion-checklist-2023-hko-draft');
assert.strictEqual(result.summary.ledgerId, 'lunar-human-review-ledger-2023-hko-draft');
assert.strictEqual(result.summary.sampleReviewCount, 9);
assert.strictEqual(result.summary.promotionReady, false);
assert(
  result.summary.blockers.includes('human-review-pending'),
  'pending human review must block runtime promotion'
);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-promotion-readiness-test-'));
const reviewDir = path.join(tempRoot, 'code', 'data-packs', 'lunar', 'reviews');
const matrix = {
  matrixId: 'fixture-matrix',
  status: 'pending-review',
  sourceDraftDataPackId: 'fixture-draft',
  sourceRecordsChecksum: {
    algorithm: 'sha256',
    value: 'a'.repeat(64)
  },
  runtimeApproval: false,
  coverage: {
    gregorianYears: [2023],
    lunarYears: [2023],
    completeGregorianCalendar: true,
    completeLunarCalendar: false
  },
  requiredCategories: ['lunar-year-start', 'leap-month-start'],
  samples: [
    {
      caseId: 'FIXTURE-001',
      category: 'lunar-year-start',
      title: 'fixture sample 1',
      solarDate: '2023-01-22',
      lunarYear: 2023,
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: false,
      reviewFocus: 'fixture'
    },
    {
      caseId: 'FIXTURE-002',
      category: 'leap-month-start',
      title: 'fixture sample 2',
      solarDate: '2023-03-22',
      lunarYear: 2023,
      lunarMonth: 2,
      lunarDay: 1,
      isLeapMonth: true,
      reviewFocus: 'fixture'
    }
  ]
};
writeJson(path.join(reviewDir, 'lunar-review-matrix-2023-hko-draft.json'), matrix);
writeJson(path.join(reviewDir, 'lunar-promotion-checklist-2023-hko-draft.json'), {
  checklistId: 'fixture-checklist',
  status: 'pending-review',
  sourceMatrixId: 'fixture-matrix',
  sourceDraftDataPackId: 'fixture-draft',
  runtimeApproval: false,
  requiredGates: [
    'source-draft-data-pack',
    'review-matrix',
    'human-review-ledger',
    'approved-for-runtime'
  ],
  gates: {
    sourceDraftDataPack: 'present',
    reviewMatrix: 'present',
    humanReviewLedger: 'pending',
    approvedForRuntime: 'blocked'
  }
});
writeJson(path.join(reviewDir, 'lunar-human-review-ledger-2023-hko-draft.json'), {
  ledgerId: 'fixture-ledger',
  status: 'pending-human-review',
  sourceMatrixId: 'fixture-matrix',
  sourceDraftDataPackId: 'fixture-draft',
  runtimeApproval: false,
  sampleReviews: [
    {
      caseId: 'FIXTURE-001',
      reviewStatus: '',
      reviewer: 'unassigned',
      reviewedAt: 'pending',
      conclusion: 'pending',
      evidenceNote: 'waiting for manual review'
    }
  ]
});

const invalidResult = validateLunarPromotionReadinessRepository({ rootDir: tempRoot });
assertHasError(invalidResult.errors, 'FIXTURE-001: reviewStatus is required');
assertHasError(invalidResult.errors, 'FIXTURE-002: missing human review ledger entry');

console.log('PASS lunar promotion readiness validation');
