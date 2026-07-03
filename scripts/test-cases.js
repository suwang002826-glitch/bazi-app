const preciseSolarTerms = require('../code/data-packs/solar-terms/solarTerms-precise-1900-2100.json');

const TEST_CASES = [
  {
    case_id: 1,
    scene: '普通平日期/无边界',
    input: {
      solar_time: '1990-01-01 12:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '己巳', month: '丙子', day: '丙寅', hour: '甲午' }
  },
  {
    case_id: 2,
    scene: '夜子时跨日（23点后换日）',
    input: {
      solar_time: '1990-01-01 23:05:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '己巳', month: '丙子', day: '丁卯', hour: '庚子' }
  },
  {
    case_id: 3,
    scene: '早子时（0点后）',
    input: {
      solar_time: '1990-01-02 00:10:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '己巳', month: '丙子', day: '丁卯', hour: '庚子' }
  },
  {
    case_id: 4,
    scene: '立春交节前（1988年立春22:43）',
    input: {
      solar_time: '1988-02-04 21:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '丁卯', month: '癸丑', day: '己丑', hour: '乙亥' }
  },
  {
    case_id: 5,
    scene: '立春交节后',
    input: {
      solar_time: '1988-02-04 23:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '戊辰', month: '甲寅', day: '庚寅', hour: '丙子' }
  },
  {
    case_id: 6,
    scene: '惊蛰交节前（1990年惊蛰04:20）',
    input: {
      solar_time: '1990-03-06 03:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '庚午', month: '戊寅', day: '庚午', hour: '戊寅' }
  },
  {
    case_id: 7,
    scene: '惊蛰交节后',
    input: {
      solar_time: '1990-03-06 05:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '庚午', month: '己卯', day: '庚午', hour: '己卯' }
  },
  {
    case_id: 8,
    scene: '夏令时开始当天（1987年4月12日02:00开始）',
    input: {
      solar_time: '1987-04-12 01:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false
    },
    expect: { year: '丁卯', month: '甲辰', day: '辛卯', hour: '己丑' }
  },
  {
    case_id: 9,
    scene: '夏令时结束当天（1987年9月13日02:00结束）',
    input: {
      solar_time: '1987-09-13 01:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false
    },
    expect: { year: '丁卯', month: '己酉', day: '乙丑', hour: '丁丑' }
  },
  {
    case_id: 10,
    scene: '乌鲁木齐真太阳时（东经87.6°，时差-2h10m）',
    input: {
      solar_time: '1990-01-01 12:00:00',
      longitude: 87.6,
      latitude: 43.8,
      use_dst: false,
      use_true_solar: true
    },
    expect: { year: '己巳', month: '丙子', day: '丙寅', hour: '癸巳' }
  },
  {
    case_id: 11,
    scene: '哈尔滨真太阳时（东经126.6°，时差+26m）',
    input: {
      solar_time: '1990-01-01 12:00:00',
      longitude: 126.6,
      latitude: 45.7,
      use_dst: false,
      use_true_solar: true
    },
    expect: { year: '己巳', month: '丙子', day: '丙寅', hour: '甲午' }
  },
  // 1950-2010年普通日期全时辰覆盖用例（共19个，覆盖0-23点所有时辰）
  {
    case_id: 12,
    scene: '1955年普通日期/早子时',
    input: {
      solar_time: '1955-03-15 00:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '乙未', month: '己卯', day: '乙亥', hour: '丙子' }
  },
  {
    case_id: 13,
    scene: '1962年普通日期/丑时',
    input: {
      solar_time: '1962-05-20 01:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '壬寅', month: '乙巳', day: '戊午', hour: '癸丑' }
  },
  {
    case_id: 14,
    scene: '1970年普通日期/寅时',
    input: {
      solar_time: '1970-07-08 03:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '庚戌', month: '癸未', day: '己丑', hour: '丙寅' }
  },
  {
    case_id: 15,
    scene: '1983年普通日期/卯时',
    input: {
      solar_time: '1983-09-12 05:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '癸亥', month: '辛酉', day: '癸卯', hour: '乙卯' }
  },
  {
    case_id: 16,
    scene: '1995年普通日期/辰时',
    input: {
      solar_time: '1995-11-25 07:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '乙亥', month: '丁亥', day: '庚申', hour: '庚辰' }
  },
  {
    case_id: 17,
    scene: '2005年普通日期/巳时',
    input: {
      solar_time: '2005-02-18 09:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '乙酉', month: '戊寅', day: '癸酉', hour: '丁巳' }
  },
  {
    case_id: 18,
    scene: '1958年普通日期/午时',
    input: {
      solar_time: '1958-04-07 11:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '戊戌', month: '丙辰', day: '甲寅', hour: '庚午' }
  },
  {
    case_id: 19,
    scene: '1968年普通日期/未时',
    input: {
      solar_time: '1968-06-22 13:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '戊申', month: '戊午', day: '癸亥', hour: '己未' }
  },
  {
    case_id: 20,
    scene: '1978年普通日期/申时',
    input: {
      solar_time: '1978-08-16 15:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '戊午', month: '庚申', day: '庚戌', hour: '甲申' }
  },
  {
    case_id: 21,
    scene: '1988年普通日期/酉时',
    input: {
      solar_time: '1988-10-09 17:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '戊辰', month: '壬戌', day: '丁酉', hour: '己酉' }
  },
  {
    case_id: 22,
    scene: '1998年普通日期/戌时',
    input: {
      solar_time: '1998-12-03 19:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '戊寅', month: '癸亥', day: '甲申', hour: '甲戌' }
  },
  {
    case_id: 23,
    scene: '2008年普通日期/亥时',
    input: {
      solar_time: '2008-01-25 21:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '丁亥', month: '癸丑', day: '甲子', hour: '乙亥' }
  },
  {
    case_id: 24,
    scene: '1952年普通日期/夜子时',
    input: {
      solar_time: '1952-08-03 23:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '壬辰', month: '丁未', day: '壬午', hour: '庚子' }
  },
  {
    case_id: 25,
    scene: '1965年国庆/丑时边界',
    input: {
      solar_time: '1965-10-01 01:05:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '乙巳', month: '乙酉', day: '戊子', hour: '癸丑' }
  },
  {
    case_id: 26,
    scene: '1975年普通日期/卯时边界',
    input: {
      solar_time: '1975-12-12 05:10:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '乙卯', month: '戊子', day: '壬辰', hour: '癸卯' }
  },
  {
    case_id: 27,
    scene: '1985年普通日期/巳时边界',
    input: {
      solar_time: '1985-07-25 09:15:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '乙丑', month: '癸未', day: '乙丑', hour: '辛巳' }
  },
  {
    case_id: 28,
    scene: '1990年普通日期/未时边界(夏令时当天不启用)',
    input: {
      solar_time: '1990-04-15 13:20:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '庚午', month: '庚辰', day: '庚戌', hour: '癸未' }
  },
  {
    case_id: 29,
    scene: '2000年普通日期/酉时边界',
    input: {
      solar_time: '2000-06-10 17:25:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '庚辰', month: '壬午', day: '己亥', hour: '癸酉' }
  },
  {
    case_id: 30,
    scene: '2010年普通日期/亥时边界',
    input: {
      solar_time: '2010-09-09 21:05:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '庚寅', month: '乙酉', day: '壬戌', hour: '辛亥' }
  },
  {
    case_id: 31,
    scene: '立春正点精确到秒（1988-02-04 22:43:00，刚交节）',
    input: {
      solar_time: '1988-02-04 22:43:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '戊辰', month: '甲寅', day: '己丑', hour: '乙亥' }
  },
  {
    case_id: 32,
    scene: '惊蛰正点精确到秒（1990-03-06 04:20:00，刚交节）',
    input: {
      solar_time: '1990-03-06 04:20:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '庚午', month: '己卯', day: '庚午', hour: '戊寅' }
  },
  {
    case_id: 33,
    scene: '23点整夜子时正点（1990-01-01 23:00:00，刚换日）',
    input: {
      solar_time: '1990-01-01 23:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '己巳', month: '丙子', day: '丁卯', hour: '庚子' }
  },
  {
    case_id: 34,
    scene: '0点整早子时正点（1990-01-02 00:00:00，早子时边界）',
    input: {
      solar_time: '1990-01-02 00:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '己巳', month: '丙子', day: '丁卯', hour: '庚子' }
  },
  {
    case_id: 35,
    scene: '1986年夏令时开始正点（1986-05-04 02:00:00，夏令时生效首秒）',
    input: {
      solar_time: '1986-05-04 02:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false
    },
    expect: { year: '丙寅', month: '壬辰', day: '戊申', hour: '癸丑' }
  },
  {
    case_id: 36,
    scene: '1986年夏令时结束正点（1986-09-14 02:00:00，夏令时结束首秒）',
    input: {
      solar_time: '1986-09-14 02:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false
    },
    expect: { year: '丙寅', month: '丁酉', day: '辛酉', hour: '己丑' }
  },
  {
    case_id: 37,
    scene: '2025年小寒正点（2025-01-05 10:32:31，刚交节换月）',
    input: {
      solar_time: '2025-01-05 10:32:31',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: '甲辰', month: '丁丑', day: '甲戌', hour: '己巳' }
  },
  {
    case_id: 38,
    scene: '真太阳时跨时辰边界（乌鲁木齐87.6°，1990-01-01 14:05:00）',
    input: {
      solar_time: '1990-01-01 14:05:00',
      longitude: 87.6,
      latitude: 43.8,
      use_dst: false,
      use_true_solar: true
    },
    expect: { year: '己巳', month: '丙子', day: '丙寅', hour: '甲午' }
  }
];

const sharedDefaultOptions = {
  name: '问真锁定基线',
  gender: '男',
  isLunar: false,
  isLeapMonth: false,
  use_dst: false,
  use_true_solar: false,
  use_early_late_zi: false,
  termsData: preciseSolarTerms
};

module.exports = {
  TEST_CASES,
  cases: TEST_CASES,
  sharedDefaultOptions
};
