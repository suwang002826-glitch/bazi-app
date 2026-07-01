const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  validateLunarLimitedRuntimeScopeRepository
} = require('./validate-lunar-limited-runtime-scope');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected limited runtime scope error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const result = validateLunarLimitedRuntimeScopeRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.scopeId, 'lunar-limited-runtime-scope-2023-hko');
assert.strictEqual(result.summary.status, 'design-only');
assert.strictEqual(result.summary.runtimeEnabled, false);
assert.strictEqual(result.summary.completeLunarCalendar, false);
assert.strictEqual(result.summary.coverageStart, '2023-01-01');
assert.strictEqual(result.summary.coverageEnd, '2023-12-31');
assert.strictEqual(result.summary.outOfCoverageErrorCode, 'LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE');
assert.strictEqual(result.summary.requiresSeparateManifestApproval, true);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-limited-runtime-scope-test-'));
const reviewDir = path.join(tempRoot, 'code', 'data-packs', 'lunar', 'reviews');

writeJson(path.join(reviewDir, 'lunar-runtime-approval-review-2023-hko-limited.json'), {
  reviewId: 'fixture-runtime-review',
  status: 'proposal',
  approvalDecision: 'not-approved',
  proposedRuntimeScope: 'gregorian-year-2023-limited',
  completeLunarCalendar: false,
  requiresUiScopeWarning: true,
  requiresStructuredOutOfCoverageError: true,
  requiresRuntimeManifestRegistrationReview: true,
  proposedVersion: 'lunar-data-pack@2026.07.01-hko-2023-limited.1',
  remainingBlockers: [
    'runtime-approval-not-granted',
    'approved-for-runtime-blocked'
  ]
});

writeJson(path.join(reviewDir, 'lunar-limited-runtime-scope-2023-hko.json'), {
  scopeId: 'fixture-limited-scope',
  status: 'design-only',
  sourceRuntimeApprovalReviewId: 'fixture-runtime-review',
  runtimeEnabled: true,
  completeLunarCalendar: false,
  coverage: {
    mode: 'gregorian-year',
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  },
  userWarning: {
    required: true,
    copy: '当前为 2023 年 HKO 数据预览，非完整农历能力。'
  },
  outOfCoverageError: {
    code: 'LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE',
    requiredFields: [
      'inputDate',
      'supportedStartDate',
      'supportedEndDate',
      'completeLunarCalendar',
      'calendarDataVersion'
    ]
  },
  manifestRegistration: {
    allowedInThisPr: false,
    requiresSeparateManifestApproval: true
  },
  forbiddenClaims: [
    'Complete lunar calendar support',
    'Full historical lunar conversion support'
  ]
});

const invalidResult = validateLunarLimitedRuntimeScopeRepository({ rootDir: tempRoot });
assertHasError(invalidResult.errors, 'fixture-limited-scope: runtimeEnabled must remain false');

console.log('PASS lunar limited runtime scope validation');
