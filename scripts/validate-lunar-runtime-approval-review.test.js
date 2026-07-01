const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  validateLunarRuntimeApprovalReviewRepository
} = require('./validate-lunar-runtime-approval-review');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected runtime approval review error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const result = validateLunarRuntimeApprovalReviewRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.reviewId, 'lunar-runtime-approval-review-2023-hko-limited');
assert.strictEqual(result.summary.approvalDecision, 'not-approved');
assert.strictEqual(result.summary.proposedRuntimeScope, 'gregorian-year-2023-limited');
assert.strictEqual(result.summary.completeLunarCalendar, false);
assert.strictEqual(result.summary.requiresUiScopeWarning, true);
assert.strictEqual(result.summary.remainingBlockers.length, 2);
assert(result.summary.remainingBlockers.includes('runtime-approval-not-granted'));
assert(result.summary.remainingBlockers.includes('approved-for-runtime-blocked'));

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-runtime-approval-review-test-'));
const reviewDir = path.join(tempRoot, 'code', 'data-packs', 'lunar', 'reviews');
writeJson(path.join(reviewDir, 'lunar-promotion-checklist-2023-hko-draft.json'), {
  checklistId: 'fixture-checklist',
  status: 'pending-review',
  sourceDraftDataPackId: 'fixture-draft',
  runtimeApproval: false,
  gates: {
    humanReviewLedger: 'passed',
    approvedForRuntime: 'blocked'
  }
});
writeJson(path.join(reviewDir, 'lunar-runtime-approval-review-2023-hko-limited.json'), {
  reviewId: 'fixture-runtime-review',
  status: 'proposal',
  sourceChecklistId: 'fixture-checklist',
  sourceDraftDataPackId: 'fixture-draft',
  approvalDecision: 'not-approved',
  proposedRuntimeScope: 'gregorian-year-2023-limited',
  completeLunarCalendar: false,
  requiresUiScopeWarning: false,
  requiresStructuredOutOfCoverageError: true,
  proposedVersion: 'lunar-data-pack@2026.07.01-hko-2023-limited.1',
  remainingBlockers: [
    'runtime-approval-not-granted',
    'approved-for-runtime-blocked'
  ],
  notes: ['fixture']
});

const invalidResult = validateLunarRuntimeApprovalReviewRepository({ rootDir: tempRoot });
assertHasError(invalidResult.errors, 'fixture-runtime-review: requiresUiScopeWarning must be true for limited runtime');

console.log('PASS lunar runtime approval review validation');
