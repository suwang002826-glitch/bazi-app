const fs = require('fs');
const path = require('path');

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid JSON (${error.message})`);
    return null;
  }
}

function validateBlockers(review, checklist, errors) {
  const blockers = Array.isArray(review.remainingBlockers) ? review.remainingBlockers : [];
  [
    'runtime-approval-not-granted',
    'approved-for-runtime-blocked'
  ].forEach((blocker) => {
    if (!blockers.includes(blocker)) {
      errors.push(`${review.reviewId}: remainingBlockers must include ${blocker}`);
    }
  });

  if (checklist && checklist.runtimeApproval !== false) {
    errors.push(`${review.reviewId}: source checklist runtimeApproval must still be false`);
  }
  if (checklist && checklist.gates && checklist.gates.approvedForRuntime !== 'blocked') {
    errors.push(`${review.reviewId}: source checklist approvedForRuntime must still be blocked`);
  }
}

function validateLimitedRuntimeReview(review, checklist, errors) {
  if (!review) return;

  if (review.status !== 'proposal') {
    errors.push(`${review.reviewId}: status must be proposal`);
  }
  if (review.approvalDecision !== 'not-approved') {
    errors.push(`${review.reviewId}: approvalDecision must be not-approved`);
  }
  if (review.proposedRuntimeScope !== 'gregorian-year-2023-limited') {
    errors.push(`${review.reviewId}: proposedRuntimeScope must be gregorian-year-2023-limited`);
  }
  if (review.completeLunarCalendar !== false) {
    errors.push(`${review.reviewId}: completeLunarCalendar must be false`);
  }
  if (review.requiresUiScopeWarning !== true) {
    errors.push(`${review.reviewId}: requiresUiScopeWarning must be true for limited runtime`);
  }
  if (review.requiresStructuredOutOfCoverageError !== true) {
    errors.push(`${review.reviewId}: requiresStructuredOutOfCoverageError must be true`);
  }
  if (review.requiresRuntimeManifestRegistrationReview !== true) {
    errors.push(`${review.reviewId}: requiresRuntimeManifestRegistrationReview must be true`);
  }
  if (!/^lunar-data-pack@2026\.07\.01-hko-2023-limited\.\d+$/.test(String(review.proposedVersion || ''))) {
    errors.push(`${review.reviewId}: proposedVersion must use hko-2023-limited version`);
  }
  if (checklist && review.sourceChecklistId !== checklist.checklistId) {
    errors.push(`${review.reviewId}: sourceChecklistId must match promotion checklist`);
  }
  if (checklist && review.sourceDraftDataPackId !== checklist.sourceDraftDataPackId) {
    errors.push(`${review.reviewId}: sourceDraftDataPackId must match promotion checklist`);
  }

  validateBlockers(review, checklist, errors);
}

function validateLunarRuntimeApprovalReviewRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const reviewDir = path.join(rootDir, 'code', 'data-packs', 'lunar', 'reviews');
  const errors = [];
  const checklist = readJson(path.join(reviewDir, 'lunar-promotion-checklist-2023-hko-draft.json'), errors);
  const review = readJson(path.join(reviewDir, 'lunar-runtime-approval-review-2023-hko-limited.json'), errors);

  validateLimitedRuntimeReview(review, checklist, errors);

  return {
    errors,
    summary: {
      reviewId: review ? review.reviewId || '' : '',
      approvalDecision: review ? review.approvalDecision || '' : '',
      proposedRuntimeScope: review ? review.proposedRuntimeScope || '' : '',
      completeLunarCalendar: review ? review.completeLunarCalendar : undefined,
      requiresUiScopeWarning: review ? review.requiresUiScopeWarning : undefined,
      remainingBlockers: review && Array.isArray(review.remainingBlockers)
        ? review.remainingBlockers
        : []
    }
  };
}

function run() {
  const result = validateLunarRuntimeApprovalReviewRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar runtime approval review ${result.summary.reviewId}`);
  console.log(`  decision: ${result.summary.approvalDecision}`);
  console.log(`  scope: ${result.summary.proposedRuntimeScope}`);
  console.log(`  blockers: ${result.summary.remainingBlockers.join(', ') || 'none'}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarRuntimeApprovalReviewRepository
};
