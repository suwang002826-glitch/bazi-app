const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildBaziProfile } = require('../code/utils/mock');
const {
  lunarManifest,
  getLunarDataPackCoverage
} = require('../code/utils/bazi/lunarDataPack');
const {
  validateLunarDataPackRepository
} = require('./validate-lunar-data-pack');
const {
  validateLunarDraftDataPackRepository
} = require('./validate-lunar-draft-data-pack');
const {
  validateLunarReviewMatrixRepository
} = require('./validate-lunar-review-matrix');
const {
  validateLunarPromotionReadinessRepository
} = require('./validate-lunar-promotion-readiness');
const {
  validateLunarRuntimeApprovalReviewRepository
} = require('./validate-lunar-runtime-approval-review');
const {
  validateLunarLimitedRuntimeScopeRepository
} = require('./validate-lunar-limited-runtime-scope');
const {
  validateLunarLimitedRuntimeCandidateRepository
} = require('./validate-lunar-limited-runtime-candidate');
const {
  validateLunarLimitedPreviewGateRepository
} = require('./validate-lunar-limited-preview-gate');
const {
  validateLunarAuthoritySourceIntakeRepository
} = require('./validate-lunar-authority-source-intake');

const acceptanceCases = [
  {
    id: 'BZI-001',
    title: '普通公历生日',
    input: {
      name: 'BZI-001',
      gender: '女',
      birthDate: '1990-06-15',
      birthTime: '10:30',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expected: ['庚午', '壬午', '辛亥', '癸巳']
  },
  {
    id: 'BZI-002',
    title: '立春前',
    input: {
      name: 'BZI-002',
      gender: '男',
      birthDate: '2024-02-04',
      birthTime: '15:00',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expected: ['癸卯', '乙丑', '戊戌', '庚申']
  },
  {
    id: 'BZI-003',
    title: '立春后',
    input: {
      name: 'BZI-003',
      gender: '男',
      birthDate: '2024-02-04',
      birthTime: '17:00',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expected: ['甲辰', '丙寅', '戊戌', '辛酉']
  },
  {
    id: 'BZI-004',
    title: '子时',
    input: {
      name: 'BZI-004',
      gender: '女',
      birthDate: '1990-06-15',
      birthTime: '23:30',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expected: ['庚午', '壬午', '辛亥', '戊子']
  },
  {
    id: 'BZI-005',
    title: '农历生日真实输入转换',
    input: {
      name: 'BZI-005',
      gender: '女',
      calendarType: 'lunar',
      lunarYear: 2023,
      lunarMonth: 8,
      lunarDay: 15,
      isLeapMonth: false,
      birthTime: '20:00',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expectedSolarDate: '2023-09-29',
    expectedCalendarDataVersion: 'lunar-data-pack@2026.07.02-preview',
    expectedConversionSource: 'data-pack:lunar-conversions-2023',
    expected: ['癸卯', '辛酉', '庚寅', '丙戌'],
    note: '第三轮要求农历输入从 data-pack 转换，不再读取代码内置白名单。'
  },
  {
    id: 'BZI-006',
    title: '农历闰月真实输入转换',
    input: {
      name: 'BZI-006',
      gender: '男',
      calendarType: 'lunar',
      lunarYear: 2023,
      lunarMonth: 2,
      lunarDay: 10,
      isLeapMonth: true,
      birthTime: '09:00',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expectedSolarDate: '2023-03-31',
    expectedCalendarDataVersion: 'lunar-data-pack@2026.07.02-preview',
    expectedConversionSource: 'data-pack:lunar-conversions-2023',
    expected: ['癸卯', '乙卯', '戊子', '丁巳'],
    note: '第三轮要求农历闰月输入从 data-pack 转换，不再读取代码内置白名单。'
  }
];

const unsupportedLunarCases = [
  {
    id: 'BZI-NEG-001',
    title: 'data-pack 外农历日期必须明确报错',
    input: {
      name: 'BZI-NEG-001',
      gender: '女',
      calendarType: 'lunar',
      lunarYear: 2023,
      lunarMonth: 8,
      lunarDay: 16,
      isLeapMonth: false,
      birthTime: '20:00',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expectedErrorCode: 'LUNAR_DATE_OUTSIDE_DATA_PACK_COVERAGE'
  }
];

const implicitLunarCases = [
  {
    id: 'BZI-IMPLICIT-001',
    title: '带农历字段但未声明 calendarType 时仍走 data-pack',
    input: {
      name: 'BZI-IMPLICIT-001',
      gender: '女',
      lunarYear: 2023,
      lunarMonth: 8,
      lunarDay: 15,
      isLeapMonth: false,
      birthTime: '20:00',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expectedSolarDate: '2023-09-29',
    expectedConversionSource: 'data-pack:lunar-conversions-2023'
  }
];

function extractPillars(result) {
  return result.pillars.map((pillar) => pillar.value);
}

function assertDataPackRegistry() {
  const schemaResult = validateLunarDataPackRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(schemaResult.errors, []);
  console.log(`PASS DATA-PACK schema ${schemaResult.summary.calendarDataVersion}`);

  assert.strictEqual(
    typeof getLunarDataPackCoverage,
    'function',
    'lunarDataPack must expose manifest-driven coverage summary'
  );

  const coverage = getLunarDataPackCoverage();
  assert.strictEqual(coverage.calendarDataVersion, lunarManifest.calendarDataVersion);
  assert.strictEqual(coverage.status, lunarManifest.status);
  assert.strictEqual(coverage.completeLunarCalendar, false);
  assert.deepStrictEqual(
    coverage.packIds.slice().sort(),
    lunarManifest.packs.map((pack) => pack.dataPackId).sort()
  );
  console.log(`PASS DATA-PACK manifest registry ${coverage.calendarDataVersion}`);
}

function assertDraftDataPacks() {
  const draftResult = validateLunarDraftDataPackRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(draftResult.errors, []);
  console.log(`PASS DRAFT DATA-PACK validation ${draftResult.summary.draftPackCount} draft pack(s)`);
}

function assertReviewMatrix() {
  const matrixResult = validateLunarReviewMatrixRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(matrixResult.errors, []);
  console.log(`PASS REVIEW MATRIX validation ${matrixResult.summary.sampleCount} sample(s)`);
}

function assertPromotionReadiness() {
  const readinessResult = validateLunarPromotionReadinessRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(readinessResult.errors, []);
  assert.strictEqual(readinessResult.summary.promotionReady, false);
  assert.strictEqual(readinessResult.summary.passedReviewCount, 9);
  assert.ok(!readinessResult.summary.blockers.includes('human-review-pending'));
  assert.ok(readinessResult.summary.blockers.includes('runtime-approval-not-granted'));
  assert.ok(readinessResult.summary.blockers.includes('approved-for-runtime-blocked'));
  console.log(`PASS PROMOTION READINESS gate ${readinessResult.summary.blockers.join(', ')}`);
}

function assertRuntimeApprovalReview() {
  const approvalResult = validateLunarRuntimeApprovalReviewRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(approvalResult.errors, []);
  assert.strictEqual(approvalResult.summary.approvalDecision, 'not-approved');
  assert.strictEqual(approvalResult.summary.proposedRuntimeScope, 'gregorian-year-2023-limited');
  assert.strictEqual(approvalResult.summary.requiresUiScopeWarning, true);
  console.log(`PASS RUNTIME APPROVAL REVIEW ${approvalResult.summary.approvalDecision}`);
}

function assertLimitedRuntimeScope() {
  const scopeResult = validateLunarLimitedRuntimeScopeRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(scopeResult.errors, []);
  assert.strictEqual(scopeResult.summary.status, 'design-only');
  assert.strictEqual(scopeResult.summary.runtimeEnabled, false);
  assert.strictEqual(scopeResult.summary.completeLunarCalendar, false);
  assert.strictEqual(scopeResult.summary.requiresSeparateManifestApproval, true);
  console.log(`PASS LIMITED RUNTIME SCOPE ${scopeResult.summary.coverageStart}..${scopeResult.summary.coverageEnd}`);
}

function assertLimitedRuntimeCandidate() {
  const candidateResult = validateLunarLimitedRuntimeCandidateRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(candidateResult.errors, []);
  assert.strictEqual(candidateResult.summary.candidatePackCount, 1);
  assert.strictEqual(candidateResult.summary.recordCount, 365);
  assert.strictEqual(candidateResult.summary.runtimeEnabled, false);
  assert.strictEqual(candidateResult.summary.manifestRegistered, false);
  assert.strictEqual(candidateResult.summary.completeLunarCalendar, false);
  console.log(`PASS LIMITED RUNTIME CANDIDATE ${candidateResult.summary.recordCount} records`);
}

function assertLimitedPreviewGate() {
  const gateResult = validateLunarLimitedPreviewGateRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(gateResult.errors, []);
  assert.strictEqual(gateResult.summary.status, 'preflight-required');
  assert.strictEqual(gateResult.summary.previewEntryAllowed, false);
  assert.strictEqual(gateResult.summary.manifestRegistrationAllowed, false);
  assert.strictEqual(gateResult.summary.runtimeEnabled, false);
  assert.strictEqual(gateResult.summary.uiWarningRequired, true);
  console.log(`PASS LIMITED PREVIEW GATE ${gateResult.summary.outOfCoverageErrorCode}`);
}

function assertAuthoritySourceIntake() {
  const intakeResult = validateLunarAuthoritySourceIntakeRepository({
    rootDir: path.join(__dirname, '..')
  });
  assert.deepStrictEqual(intakeResult.errors, []);
  assert.strictEqual(intakeResult.summary.status, 'template');
  assert.ok(intakeResult.summary.minimumRequiredFields.includes('isLeapMonth'));
  assert.ok(intakeResult.summary.preferredFormats.includes('csv'));
  assert.strictEqual(intakeResult.summary.rejectsScreenshotOnly, true);
  console.log(`PASS AUTHORITY SOURCE INTAKE ${intakeResult.summary.templateId}`);
}

function assertUnsupportedLunarInputs() {
  unsupportedLunarCases.forEach((item) => {
    assert.throws(
      () => buildBaziProfile(item.input),
      (error) => {
        assert.strictEqual(error.code, item.expectedErrorCode);
        assert.strictEqual(error.details.calendarDataVersion, lunarManifest.calendarDataVersion);
        assert.strictEqual(error.details.status, lunarManifest.status);
        assert.strictEqual(error.details.completeLunarCalendar, false);
        assert.ok(
          Array.isArray(error.details.availablePackIds)
            && error.details.availablePackIds.includes('lunar-conversions-2023'),
          'outside coverage errors must include available pack ids'
        );
        return true;
      },
      `${item.id} ${item.title}`
    );
    console.log(`PASS ${item.id} ${item.title}`);
  });
}

function assertImplicitLunarInputs() {
  implicitLunarCases.forEach((item) => {
    const result = buildBaziProfile(item.input);
    const conversion = result.calendarConversion || {};
    assert.strictEqual(conversion.calendarType, 'lunar');
    assert.strictEqual(conversion.solarDate, item.expectedSolarDate);
    assert.strictEqual(conversion.source, item.expectedConversionSource);
    console.log(`PASS ${item.id} ${item.title}`);
  });
}

function run() {
  assertDataPackRegistry();
  assertDraftDataPacks();
  assertReviewMatrix();
  assertPromotionReadiness();
  assertRuntimeApprovalReview();
  assertLimitedRuntimeScope();
  assertLimitedRuntimeCandidate();
  assertLimitedPreviewGate();
  assertAuthoritySourceIntake();
  assertUnsupportedLunarInputs();
  assertImplicitLunarInputs();

  const results = acceptanceCases.map((item) => {
    const result = buildBaziProfile(item.input);
    const actual = extractPillars(result);
    const conversion = result.calendarConversion || {};
    const actualSolarDate = conversion.solarDate;
    const actualCalendarDataVersion = conversion.calendarDataVersion;
    const actualConversionSource = conversion.source;
    const pillarsPassed = actual.join('|') === item.expected.join('|');
    const conversionPassed = item.expectedSolarDate ? actualSolarDate === item.expectedSolarDate : true;
    const dataVersionPassed = item.expectedCalendarDataVersion
      ? actualCalendarDataVersion === item.expectedCalendarDataVersion
      : true;
    const conversionSourcePassed = item.expectedConversionSource
      ? actualConversionSource === item.expectedConversionSource
      : true;
    const passed = pillarsPassed && conversionPassed && dataVersionPassed && conversionSourcePassed;
    return {
      id: item.id,
      title: item.title,
      expected: item.expected,
      actual,
      expectedSolarDate: item.expectedSolarDate || '',
      actualSolarDate: actualSolarDate || '',
      expectedCalendarDataVersion: item.expectedCalendarDataVersion || '',
      actualCalendarDataVersion: actualCalendarDataVersion || '',
      expectedConversionSource: item.expectedConversionSource || '',
      actualConversionSource: actualConversionSource || '',
      passed,
      note: item.note || ''
    };
  });

  results.forEach((item) => {
    const mark = item.passed ? 'PASS' : 'FAIL';
    console.log(`${mark} ${item.id} ${item.title}`);
    console.log(`  expected: ${item.expected.join(' ')}`);
    console.log(`  actual:   ${item.actual.join(' ')}`);
    if (item.expectedSolarDate) {
      console.log(`  expected solar date: ${item.expectedSolarDate}`);
      console.log(`  actual solar date:   ${item.actualSolarDate || '(missing)'}`);
    }
    if (item.expectedCalendarDataVersion) {
      console.log(`  expected data pack:   ${item.expectedCalendarDataVersion}`);
      console.log(`  actual data pack:     ${item.actualCalendarDataVersion || '(missing)'}`);
    }
    if (item.expectedConversionSource) {
      console.log(`  expected source:      ${item.expectedConversionSource}`);
      console.log(`  actual source:        ${item.actualConversionSource || '(missing)'}`);
    }
    if (item.note) console.log(`  note:     ${item.note}`);
  });

  const failed = results.filter((item) => !item.passed);
  assert.strictEqual(failed.length, 0, `${failed.length} acceptance case(s) failed`);

  const baziPageJs = fs.readFileSync(path.join(__dirname, '../code/pages/bazi/bazi.js'), 'utf8');
  assert.match(
    baziPageJs,
    /useTrueSolarTime:\s*false/,
    'v0.1 requires true solar time to be disabled by default'
  );

  const baziPageWxml = fs.readFileSync(path.join(__dirname, '../code/pages/bazi/bazi.wxml'), 'utf8');
  assert.match(
    baziPageWxml,
    /bindchange="onTrueSolarSwitch"/,
    'v0.1 requires a visible true solar time switch'
  );
}

run();
require('./validate-lunar-runtime-loader.test');
require('./validate-lunar-beta-entry');
require('./generate-lunar-data-pack.test');
require('./generate-lunar-draft-data-pack.test');
require('./validate-lunar-review-matrix.test');
require('./validate-lunar-promotion-readiness.test');
require('./validate-lunar-runtime-approval-review.test');
require('./validate-lunar-limited-runtime-scope.test');
require('./generate-lunar-limited-runtime-candidate.test');
require('./validate-lunar-limited-runtime-candidate.test');
require('./validate-lunar-limited-preview-gate.test');
require('./validate-lunar-authority-source-intake.test');
require('./validate-lunar-source-boundary.test');
require('./validate-pmo-2025-promotion-readiness.test');
require('./validate-bazi-api-client.test');
require('./validate-bazi-api-entry.test');
require('./validate-bazi-backend-service.test');
