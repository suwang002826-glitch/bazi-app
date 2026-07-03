const assert = require('assert');
const { buildBaziChart } = require('../code/utils/bazi/coreEngine');

function pillarText(pillar) {
  return `${pillar.stem}${pillar.branch}`;
}

function assertPillars(chart, expected) {
  assert.deepStrictEqual(
    {
      year: pillarText(chart.pillars.year),
      month: pillarText(chart.pillars.month),
      day: pillarText(chart.pillars.day),
      hour: pillarText(chart.pillars.hour)
    },
    expected
  );
}

function assertDaYun(chart, expected) {
  assert.ok(chart.daYun, 'expected daYun to be present');
  assert.strictEqual(chart.daYun.direction, expected.direction);
  assert.strictEqual(chart.daYun.startAge, expected.startAge);
  assert.strictEqual(chart.daYun.startMonth, expected.startMonth);
  assert.strictEqual(chart.daYun.startDay, expected.startDay);
  assert.strictEqual(chart.daYun.startDate, expected.startDate);
  assert.strictEqual(chart.daYun.list.length, 8);

  const first = chart.daYun.list[0];
  assert.strictEqual(first.ganZhi, expected.first.ganZhi);
  assert.strictEqual(first.startYear, expected.first.startYear);
  assert.strictEqual(first.endYear, expected.first.endYear);
  assert.strictEqual(first.tenGod, expected.first.tenGod);
}

const maleChart = buildBaziChart({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  gender: '\u7537',
  longitude: 120
});

assertPillars(maleChart, {
  year: '\u5e9a\u8fb0',
  month: '\u620a\u5b50',
  day: '\u5df1\u9149',
  hour: '\u5df1\u5df3'
});
assertDaYun(maleChart, {
  direction: '\u987a',
  startAge: 6,
  startMonth: 4,
  startDay: 20,
  startDate: '2007-05-07',
  first: {
    ganZhi: '\u5df1\u4e11',
    startYear: 2007,
    endYear: 2016,
    tenGod: '\u6bd4\u80a9'
  }
});

const femaleChart = buildBaziChart({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  gender: '\u5973',
  longitude: 120
});

assertPillars(femaleChart, {
  year: '\u5e9a\u8fb0',
  month: '\u620a\u5b50',
  day: '\u5df1\u9149',
  hour: '\u5df1\u5df3'
});
assertDaYun(femaleChart, {
  direction: '\u9006',
  startAge: 3,
  startMonth: 5,
  startDay: 0,
  startDate: '2004-05-17',
  first: {
    ganZhi: '\u4e01\u4ea5',
    startYear: 2004,
    endYear: 2013,
    tenGod: '\u504f\u5370'
  }
});

const ziHourChart = buildBaziChart({
  birthDate: '1990-01-01',
  birthTime: '00:00:00',
  gender: 'male',
  longitude: 120
});

assertPillars(ziHourChart, {
  year: '\u5df1\u5df3',
  month: '\u4e19\u5b50',
  day: '\u4e19\u5bc5',
  hour: '\u620a\u5b50'
});
assertDaYun(ziHourChart, {
  direction: '\u9006',
  startAge: 8,
  startMonth: 2,
  startDay: 0,
  startDate: '1998-03-01',
  first: {
    ganZhi: '\u4e59\u4ea5',
    startYear: 1998,
    endYear: 2007,
    tenGod: '\u6b63\u5370'
  }
});

const numericFemaleChart = buildBaziChart({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  gender: 0,
  longitude: 120
});
assert.strictEqual(numericFemaleChart.daYun.direction, '\u9006');

const missingGenderChart = buildBaziChart({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  longitude: 120
});
assert.strictEqual(missingGenderChart.daYun, null);

console.log('dayun tests passed');
