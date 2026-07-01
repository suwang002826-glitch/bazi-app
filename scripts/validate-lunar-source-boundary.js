const fs = require('fs');
const path = require('path');

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid source boundary record (${error.message})`);
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

function validateGeneratedScriptBoundary(record, errors) {
  if (!record) return;
  const reviewId = record.reviewId || 'unknown-source-boundary';

  if (record.reviewId !== 'lunar-2025-generated-script-boundary') {
    errors.push(`${reviewId}: reviewId must be lunar-2025-generated-script-boundary`);
  }
  if (record.status !== 'reference-only') {
    errors.push(`${reviewId}: status must remain reference-only`);
  }
  if (record.sourceClass !== 'generated-script-attachment') {
    errors.push(`${reviewId}: sourceClass must be generated-script-attachment`);
  }
  if (record.blocksRuntimePromotion !== true) {
    errors.push(`${reviewId}: blocksRuntimePromotion must be true`);
  }

  const decision = record.sourceControlDecision || {};
  [
    'mayUseAsPrimarySource',
    'mayCreateDraftPack',
    'mayCreateRuntimeCandidate',
    'mayRegisterRuntimeManifest'
  ].forEach((field) => {
    if (decision[field] !== false) {
      errors.push(`${reviewId}: sourceControlDecision.${field} must be false`);
    }
  });
  if (decision.requiresOriginalSourceBeforeImport !== true) {
    errors.push(`${reviewId}: sourceControlDecision.requiresOriginalSourceBeforeImport must be true`);
  }

  requireArrayIncludes(reviewId, 'allowedUses', record.allowedUses, [
    'human-review-reference',
    'lunar-date-cross-check-only'
  ], errors);
  requireArrayIncludes(reviewId, 'forbiddenUses', record.forbiddenUses, [
    'runtime-approved-data-pack',
    'day-ganzhi-authority',
    'solar-term-authority',
    'source-ledger-primary-record',
    'manifest-runtime-registration'
  ], errors);

  const conflicts = Array.isArray(record.conflictEvidence) ? record.conflictEvidence : [];
  if (conflicts.length < 2) {
    errors.push(`${reviewId}: conflictEvidence must include at least two dayGanzhi conflicts`);
  }
  conflicts.forEach((conflict, index) => {
    if (conflict.field !== 'dayGanzhi') {
      errors.push(`${reviewId}: conflictEvidence[${index}].field must be dayGanzhi`);
    }
    if (!conflict.date || !conflict.generatedScriptValue || !conflict.registeredPmoPackValue) {
      errors.push(`${reviewId}: conflictEvidence[${index}] must include date and both conflicting values`);
    }
    if (conflict.generatedScriptValue === conflict.registeredPmoPackValue) {
      errors.push(`${reviewId}: conflictEvidence[${index}] must record an actual conflict`);
    }
  });

  const trustedPath = record.trustedPromotionPath || {};
  [
    'primarySource',
    'lunarDateCrossCheck',
    'dayGanzhiRequirement',
    'solarTermRequirement'
  ].forEach((field) => {
    if (!trustedPath[field]) {
      errors.push(`${reviewId}: trustedPromotionPath.${field} is required`);
    }
  });
  if (trustedPath.primarySourceChecksumRequired !== true) {
    errors.push(`${reviewId}: trustedPromotionPath.primarySourceChecksumRequired must be true`);
  }
}

function validateLunarSourceBoundaryRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const recordPath = path.join(
    rootDir,
    'code',
    'data-packs',
    'lunar',
    'sources',
    'lunar-2025-generated-script-boundary.json'
  );
  const errors = [];
  const record = readJson(recordPath, errors);

  validateGeneratedScriptBoundary(record, errors);

  return {
    errors,
    summary: {
      reviewId: record ? record.reviewId || '' : '',
      status: record ? record.status || '' : '',
      sourceClass: record ? record.sourceClass || '' : '',
      blocksRuntimePromotion: record ? record.blocksRuntimePromotion : undefined,
      conflictCount: record && Array.isArray(record.conflictEvidence)
        ? record.conflictEvidence.length
        : 0
    }
  };
}

function run() {
  const result = validateLunarSourceBoundaryRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar source boundary ${result.summary.reviewId}`);
  console.log(`  status: ${result.summary.status}`);
  console.log(`  source class: ${result.summary.sourceClass}`);
  console.log(`  conflict count: ${result.summary.conflictCount}`);
  console.log(`  blocks runtime promotion: ${result.summary.blocksRuntimePromotion}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateGeneratedScriptBoundary,
  validateLunarSourceBoundaryRepository
};
