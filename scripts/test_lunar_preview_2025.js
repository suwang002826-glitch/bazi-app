const assert = require('assert');
const { resolveCalendar } = require('../code/utils/bazi/calendarAdapter');
const { buildBaziProfile } = require('../code/utils/mock');

function testLunarPreviewConvertsVerifiedLeapMonth() {
  const calendar = resolveCalendar({
    calendarType: 'lunar',
    lunarYear: 2025,
    lunarMonth: 6,
    lunarDay: 1,
    isLeapMonth: true,
    birthTime: '09:00'
  });

  assert.strictEqual(calendar.birthDate, '2025-07-25');
  assert.strictEqual(calendar.conversion.solarDate, '2025-07-25');
  assert.strictEqual(calendar.conversion.dataPackId, 'lunar-data-pack-2025-candidate');
  assert.strictEqual(calendar.conversion.dataPackStatus, 'candidate-not-runtime-approved');
  assert.strictEqual(calendar.conversion.completeLunarCalendar, false);
  assert.strictEqual(calendar.warnings[0].code, 'LUNAR_DATA_PACK_PREVIEW_ONLY');
}

function testLunarPreviewAcceptsChinesePickerLabels() {
  const calendar = resolveCalendar({
    calendarType: '农历',
    lunarYear: '2025',
    lunarMonth: '闰六月',
    lunarDay: '初一',
    birthTime: '09:00'
  });

  assert.strictEqual(calendar.birthDate, '2025-07-25');
  assert.strictEqual(calendar.conversion.lunarYear, 2025);
  assert.strictEqual(calendar.conversion.lunarMonth, 6);
  assert.strictEqual(calendar.conversion.lunarDay, 1);
  assert.strictEqual(calendar.conversion.isLeapMonth, true);
}

function testLunarPreviewAcceptsChineseDateText() {
  const calendar = resolveCalendar({
    calendarType: '农历',
    lunarDateText: '2025年 闰六月 初一',
    birthTime: '09:00'
  });

  assert.strictEqual(calendar.birthDate, '2025-07-25');
  assert.strictEqual(calendar.conversion.lunarYear, 2025);
  assert.strictEqual(calendar.conversion.lunarMonth, 6);
  assert.strictEqual(calendar.conversion.lunarDay, 1);
  assert.strictEqual(calendar.conversion.isLeapMonth, true);
}

function testLunarPreviewAcceptsCommonChineseDayNames() {
  const leapMonthEnd = resolveCalendar({
    calendarType: '农历',
    lunarDateText: '2025年 闰六月 廿九',
    birthTime: '09:00'
  });
  const regularDay = resolveCalendar({
    calendarType: '农历',
    lunarYear: '2025',
    lunarMonth: '六月',
    lunarDay: '十一',
    birthTime: '09:00'
  });

  assert.strictEqual(leapMonthEnd.birthDate, '2025-08-22');
  assert.strictEqual(leapMonthEnd.conversion.lunarDay, 29);
  assert.strictEqual(leapMonthEnd.conversion.isLeapMonth, true);
  assert.strictEqual(regularDay.conversion.lunarMonth, 6);
  assert.strictEqual(regularDay.conversion.lunarDay, 11);
  assert.strictEqual(regularDay.conversion.isLeapMonth, false);
}

function testBaziProfileUsesConvertedSolarDate() {
  const result = buildBaziProfile({
    name: '2025 闰六月预览',
    gender: '男',
    calendarType: 'lunar',
    lunarYear: 2025,
    lunarMonth: 6,
    lunarDay: 1,
    isLeapMonth: true,
    birthTime: '09:00',
    birthPlace: '北京',
    longitude: '116.40',
    useTrueSolarTime: false
  });

  assert.strictEqual(result.calendarConversion.solarDate, '2025-07-25');
  assert.strictEqual(result.solarTime.startsWith('2025-07-25 09:00'), true);
  assert.strictEqual(result.calendarConversion.dataPackStatus, 'candidate-not-runtime-approved');
  assert.strictEqual(result.normalizationWarnings[0].code, 'LUNAR_DATA_PACK_PREVIEW_ONLY');
}

function testOutsideCandidateCoverageStillFailsClosed() {
  assert.throws(
    () => resolveCalendar({
      calendarType: 'lunar',
      lunarYear: 2026,
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: false
    }),
    (error) => (
      error.code === 'LUNAR_DATE_OUTSIDE_DATA_PACK_COVERAGE'
      && error.details.availableYears.includes(2025)
      && !error.details.completeLunarCalendar
    )
  );
}

testLunarPreviewConvertsVerifiedLeapMonth();
testLunarPreviewAcceptsChinesePickerLabels();
testLunarPreviewAcceptsChineseDateText();
testLunarPreviewAcceptsCommonChineseDayNames();
testBaziProfileUsesConvertedSolarDate();
testOutsideCandidateCoverageStillFailsClosed();
console.log('PASS lunar preview 2025 candidate data-pack');
