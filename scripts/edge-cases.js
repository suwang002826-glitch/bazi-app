const preciseSolarTerms = require('../code/data-packs/solar-terms/solarTerms-precise-1900-2100.json');

const EDGE_CASES = [
  // 年柱/月柱：节气边界前后
  {
    case_id: 1,
    scene: '节气边界-立春前(1988-02-04 21:59:59)',
    category: 'solar-term-year',
    input: {
      solar_time: '1988-02-04 21:59:59',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '丁卯', month: '癸丑', day: '己丑', hour: '乙亥' }
  },
  {
    case_id: 2,
    scene: '节气边界-立春后(1988-02-04 22:43:00)',
    category: 'solar-term-year',
    input: {
      solar_time: '1988-02-04 22:43:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '戊辰', month: '甲寅', day: '己丑', hour: '乙亥' }
  },
  {
    case_id: 3,
    scene: '节气边界-立春后(1988-02-04 22:42:59)',
    category: 'solar-term-year',
    input: {
      solar_time: '1988-02-04 22:42:59',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '戊辰', month: '甲寅', day: '己丑', hour: '乙亥' }
  },
  {
    case_id: 4,
    scene: '节气边界-惊蛰前(1990-03-06 04:19:16)',
    category: 'solar-term-month',
    input: {
      solar_time: '1990-03-06 04:19:16',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '庚午', month: '戊寅', day: '庚午', hour: '戊寅' }
  },
  {
    case_id: 5,
    scene: '节气边界-惊蛰后(1990-03-06 04:19:18)',
    category: 'solar-term-month',
    input: {
      solar_time: '1990-03-06 04:19:18',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '庚午', month: '己卯', day: '庚午', hour: '戊寅' }
  },
  {
    case_id: 6,
    scene: '节气边界-小寒前(2025-01-05 10:32:30)',
    category: 'solar-term-month',
    input: {
      solar_time: '2025-01-05 10:32:30',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '甲辰', month: '丙子', day: '甲戌', hour: '己巳' }
  },
  {
    case_id: 7,
    scene: '节气边界-小寒后(2025-01-05 10:32:31)',
    category: 'solar-term-month',
    input: {
      solar_time: '2025-01-05 10:32:31',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '甲辰', month: '丁丑', day: '甲戌', hour: '己巳' }
  },
  {
    case_id: 8,
    scene: '节气边界-立春前(2025-02-03 22:10:12)',
    category: 'solar-term-year',
    input: {
      solar_time: '2025-02-03 22:10:12',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '甲辰', month: '丁丑', day: '癸卯', hour: '癸亥' }
  },
  {
    case_id: 9,
    scene: '节气边界-立春后(2025-02-03 22:10:13)',
    category: 'solar-term-year',
    input: {
      solar_time: '2025-02-03 22:10:13',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '戊寅', day: '癸卯', hour: '癸亥' }
  },
  {
    case_id: 10,
    scene: '节气边界-惊蛰前(2025-03-05 16:06:59)',
    category: 'solar-term-month',
    input: {
      solar_time: '2025-03-05 16:06:59',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '戊寅', day: '癸酉', hour: '庚申' }
  },
  {
    case_id: 11,
    scene: '节气边界-惊蛰后(2025-03-05 16:07:02)',
    category: 'solar-term-month',
    input: {
      solar_time: '2025-03-05 16:07:02',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '己卯', day: '癸酉', hour: '庚申' }
  },

  // 日柱/时柱：23:00、00:00、早晚子时
  {
    case_id: 12,
    scene: '日时边界-23:00前(2025-07-03 22:59:59)',
    category: 'day-hour',
    input: {
      solar_time: '2025-07-03 22:59:59',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '壬午', day: '癸酉', hour: '癸亥' }
  },
  {
    case_id: 13,
    scene: '日时边界-23:00后(2025-07-03 23:00:00)',
    category: 'day-hour',
    input: {
      solar_time: '2025-07-03 23:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '壬午', day: '甲戌', hour: '甲子' }
  },
  {
    case_id: 14,
    scene: '日时边界-23:30 早晚子关',
    category: 'day-hour',
    input: {
      solar_time: '2025-07-03 23:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '壬午', day: '甲戌', hour: '甲子' }
  },
  {
    case_id: 15,
    scene: '日时边界-23:30 早晚子开',
    category: 'day-hour',
    input: {
      solar_time: '2025-07-03 23:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: true
    },
    expect: { year: '乙巳', month: '壬午', day: '癸酉', hour: '甲子' }
  },
  {
    case_id: 16,
    scene: '日时边界-00:00(2025-07-04 00:00:00)',
    category: 'day-hour',
    input: {
      solar_time: '2025-07-04 00:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '壬午', day: '甲戌', hour: '甲子' }
  },
  {
    case_id: 17,
    scene: '日时边界-00:30 早晚子关',
    category: 'day-hour',
    input: {
      solar_time: '2025-07-04 00:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '壬午', day: '甲戌', hour: '甲子' }
  },
  {
    case_id: 18,
    scene: '日时边界-00:30 早晚子开',
    category: 'day-hour',
    input: {
      solar_time: '2025-07-04 00:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: true
    },
    expect: { year: '乙巳', month: '壬午', day: '乙亥', hour: '丙子' }
  },
  {
    case_id: 19,
    scene: '日时边界-00:00 早晚子关',
    category: 'day-hour',
    input: {
      solar_time: '1990-01-01 00:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '己巳', month: '丙子', day: '丙寅', hour: '戊子' }
  },
  {
    case_id: 20,
    scene: '日时边界-00:00 早晚子开',
    category: 'day-hour',
    input: {
      solar_time: '1990-01-01 00:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: true
    },
    expect: { year: '己巳', month: '丙子', day: '丁卯', hour: '庚子' }
  },
  {
    case_id: 21,
    scene: '日时边界-23:00 早晚子关',
    category: 'day-hour',
    input: {
      solar_time: '1990-01-01 23:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '己巳', month: '丙子', day: '丁卯', hour: '庚子' }
  },
  {
    case_id: 22,
    scene: '日时边界-23:00 早晚子开',
    category: 'day-hour',
    input: {
      solar_time: '1990-01-01 23:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false,
      use_early_late_zi: true
    },
    expect: { year: '己巳', month: '丙子', day: '丙寅', hour: '庚子' }
  },

  // 夏令时：按规则前后
  {
    case_id: 23,
    scene: '夏令时边界-开始期(1987-04-12 01:30)',
    category: 'summer-time',
    input: {
      solar_time: '1987-04-12 01:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '丁卯', month: '甲辰', day: '辛卯', hour: '己丑' }
  },
  {
    case_id: 24,
    scene: '夏令时边界-结束期(1987-09-13 01:30)',
    category: 'summer-time',
    input: {
      solar_time: '1987-09-13 01:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '丁卯', month: '己酉', day: '乙丑', hour: '丁丑' }
  },
  {
    case_id: 25,
    scene: '夏令时边界-结束前1小时(1987-09-12 23:00)',
    category: 'summer-time',
    input: {
      solar_time: '1987-09-12 23:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '丁卯', month: '己酉', day: '甲子', hour: '乙亥' }
  },
  {
    case_id: 26,
    scene: '夏令时边界-结束当天2点(1986-09-13 02:00)',
    category: 'summer-time',
    input: {
      solar_time: '1986-09-13 02:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false,
      use_early_late_zi: false
    },
    expect: { year: '丙寅', month: '丁酉', day: '庚申', hour: '丁丑' }
  },

  // 真太阳时：经纬度修正边界
  {
    case_id: 27,
    scene: '真太阳时-乌鲁木齐(1988-87.6°)',
    category: 'true-solar',
    input: {
      solar_time: '1990-01-01 12:00:00',
      longitude: 87.6,
      latitude: 43.8,
      use_dst: false,
      use_true_solar: true,
      use_early_late_zi: false
    },
    expect: { year: '己巳', month: '丙子', day: '丙寅', hour: '癸巳' }
  },
  {
    case_id: 28,
    scene: '真太阳时-东经126.6°',
    category: 'true-solar',
    input: {
      solar_time: '1990-01-01 12:00:00',
      longitude: 126.6,
      latitude: 45.7,
      use_dst: false,
      use_true_solar: true,
      use_early_late_zi: false
    },
    expect: { year: '己巳', month: '丙子', day: '丙寅', hour: '甲午' }
  },
  {
    case_id: 29,
    scene: '真太阳时-跨日边界样本1',
    category: 'true-solar',
    input: {
      solar_time: '2025-07-03 12:00:00',
      longitude: 87.6,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: true,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '壬午', day: '癸酉', hour: '丁巳' }
  },
  {
    case_id: 30,
    scene: '真太阳时-跨日边界样本2',
    category: 'true-solar',
    input: {
      solar_time: '2025-07-03 12:00:00',
      longitude: 126.6,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: true,
      use_early_late_zi: false
    },
    expect: { year: '乙巳', month: '壬午', day: '癸酉', hour: '戊午' }
  }
];

const sharedDefaultOptions = {
  name: 'edge-case',
  gender: '男',
  isLunar: false,
  isLeapMonth: false,
  use_dst: false,
  use_true_solar: false,
  use_early_late_zi: false,
  termsData: preciseSolarTerms
};

module.exports = {
  EDGE_CASES,
  cases: EDGE_CASES,
  sharedDefaultOptions
};
