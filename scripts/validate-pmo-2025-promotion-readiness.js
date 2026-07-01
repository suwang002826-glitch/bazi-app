const fs = require('fs');
const path = require('path');

const REQUIRED_GATES = [
  'pmoPrimarySourceRegistered',
  'hkoLunarDateCrossCheck',
  'dayGanzhiSecondAuthorityAnchor',
  'majorSolarTermsCrossCheck',
  'minorSolarTermsSecondSource',
  'generatedScriptBoundary',
  'stableRuntimeApproval'
];

const REQUIRED_BLOCKERS = [
  'day-ganzhi-second-authority-anchor-pending',
  'minor-solar-terms-second-source-pending',
  'stable-runtime-approval-not-granted'
];

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid PMO 2025 promotion-readiness record (${error.message})`);
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

function validatePmo2025PromotionReadinessRecord(record, errors) {
  if (!record) return;
  const checklistId = record.checklistId || 'unknown-pmo-2025-promotion-checklist';

  if (record.checklistId !== 'lunar-promotion-checklist-2025-pmo-candidate') {
    errors.push(`${checklistId}: checklistId must be lunar-promotion-checklist-2025-pmo-candidate`);
  }
  if (record.status !== 'pending-approval') {
    errors.push(`${checklistId}: status must remain pending-approval`);
  }
  if (record.sourceDataPackId !== 'lunar-data-pack-2025-candidate') {
    errors.push(`${checklistId}: sourceDataPackId must be lunar-data-pack-2025-candidate`);
  }
  if (record.sourceBoundaryReviewId !== 'lunar-2025-generated-script-boundary') {
    errors.push(`${checklistId}: sourceBoundaryReviewId must be lunar-2025-generated-script-boundary`);
  }
  if (record.approvalDecision !== 'not-approved') {
    errors.push(`${checklistId}: approvalDecision must be not-approved`);
  }
  if (record.runtimeApproval !== false) {
    errors.push(`${checklistId}: runtimeApproval must stay false`);
  }
  if (record.promotableToStableRuntime !== false) {
    errors.push(`${checklistId}: promotableToStableRuntime must stay false`);
  }

  requireArrayIncludes(checklistId, 'requiredGates', record.requiredGates, REQUIRED_GATES, errors);

  const gates = record.gates || {};
  [
    'pmoPrimarySourceRegistered',
    'hkoLunarDateCrossCheck',
    'majorSolarTermsCrossCheck',
    'generatedScriptBoundary'
  ].forEach((gate) => {
    if (gates[gate] !== 'passed') {
      errors.push(`${checklistId}: gates.${gate} must be passed`);
    }
  });
  [
    'dayGanzhiSecondAuthorityAnchor',
    'minorSolarTermsSecondSource',
    'stableRuntimeApproval'
  ].forEach((gate) => {
    if (gates[gate] !== 'blocked') {
      errors.push(`${checklistId}: gates.${gate} must be blocked`);
    }
  });

  requireArrayIncludes(checklistId, 'remainingBlockers', record.remainingBlockers, REQUIRED_BLOCKERS, errors);

  const evidence = record.evidence || {};
  [
    'primarySource',
    'pmoExtractionReport',
    'hkoLunarDateReport',
    'dayGanzhiCycleReport',
    'majorSolarTermsReport',
    'generatedScriptBoundary'
  ].forEach((field) => {
    if (!evidence[field]) {
      errors.push(`${checklistId}: evidence.${field} is required`);
    }
  });

  const scope = record.scope || {};
  if (scope.gregorianYear !== 2025) {
    errors.push(`${checklistId}: scope.gregorianYear must be 2025`);
  }
  if (scope.completeSolarYear !== true) {
    errors.push(`${checklistId}: scope.completeSolarYear must be true`);
  }
  if (scope.completeLunarCalendar !== false) {
    errors.push(`${checklistId}: scope.completeLunarCalendar must be false`);
  }
  if (scope.runtimeMode !== 'candidate-preview') {
    errors.push(`${checklistId}: scope.runtimeMode must be candidate-preview`);
  }
}

function validatePmo2025PromotionReadinessRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const recordPath = path.join(
    rootDir,
    'code',
    'data-packs',
    'lunar',
    'reviews',
    'lunar-promotion-checklist-2025-pmo-candidate.json'
  );
  const errors = [];
  const record = readJson(recordPath, errors);

  validatePmo2025PromotionReadinessRecord(record, errors);

  return {
    errors,
    summary: {
      checklistId: record ? record.checklistId || '' : '',
      approvalDecision: record ? record.approvalDecision || '' : '',
      runtimeApproval: record ? record.runtimeApproval : undefined,
      promotableToStableRuntime: record ? record.promotableToStableRuntime : undefined,
      remainingBlockers: record && Array.isArray(record.remainingBlockers)
        ? record.remainingBlockers
        : []
    }
  };
}

function run() {
  const result = validatePmo2025PromotionReadinessRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS PMO 2025 promotion readiness ${result.summary.checklistId}`);
  console.log(`  approvalDecision: ${result.summary.approvalDecision}`);
  console.log(`  runtimeApproval: ${result.summary.runtimeApproval}`);
  console.log(`  promotableToStableRuntime: ${result.summary.promotableToStableRuntime}`);
  console.log(`  blockers: ${result.summary.remainingBlockers.join(', ') || 'none'}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validatePmo2025PromotionReadinessRecord,
  validatePmo2025PromotionReadinessRepository
};
