const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  validateGeneratedScriptBoundary,
  validateLunarSourceBoundaryRepository
} = require('./validate-lunar-source-boundary');

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected source-boundary error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

{
  const result = validateLunarSourceBoundaryRepository();
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.summary.reviewId, 'lunar-2025-generated-script-boundary');
  assert.strictEqual(result.summary.status, 'reference-only');
  assert.strictEqual(result.summary.sourceClass, 'generated-script-attachment');
  assert.strictEqual(result.summary.blocksRuntimePromotion, true);
  assert(result.summary.conflictCount >= 2);
}

{
  const errors = [];
  validateGeneratedScriptBoundary({
    reviewId: 'bad-record',
    status: 'approved-for-runtime',
    sourceClass: 'generated-script-attachment',
    sourceControlDecision: {
      mayUseAsPrimarySource: true,
      mayCreateDraftPack: true,
      mayCreateRuntimeCandidate: true,
      mayRegisterRuntimeManifest: true,
      requiresOriginalSourceBeforeImport: false
    },
    allowedUses: [],
    forbiddenUses: [],
    conflictEvidence: [
      {
        date: '2025-01-01',
        field: 'dayGanzhi',
        generatedScriptValue: '庚午',
        registeredPmoPackValue: '庚午'
      }
    ],
    trustedPromotionPath: {},
    blocksRuntimePromotion: false
  }, errors);

  assertHasError(errors, 'status must remain reference-only');
  assertHasError(errors, 'sourceControlDecision.mayUseAsPrimarySource must be false');
  assertHasError(errors, 'requiresOriginalSourceBeforeImport must be true');
  assertHasError(errors, 'allowedUses must include human-review-reference');
  assertHasError(errors, 'forbiddenUses must include runtime-approved-data-pack');
  assertHasError(errors, 'conflictEvidence must include at least two dayGanzhi conflicts');
  assertHasError(errors, 'must record an actual conflict');
  assertHasError(errors, 'trustedPromotionPath.primarySource is required');
  assertHasError(errors, 'blocksRuntimePromotion must be true');
}

{
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-source-boundary-test-'));
  const sourceDir = path.join(tempRoot, 'code', 'data-packs', 'lunar', 'sources');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(
    path.join(sourceDir, 'lunar-2025-generated-script-boundary.json'),
    JSON.stringify({
      reviewId: 'lunar-2025-generated-script-boundary',
      status: 'reference-only',
      sourceClass: 'generated-script-attachment',
      sourceControlDecision: {
        mayUseAsPrimarySource: false,
        mayCreateDraftPack: false,
        mayCreateRuntimeCandidate: false,
        mayRegisterRuntimeManifest: false,
        requiresOriginalSourceBeforeImport: true
      },
      allowedUses: ['human-review-reference', 'lunar-date-cross-check-only'],
      forbiddenUses: [
        'runtime-approved-data-pack',
        'day-ganzhi-authority',
        'solar-term-authority',
        'source-ledger-primary-record',
        'manifest-runtime-registration'
      ],
      conflictEvidence: [
        {
          date: '2025-01-01',
          field: 'dayGanzhi',
          generatedScriptValue: '庚辰',
          registeredPmoPackValue: '庚午'
        },
        {
          date: '2025-07-25',
          field: 'dayGanzhi',
          generatedScriptValue: '乙巳',
          registeredPmoPackValue: '乙未'
        }
      ],
      trustedPromotionPath: {
        primarySource: 'PMO PDF',
        primarySourceChecksumRequired: true,
        lunarDateCrossCheck: 'HKO CSV',
        dayGanzhiRequirement: 'independent anchor',
        solarTermRequirement: 'HKO major-term comparison'
      },
      blocksRuntimePromotion: true
    }, null, 2),
    'utf8'
  );

  const result = validateLunarSourceBoundaryRepository({ rootDir: tempRoot });
  assert.deepStrictEqual(result.errors, []);
}

console.log('PASS lunar source boundary validation');
