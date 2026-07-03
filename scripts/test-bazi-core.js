const assert = require('assert');
const {
  buildBaziChart,
  getBoundaryDiagnostics
} = require('../code/utils/bazi/coreEngine');

const termsData = {
  2024: { 立春: '2024-02-04T16:27:00.000Z' },
  2025: {
    立春: '2025-02-03T14:10:00.000Z',
    惊蛰: '2025-03-05T16:07:00.000Z'
  },
  2026: {
    立春: '2026-02-04T09:49:00.000Z',
    惊蛰: '2026-03-05T10:00:00.000Z',
    清明: '2026-04-04T20:00:00.000Z'
  },
  1988: {
    立春: '1988-02-04T10:00:00.000Z',
    惊蛰: '1988-03-05T10:00:00.000Z',
    清明: '1988-04-04T10:00:00.000Z'
  }
};

function testYearBoundary() {
  const before = buildBaziChart({
    birthDate: '2024-02-04',
    birthTime: '16:26',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false });
  const after = buildBaziChart({
    birthDate: '2024-02-04',
    birthTime: '16:27',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false });
  assert.strictEqual(before.pillars.year.stem, '癸');
  assert.strictEqual(before.pillars.year.branch, '卯');
  assert.strictEqual(after.pillars.year.stem, '甲');
  assert.strictEqual(after.pillars.year.branch, '辰');
}

function testMonthBoundary() {
  const before = buildBaziChart({
    birthDate: '2025-03-05',
    birthTime: '15:23',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false });
  const after = buildBaziChart({
    birthDate: '2025-03-05',
    birthTime: '16:07',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false });
  assert.strictEqual(before.pillars.month.branch, '寅');
  assert.strictEqual(after.pillars.month.branch, '卯');
}

function testDaySwitch() {
  const beforeBoundary = buildBaziChart({
    birthDate: '2026-06-15',
    birthTime: '22:59',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false, useEarlyLateZi: false });
  const defaultMode = buildBaziChart({
    birthDate: '2026-06-15',
    birthTime: '23:59',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false, useEarlyLateZi: false });
  const earlyLate = buildBaziChart({
    birthDate: '2026-06-15',
    birthTime: '23:30',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false, useEarlyLateZi: true });
  assert.notStrictEqual(beforeBoundary.pillars.day.stem + beforeBoundary.pillars.day.branch, defaultMode.pillars.day.stem + defaultMode.pillars.day.branch);
  assert.strictEqual(beforeBoundary.pillars.day.stem + beforeBoundary.pillars.day.branch, earlyLate.pillars.day.stem + earlyLate.pillars.day.branch);
  assert.strictEqual(earlyLate.ziHourLabel, '夜子');
}

function testTrueSolarTime() {
  const result = buildBaziChart({
    birthDate: '2026-07-01',
    birthTime: '12:00',
    longitude: '87.00'
  }, { termsData, useTrueSolarTime: true });
  const hour = new Date(result.adjustedDateTime).getUTCHours();
  assert.ok(hour >= 9 && hour <= 10, 'true solar time should move clock time earlier');
}

function testLeapMonthIgnored() {
  const a = buildBaziChart({
    birthDate: '2026-04-10',
    birthTime: '08:00',
    longitude: '120.00',
    lunarMonth: 2,
    isLeapMonth: true
  }, { termsData, useTrueSolarTime: false });
  const b = buildBaziChart({
    birthDate: '2026-04-10',
    birthTime: '08:00',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false });
  assert.deepStrictEqual(a.pillars.month, b.pillars.month);
}

function testSummerTime() {
  const result = buildBaziChart({
    birthDate: '1988-06-01',
    birthTime: '08:00',
    longitude: '120.00'
  }, { termsData, useTrueSolarTime: false });
  const shifted = new Date(result.adjustedDateTime).getUTCHours();
  assert.strictEqual(shifted, 7);
}

[
  testYearBoundary,
  testMonthBoundary,
  testDaySwitch,
  testTrueSolarTime,
  testLeapMonthIgnored,
  testSummerTime
].forEach((testFn) => testFn());

console.log('All bazi core tests passed.');
console.log(JSON.stringify(getBoundaryDiagnostics({
  birthDate: '2024-02-04',
  birthTime: '16:26',
  longitude: '120.00'
}, { termsData, useTrueSolarTime: false }), null, 2));
