const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildBaziProfile } = require('../code/utils/mock');

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
    title: '农历生日转换后公历',
    input: {
      name: 'BZI-005',
      gender: '女',
      birthDate: '2023-09-29',
      birthTime: '20:00',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expected: ['癸卯', '辛酉', '庚寅', '丙戌'],
    note: '当前脚本先用已确认的对应公历校验四柱，农历输入转换另行补测。'
  },
  {
    id: 'BZI-006',
    title: '农历闰月转换后公历',
    input: {
      name: 'BZI-006',
      gender: '男',
      birthDate: '2023-03-31',
      birthTime: '09:00',
      birthPlace: '北京',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    expected: ['癸卯', '乙卯', '戊子', '丁巳'],
    note: '当前脚本先用已确认的对应公历校验四柱，农历闰月输入转换另行补测。'
  }
];

function extractPillars(result) {
  return result.pillars.map((pillar) => pillar.value);
}

function run() {
  const results = acceptanceCases.map((item) => {
    const result = buildBaziProfile(item.input);
    const actual = extractPillars(result);
    const passed = actual.join('|') === item.expected.join('|');
    return {
      id: item.id,
      title: item.title,
      expected: item.expected,
      actual,
      passed,
      note: item.note || ''
    };
  });

  results.forEach((item) => {
    const mark = item.passed ? 'PASS' : 'FAIL';
    console.log(`${mark} ${item.id} ${item.title}`);
    console.log(`  expected: ${item.expected.join(' ')}`);
    console.log(`  actual:   ${item.actual.join(' ')}`);
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
