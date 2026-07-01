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

function requireArrayIncludes(ownerId, label, values, requiredValues, errors) {
  if (!Array.isArray(values)) {
    errors.push(`${ownerId}: ${label} must be an array`);
    return;
  }

  requiredValues.forEach((value) => {
    if (!values.includes(value)) {
      errors.push(`${ownerId}: ${label} must include ${value}`);
    }
  });
}

function requireCopyIncludes(ownerId, label, copy, requiredText, errors) {
  requiredText.forEach((text) => {
    if (!String(copy || '').includes(text)) {
      errors.push(`${ownerId}: ${label} must mention ${text}`);
    }
  });
}

function validateSourceReview(scope, approvalReview, errors) {
  if (!approvalReview || !scope) return;

  if (scope.sourceRuntimeApprovalReviewId !== approvalReview.reviewId) {
    errors.push(`${scope.scopeId}: sourceRuntimeApprovalReviewId must match runtime approval review`);
  }
  if (approvalReview.approvalDecision !== 'not-approved') {
    errors.push(`${scope.scopeId}: source approvalDecision must still be not-approved`);
  }
  if (approvalReview.proposedRuntimeScope !== 'gregorian-year-2023-limited') {
    errors.push(`${scope.scopeId}: source proposedRuntimeScope must be gregorian-year-2023-limited`);
  }
  if (approvalReview.completeLunarCalendar !== false) {
    errors.push(`${scope.scopeId}: source completeLunarCalendar must be false`);
  }
  if (approvalReview.requiresUiScopeWarning !== true) {
    errors.push(`${scope.scopeId}: source review must require UI scope warning`);
  }
  if (approvalReview.requiresStructuredOutOfCoverageError !== true) {
    errors.push(`${scope.scopeId}: source review must require structured out-of-coverage error`);
  }
}

function validateLimitedRuntimeScope(scope, approvalReview, errors) {
  if (!scope) return;

  const scopeId = scope.scopeId || 'unknown-limited-runtime-scope';
  if (scope.scopeId !== 'lunar-limited-runtime-scope-2023-hko') {
    errors.push(`${scopeId}: scopeId must be lunar-limited-runtime-scope-2023-hko`);
  }
  if (scope.status !== 'design-only') {
    errors.push(`${scopeId}: status must be design-only`);
  }
  if (scope.runtimeEnabled !== false) {
    errors.push(`${scopeId}: runtimeEnabled must remain false`);
  }
  if (scope.completeLunarCalendar !== false) {
    errors.push(`${scopeId}: completeLunarCalendar must be false`);
  }
  if (scope.sourceDraftDataPackId !== 'lunar-conversions-2023-full-draft') {
    errors.push(`${scopeId}: sourceDraftDataPackId must point to lunar-conversions-2023-full-draft`);
  }

  const coverage = scope.coverage || {};
  if (coverage.mode !== 'gregorian-year') {
    errors.push(`${scopeId}: coverage.mode must be gregorian-year`);
  }
  if (coverage.startDate !== '2023-01-01') {
    errors.push(`${scopeId}: coverage.startDate must be 2023-01-01`);
  }
  if (coverage.endDate !== '2023-12-31') {
    errors.push(`${scopeId}: coverage.endDate must be 2023-12-31`);
  }

  const authority = scope.authoritySource || {};
  if (authority.providerShortName !== 'HKO') {
    errors.push(`${scopeId}: authoritySource.providerShortName must be HKO`);
  }
  if (authority.dataset !== 'hko-open-data-calendar-2023-csv') {
    errors.push(`${scopeId}: authoritySource.dataset must be hko-open-data-calendar-2023-csv`);
  }

  const userWarning = scope.userWarning || {};
  if (userWarning.required !== true) {
    errors.push(`${scopeId}: userWarning.required must be true`);
  }
  requireCopyIncludes(scopeId, 'userWarning.copy', userWarning.copy, [
    '2023',
    'HKO',
    '非完整'
  ], errors);

  const outOfCoverageError = scope.outOfCoverageError || {};
  if (outOfCoverageError.required !== true) {
    errors.push(`${scopeId}: outOfCoverageError.required must be true`);
  }
  if (outOfCoverageError.code !== 'LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE') {
    errors.push(`${scopeId}: outOfCoverageError.code must be LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE`);
  }
  requireArrayIncludes(scopeId, 'outOfCoverageError.requiredFields', outOfCoverageError.requiredFields, [
    'inputDate',
    'supportedStartDate',
    'supportedEndDate',
    'completeLunarCalendar',
    'calendarDataVersion'
  ], errors);

  const manifestRegistration = scope.manifestRegistration || {};
  if (manifestRegistration.allowedInThisPr !== false) {
    errors.push(`${scopeId}: manifestRegistration.allowedInThisPr must be false`);
  }
  if (manifestRegistration.requiresSeparateManifestApproval !== true) {
    errors.push(`${scopeId}: manifestRegistration.requiresSeparateManifestApproval must be true`);
  }
  if (manifestRegistration.requiredApprovalDecision !== 'approved-for-runtime') {
    errors.push(`${scopeId}: manifestRegistration.requiredApprovalDecision must be approved-for-runtime`);
  }

  const runtimeIntegration = scope.runtimeIntegration || {};
  if (runtimeIntegration.allowedInThisPr !== false) {
    errors.push(`${scopeId}: runtimeIntegration.allowedInThisPr must be false`);
  }
  if (runtimeIntegration.formalBaziEntryMustRemainUnchanged !== true) {
    errors.push(`${scopeId}: runtimeIntegration.formalBaziEntryMustRemainUnchanged must be true`);
  }
  if (runtimeIntegration.calendarAdapterWhitelistAllowed !== false) {
    errors.push(`${scopeId}: runtimeIntegration.calendarAdapterWhitelistAllowed must be false`);
  }

  requireArrayIncludes(scopeId, 'forbiddenClaims', scope.forbiddenClaims, [
    'Complete lunar calendar support',
    'Full historical lunar conversion support',
    'Runtime enabled'
  ], errors);

  validateSourceReview(scope, approvalReview, errors);
}

function validateLunarLimitedRuntimeScopeRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const reviewDir = path.join(rootDir, 'code', 'data-packs', 'lunar', 'reviews');
  const errors = [];
  const approvalReview = readJson(path.join(reviewDir, 'lunar-runtime-approval-review-2023-hko-limited.json'), errors);
  const scope = readJson(path.join(reviewDir, 'lunar-limited-runtime-scope-2023-hko.json'), errors);

  validateLimitedRuntimeScope(scope, approvalReview, errors);

  return {
    errors,
    summary: {
      scopeId: scope ? scope.scopeId || '' : '',
      status: scope ? scope.status || '' : '',
      runtimeEnabled: scope ? scope.runtimeEnabled : undefined,
      completeLunarCalendar: scope ? scope.completeLunarCalendar : undefined,
      coverageStart: scope && scope.coverage ? scope.coverage.startDate || '' : '',
      coverageEnd: scope && scope.coverage ? scope.coverage.endDate || '' : '',
      outOfCoverageErrorCode: scope && scope.outOfCoverageError ? scope.outOfCoverageError.code || '' : '',
      requiresSeparateManifestApproval: scope && scope.manifestRegistration
        ? scope.manifestRegistration.requiresSeparateManifestApproval
        : undefined
    }
  };
}

function run() {
  const result = validateLunarLimitedRuntimeScopeRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar limited runtime scope ${result.summary.scopeId}`);
  console.log(`  status: ${result.summary.status}`);
  console.log(`  coverage: ${result.summary.coverageStart}..${result.summary.coverageEnd}`);
  console.log(`  runtimeEnabled: ${result.summary.runtimeEnabled}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarLimitedRuntimeScopeRepository
};
