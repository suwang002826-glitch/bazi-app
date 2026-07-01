const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  validatePmo2025PromotionReadinessRecord,
  validatePmo2025PromotionReadinessRepository
} = require('./validate-pmo-2025-promotion-readiness');

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected PMO 2025 promotion-readiness error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

{
  const result = validatePmo2025PromotionReadinessRepository();
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.summary.checklistId, 'lunar-promotion-checklist-2025-pmo-candidate');
  assert.strictEqual(result.summary.approvalDecision, 'not-approved');
  assert.strictEqual(result.summary.runtimeApproval, false);
  assert.strictEqual(result.summary.promotableToStableRuntime, false);
  assert(result.summary.remainingBlockers.includes('day-ganzhi-second-authority-anchor-pending'));
  assert(result.summary.remainingBlockers.includes('minor-solar-terms-second-source-pending'));
  assert(result.summary.remainingBlockers.includes('stable-runtime-approval-not-granted'));
}

{
  const errors = [];
  validatePmo2025PromotionReadinessRecord({
    checklistId: 'bad-checklist',
    status: 'approved-for-runtime',
    sourceDataPackId: 'lunar-data-pack-2025-candidate',
    sourceBoundaryReviewId: 'lunar-2025-generated-script-boundary',
    approvalDecision: 'approved-for-runtime',
    runtimeApproval: true,
    promotableToStableRuntime: true,
    requiredGates: [],
    gates: {
      pmoPrimarySourceRegistered: 'missing',
      hkoLunarDateCrossCheck: 'missing',
      dayGanzhiSecondAuthorityAnchor: 'passed',
      majorSolarTermsCrossCheck: 'missing',
      minorSolarTermsSecondSource: 'passed',
      generatedScriptBoundary: 'missing',
      stableRuntimeApproval: 'passed'
    },
    remainingBlockers: []
  }, errors);

  assertHasError(errors, 'status must remain pending-approval');
  assertHasError(errors, 'approvalDecision must be not-approved');
  assertHasError(errors, 'runtimeApproval must stay false');
  assertHasError(errors, 'promotableToStableRuntime must stay false');
  assertHasError(errors, 'requiredGates must include pmoPrimarySourceRegistered');
  assertHasError(errors, 'gates.pmoPrimarySourceRegistered must be passed');
  assertHasError(errors, 'gates.dayGanzhiSecondAuthorityAnchor must be blocked');
  assertHasError(errors, 'remainingBlockers must include day-ganzhi-second-authority-anchor-pending');
}

{
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pmo-2025-promotion-readiness-test-'));
  const reviewDir = path.join(tempRoot, 'code', 'data-packs', 'lunar', 'reviews');
  fs.mkdirSync(reviewDir, { recursive: true });
  fs.writeFileSync(
    path.join(reviewDir, 'lunar-promotion-checklist-2025-pmo-candidate.json'),
    JSON.stringify({
      checklistId: 'lunar-promotion-checklist-2025-pmo-candidate',
      status: 'pending-approval',
      sourceDataPackId: 'lunar-data-pack-2025-candidate',
      sourceBoundaryReviewId: 'lunar-2025-generated-script-boundary',
      approvalDecision: 'not-approved',
      runtimeApproval: false,
      promotableToStableRuntime: false,
      scope: {
        gregorianYear: 2025,
        completeSolarYear: true,
        completeLunarCalendar: false,
        runtimeMode: 'candidate-preview'
      },
      requiredGates: [
        'pmoPrimarySourceRegistered',
        'hkoLunarDateCrossCheck',
        'dayGanzhiSecondAuthorityAnchor',
        'majorSolarTermsCrossCheck',
        'minorSolarTermsSecondSource',
        'generatedScriptBoundary',
        'stableRuntimeApproval'
      ],
      gates: {
        pmoPrimarySourceRegistered: 'passed',
        hkoLunarDateCrossCheck: 'passed',
        dayGanzhiSecondAuthorityAnchor: 'blocked',
        majorSolarTermsCrossCheck: 'passed',
        minorSolarTermsSecondSource: 'blocked',
        generatedScriptBoundary: 'passed',
        stableRuntimeApproval: 'blocked'
      },
      evidence: {
        primarySource: 'docs/authority-source-registry.md#PMO-CALENDAR-1900-2025',
        pmoExtractionReport: 'work/authority-sources/extracted/pmo-calendar-2025-draft.json',
        hkoLunarDateReport: 'work/authority-sources/validation/pmo-vs-hko-2025-lunar-report.json',
        dayGanzhiCycleReport: 'work/authority-sources/validation/pmo-2025-day-ganzhi-cycle-report.json',
        majorSolarTermsReport: 'work/authority-sources/validation/pmo-vs-hko-2025-major-solar-terms-report.json',
        generatedScriptBoundary: 'code/data-packs/lunar/sources/lunar-2025-generated-script-boundary.json'
      },
      remainingBlockers: [
        'day-ganzhi-second-authority-anchor-pending',
        'minor-solar-terms-second-source-pending',
        'stable-runtime-approval-not-granted'
      ]
    }, null, 2),
    'utf8'
  );

  const result = validatePmo2025PromotionReadinessRepository({ rootDir: tempRoot });
  assert.deepStrictEqual(result.errors, []);
}

console.log('PASS PMO 2025 promotion readiness validation');
