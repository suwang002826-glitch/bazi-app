const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  validateLunarLimitedPreviewGateRepository
} = require('./validate-lunar-limited-preview-gate');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected limited preview gate error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const result = validateLunarLimitedPreviewGateRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.gateId, 'lunar-limited-preview-gate-2023-hko');
assert.strictEqual(result.summary.status, 'preflight-required');
assert.strictEqual(result.summary.previewEntryAllowed, false);
assert.strictEqual(result.summary.manifestRegistrationAllowed, false);
assert.strictEqual(result.summary.runtimeEnabled, false);
assert.strictEqual(result.summary.uiWarningRequired, true);
assert.strictEqual(result.summary.outOfCoverageErrorCode, 'LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-limited-preview-gate-test-'));
const lunarDir = path.join(tempRoot, 'code', 'data-packs', 'lunar');

writeJson(path.join(lunarDir, 'reviews', 'lunar-limited-runtime-scope-2023-hko.json'), {
  scopeId: 'lunar-limited-runtime-scope-2023-hko',
  status: 'design-only',
  runtimeEnabled: false,
  completeLunarCalendar: false,
  coverage: {
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  },
  userWarning: {
    required: true,
    copy: '当前仅为 2023 年 HKO 数据预览，非完整农历能力。'
  },
  outOfCoverageError: {
    required: true,
    code: 'LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE',
    requiredFields: [
      'inputDate',
      'supportedStartDate',
      'supportedEndDate',
      'completeLunarCalendar',
      'calendarDataVersion'
    ]
  }
});
writeJson(path.join(lunarDir, 'candidates', 'lunar-conversions-2023-hko-limited-candidate.json'), {
  dataPackId: 'lunar-conversions-2023-hko-limited-candidate',
  calendarDataVersion: 'lunar-data-pack@2026.07.01-hko-2023-limited.candidate.1',
  runtimeEnabled: false,
  manifestRegistered: false,
  completeLunarCalendar: false,
  coverage: {
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  }
});
writeJson(path.join(lunarDir, 'previews', 'lunar-limited-preview-gate-2023-hko.json'), {
  gateId: 'fixture-preview-gate',
  status: 'preflight-required',
  sourceScopeId: 'lunar-limited-runtime-scope-2023-hko',
  sourceCandidateDataPackId: 'lunar-conversions-2023-hko-limited-candidate',
  previewEntryAllowed: true,
  manifestRegistrationAllowed: false,
  runtimeEnabled: false,
  completeLunarCalendar: false,
  uiWarning: {
    required: true,
    copy: '当前为 2023 年 HKO 数据预览。',
    mustMention: [
      '2023',
      'HKO',
      '非完整'
    ],
    requiredPlacements: [
      'lunar-input-panel',
      'before-generate-button',
      'result-conversion-summary'
    ]
  },
  outOfCoverageError: {
    required: true,
    code: 'LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE',
    requiredFields: [
      'inputDate',
      'supportedStartDate',
      'supportedEndDate',
      'completeLunarCalendar',
      'calendarDataVersion'
    ],
    examples: [
      {
        inputDate: '2024-01-01',
        supportedStartDate: '2023-01-01',
        supportedEndDate: '2023-12-31',
        completeLunarCalendar: false,
        calendarDataVersion: 'lunar-data-pack@2026.07.01-hko-2023-limited.candidate.1'
      },
      {
        inputDate: '2022-12-31',
        supportedStartDate: '2023-01-01',
        supportedEndDate: '2023-12-31',
        completeLunarCalendar: false,
        calendarDataVersion: 'lunar-data-pack@2026.07.01-hko-2023-limited.candidate.1'
      }
    ]
  },
  releasePreconditions: {
    uiWarningImplemented: false,
    structuredOutOfCoverageErrorImplemented: false,
    previewEntryReviewed: false,
    manifestRegistrationReviewed: false
  },
  blocksPreviewUnless: [
    'uiWarningImplemented',
    'structuredOutOfCoverageErrorImplemented',
    'previewEntryReviewed'
  ],
  blocksManifestRegistrationUnless: [
    'uiWarningImplemented',
    'structuredOutOfCoverageErrorImplemented',
    'manifestRegistrationReviewed'
  ]
});

const invalidResult = validateLunarLimitedPreviewGateRepository({ rootDir: tempRoot });
assertHasError(invalidResult.errors, 'fixture-preview-gate: previewEntryAllowed must remain false');
assertHasError(invalidResult.errors, 'fixture-preview-gate: uiWarning.copy must mention 非完整');

console.log('PASS lunar limited preview gate validation');
