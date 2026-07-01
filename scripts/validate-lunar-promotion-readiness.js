const fs = require('fs');
const path = require('path');

const ALLOWED_REVIEW_STATUSES = new Set([
  'pending-human-review',
  'passed',
  'failed',
  'needs-follow-up'
]);

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid JSON (${error.message})`);
    return null;
  }
}

function readReviewFiles(rootDir, errors) {
  const reviewDir = path.join(rootDir, 'code', 'data-packs', 'lunar', 'reviews');
  return {
    matrix: readJson(path.join(reviewDir, 'lunar-review-matrix-2023-hko-draft.json'), errors),
    checklist: readJson(path.join(reviewDir, 'lunar-promotion-checklist-2023-hko-draft.json'), errors),
    ledger: readJson(path.join(reviewDir, 'lunar-human-review-ledger-2023-hko-draft.json'), errors)
  };
}

function addBlocker(blockers, blocker) {
  if (!blockers.includes(blocker)) blockers.push(blocker);
}

function validateChecklist(checklist, matrix, blockers, errors) {
  if (!checklist || !matrix) return;

  if (checklist.status !== 'pending-review' && checklist.status !== 'approved-for-runtime') {
    errors.push(`${checklist.checklistId}: status must be pending-review or approved-for-runtime`);
  }
  if (checklist.sourceMatrixId !== matrix.matrixId) {
    errors.push(`${checklist.checklistId}: sourceMatrixId must match review matrix`);
  }
  if (checklist.sourceDraftDataPackId !== matrix.sourceDraftDataPackId) {
    errors.push(`${checklist.checklistId}: sourceDraftDataPackId must match review matrix`);
  }
  if (!Array.isArray(checklist.requiredGates) || checklist.requiredGates.length === 0) {
    errors.push(`${checklist.checklistId}: requiredGates must be a non-empty array`);
  }
  if (!checklist.gates || typeof checklist.gates !== 'object') {
    errors.push(`${checklist.checklistId}: gates must be an object`);
  } else {
    [
      'sourceDraftDataPack',
      'reviewMatrix',
      'humanReviewLedger',
      'approvedForRuntime'
    ].forEach((gate) => {
      if (!checklist.gates[gate]) errors.push(`${checklist.checklistId}: gates.${gate} is required`);
    });
  }

  if (checklist.runtimeApproval !== true) {
    addBlocker(blockers, 'runtime-approval-not-granted');
  }
  if (!checklist.gates || checklist.gates.approvedForRuntime !== 'passed') {
    addBlocker(blockers, 'approved-for-runtime-blocked');
  }
}

function validateLedger(ledger, matrix, blockers, errors) {
  if (!ledger || !matrix) return 0;

  if (ledger.status !== 'pending-human-review' && ledger.status !== 'human-review-complete') {
    errors.push(`${ledger.ledgerId}: status must be pending-human-review or human-review-complete`);
  }
  if (ledger.sourceMatrixId !== matrix.matrixId) {
    errors.push(`${ledger.ledgerId}: sourceMatrixId must match review matrix`);
  }
  if (ledger.sourceDraftDataPackId !== matrix.sourceDraftDataPackId) {
    errors.push(`${ledger.ledgerId}: sourceDraftDataPackId must match review matrix`);
  }
  if (ledger.runtimeApproval !== false) {
    errors.push(`${ledger.ledgerId}: runtimeApproval must stay false`);
  }

  const reviews = Array.isArray(ledger.sampleReviews) ? ledger.sampleReviews : [];
  let passedReviewCount = 0;
  if (!Array.isArray(ledger.sampleReviews)) {
    errors.push(`${ledger.ledgerId}: sampleReviews must be an array`);
  }

  const reviewsByCaseId = new Map();
  reviews.forEach((review) => {
    if (review.caseId && reviewsByCaseId.has(review.caseId)) {
      errors.push(`${review.caseId}: duplicate human review ledger entry`);
    }
    if (review.caseId) reviewsByCaseId.set(review.caseId, review);
  });

  const matrixSamples = Array.isArray(matrix.samples) ? matrix.samples : [];
  matrixSamples.forEach((sample) => {
    const review = reviewsByCaseId.get(sample.caseId);
    if (!review) {
      errors.push(`${sample.caseId}: missing human review ledger entry`);
      return;
    }

    [
      'reviewStatus',
      'reviewer',
      'reviewedAt',
      'conclusion',
      'evidenceNote'
    ].forEach((field) => {
      if (review[field] === undefined || review[field] === null || review[field] === '') {
        errors.push(`${sample.caseId}: ${field} is required`);
      }
    });

    if (review.reviewStatus && !ALLOWED_REVIEW_STATUSES.has(review.reviewStatus)) {
      errors.push(`${sample.caseId}: reviewStatus is not allowed`);
    }
    if (review.reviewStatus === 'pending-human-review') {
      addBlocker(blockers, 'human-review-pending');
    }
    if (review.reviewStatus === 'passed') {
      passedReviewCount += 1;
    }
    if (review.reviewStatus === 'failed' || review.reviewStatus === 'needs-follow-up') {
      addBlocker(blockers, 'human-review-not-passed');
    }
  });

  const allPassed = matrixSamples.length > 0
    && matrixSamples.every((sample) => {
      const review = reviewsByCaseId.get(sample.caseId);
      return review && review.reviewStatus === 'passed';
    });
  if (!allPassed) addBlocker(blockers, 'human-review-pending');

  return {
    sampleReviewCount: reviews.length,
    passedReviewCount
  };
}

function validateLunarPromotionReadinessRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const errors = [];
  const blockers = [];
  const { matrix, checklist, ledger } = readReviewFiles(rootDir, errors);

  validateChecklist(checklist, matrix, blockers, errors);
  const ledgerSummary = validateLedger(ledger, matrix, blockers, errors);

  return {
    errors,
    summary: {
      checklistId: checklist ? checklist.checklistId || '' : '',
      ledgerId: ledger ? ledger.ledgerId || '' : '',
      sourceMatrixId: matrix ? matrix.matrixId || '' : '',
      sampleReviewCount: ledgerSummary.sampleReviewCount || 0,
      passedReviewCount: ledgerSummary.passedReviewCount || 0,
      promotionReady: errors.length === 0 && blockers.length === 0,
      blockers
    }
  };
}

function run() {
  const result = validateLunarPromotionReadinessRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar promotion readiness ${result.summary.checklistId}`);
  console.log(`  ledger: ${result.summary.ledgerId}`);
  console.log(`  sample reviews: ${result.summary.sampleReviewCount}`);
  console.log(`  promotionReady: ${result.summary.promotionReady}`);
  console.log(`  blockers: ${result.summary.blockers.join(', ') || 'none'}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarPromotionReadinessRepository
};
