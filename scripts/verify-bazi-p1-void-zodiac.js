const path = require('path');
const assert = require('assert');

const { buildReadingFromForm } = require(path.join(__dirname, '../code/utils/bazi/pageAdapter.js'));
const preciseSolarTerms = require(path.join(__dirname, '../code/data-packs/solar-terms/solarTerms-precise-2025.json'));

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];

const cases = [
  {
    id: 1,
    title: '2025-02-03 21:10（立春前）',
    input: {
      name: 'case-1',
      birthDate: '2025-02-03',
      birthTime: '21:10',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['甲辰', '丁丑', '癸卯', '癸亥'],
    expectedZodiac: '龙'
  },
  {
    id: 2,
    title: '2025-02-03 23:10（立春后）',
    input: {
      name: 'case-2',
      birthDate: '2025-02-03',
      birthTime: '23:10',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '戊寅', '甲辰', '甲子'],
    expectedZodiac: '蛇'
  },
  {
    id: 3,
    title: '2025-03-05 08:00',
    input: {
      name: 'case-3',
      birthDate: '2025-03-05',
      birthTime: '08:00',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '戊寅', '癸酉', '丙辰'],
    expectedZodiac: '蛇'
  },
  {
    id: 4,
    title: '2025-03-05 10:00（惊蛰后）',
    input: {
      name: 'case-4',
      birthDate: '2025-03-05',
      birthTime: '10:00',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '戊寅', '癸酉', '丁巳'],
    expectedZodiac: '蛇'
  },
  {
    id: 5,
    title: '2025-06-01 22:59（夏令）',
    input: {
      name: 'case-5',
      birthDate: '2025-06-01',
      birthTime: '22:59',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '辛巳', '辛丑', '己亥'],
    expectedZodiac: '蛇'
  },
  {
    id: 6,
    title: '2025-06-01 23:01（夏令）',
    input: {
      name: 'case-6',
      birthDate: '2025-06-01',
      birthTime: '23:01',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '辛巳', '壬寅', '庚子'],
    expectedZodiac: '蛇'
  },
  {
    id: 7,
    title: '2025-06-01 20:00（乌鲁木齐，真太阳时）',
    input: {
      name: 'case-7',
      birthDate: '2025-06-01',
      birthTime: '20:00',
      longitude: '87.60',
      latitude: '43.82',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: true,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '辛巳', '辛丑', '丁酉'],
    expectedZodiac: '蛇'
  },
  {
    id: 8,
    title: '1988-07-15 02:30',
    input: {
      name: 'case-8',
      birthDate: '1988-07-15',
      birthTime: '02:30',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['戊辰', '己未', '辛未', '己丑'],
    expectedZodiac: '龙'
  },
  {
    id: 9,
    title: '惊蛰边界前（2025-03-05 16:00）',
    input: {
      name: 'case-9',
      birthDate: '2025-03-05',
      birthTime: '16:00',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '戊寅', '癸酉', '庚申'],
    expectedZodiac: '蛇'
  },
  {
    id: 10,
    title: '惊蛰边界后（2025-03-05 16:10）',
    input: {
      name: 'case-10',
      birthDate: '2025-03-05',
      birthTime: '16:10',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      isLeapMonth: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '己卯', '癸酉', '庚申'],
    expectedZodiac: '蛇'
  }
];

const earlyLateZiCases = [
  {
    id: '早晚子-关',
    input: {
      name: 'case-zi-off',
      birthDate: '2025-06-01',
      birthTime: '23:30',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      useTrueSolarTime: false,
      useEarlyLateZi: false
    },
    expectedPillars: ['乙巳', '辛巳', '壬寅', '庚子']
  },
  {
    id: '早晚子-开',
    input: {
      name: 'case-zi-on',
      birthDate: '2025-06-01',
      birthTime: '23:30',
      longitude: '116.40',
      latitude: '39.90',
      isLunar: false,
      useTrueSolarTime: false,
      useEarlyLateZi: true
    },
    expectedPillars: ['乙巳', '辛巳', '辛丑', '戊子']
  }
];

function assertPillars(caseItem, result) {
  const actual = [
    result.pillarsP0.year.fullStemBranch,
    result.pillarsP0.month.fullStemBranch,
    result.pillarsP0.day.fullStemBranch,
    result.pillarsP0.hour.fullStemBranch
  ];

  assert.deepStrictEqual(actual, caseItem.expectedPillars, `${caseItem.title}: 四柱不一致`);
  assert.ok(result.pillarsP0.year.voidText);
  assert.ok(result.pillarsP0.month.voidText);
  assert.ok(result.pillarsP0.day.voidText);
  assert.ok(result.pillarsP0.hour.voidText);
  if (caseItem.expectedZodiac) {
    assert.strictEqual(result.detailProfile.zodiac, caseItem.expectedZodiac, `${caseItem.title}: 生肖不一致`);
  }
}

function runPillarsCase(caseItem) {
  const result = buildReadingFromForm(
    {
      ...caseItem.input,
      termsData: preciseSolarTerms
    },
    {
      ...caseItem.input,
      termsData: preciseSolarTerms
    }
  );

  const actual = [
    result.pillarsP0.year.fullStemBranch,
    result.pillarsP0.month.fullStemBranch,
    result.pillarsP0.day.fullStemBranch,
    result.pillarsP0.hour.fullStemBranch
  ];

  let passed = false;
  try {
    assertPillars(caseItem, result);
    passed = true;
  } catch (error) {
    passed = false;
  }

  const details = [
    { label: PILLAR_LABELS[0], pillar: result.pillarsP0.year },
    { label: PILLAR_LABELS[1], pillar: result.pillarsP0.month },
    { label: PILLAR_LABELS[2], pillar: result.pillarsP0.day },
    { label: PILLAR_LABELS[3], pillar: result.pillarsP0.hour }
  ].map((item) => `${item.label}${item.pillar.fullStemBranch}[空${item.pillar.voidText}]`);

  return {
    id: caseItem.id,
    title: caseItem.title,
    expected: caseItem.expectedPillars.join(' '),
    actual: actual.join(' '),
    zodiac: result.detailProfile.zodiac,
    detail: details.join(' | '),
    passed
  };
}

const outputs = [
  ...cases.map(runPillarsCase),
  ...earlyLateZiCases.map(runPillarsCase)
];

outputs.forEach((item) => {
  console.log(`\n[${item.id}] ${item.title}`);
  console.log(`结果: ${item.passed ? 'PASS' : 'FAIL'}`);
  console.log(`四柱预期: ${item.expected}`);
  console.log(`四柱实际: ${item.actual}`);
  console.log(`生肖: ${item.zodiac}`);
  console.log(`空亡: ${item.detail}`);
});

const failed = outputs.filter((item) => !item.passed);
console.log('\n========== 测试汇总 ==========',);
if (failed.length === 0) {
  console.log('全部通过');
} else {
  console.log(`失败: ${failed.length}`);
  failed.forEach((item) => {
    console.log(` - ${item.id} 预期 ${item.expected}，实际 ${item.actual}`);
  });
}
