const preciseSolarTerms = require('../code/data-packs/solar-terms/solarTerms-precise-1900-2100.json');

const TEST_CASES = [
  {
    case_id: 1,
    scene: 'case-1',
    input: {
      solar_time: '1990-01-01 12:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" }
  },
  {
    case_id: 2,
    scene: 'case-2',
    input: {
      solar_time: '1990-01-01 23:05:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丁卯", hour: "庚子" }
  },
  {
    case_id: 3,
    scene: 'case-3',
    input: {
      solar_time: '1990-01-02 00:10:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丁卯", hour: "庚子" }
  },
  {
    case_id: 4,
    scene: 'case-4',
    input: {
      solar_time: '1988-02-04 21:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "丁卯", month: "癸丑", day: "己丑", hour: "乙亥" }
  },
  {
    case_id: 5,
    scene: 'case-5',
    input: {
      solar_time: '1988-02-04 23:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "戊辰", month: "甲寅", day: "庚寅", hour: "丙子" }
  },
  {
    case_id: 6,
    scene: 'case-6',
    input: {
      solar_time: '1990-03-06 03:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "庚午", month: "戊寅", day: "庚午", hour: "戊寅" }
  },
  {
    case_id: 7,
    scene: 'case-7',
    input: {
      solar_time: '1990-03-06 05:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "庚午", month: "己卯", day: "庚午", hour: "己卯" }
  },
  {
    case_id: 8,
    scene: 'case-8',
    input: {
      solar_time: '1987-04-12 01:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false
    },
    expect: { year: "丁卯", month: "甲辰", day: "辛卯", hour: "己丑" }
  },
  {
    case_id: 9,
    scene: 'case-9',
    input: {
      solar_time: '1987-09-13 01:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false
    },
    expect: { year: "丁卯", month: "己酉", day: "乙丑", hour: "丁丑" }
  },
  {
    case_id: 10,
    scene: 'case-10',
    input: {
      solar_time: '1990-01-01 12:00:00',
      longitude: 87.6,
      latitude: 43.8,
      use_dst: false,
      use_true_solar: true
    },
    expect: { year: "己巳", month: "丙子", day: "丙寅", hour: "癸巳" }
  },
  {
    case_id: 11,
    scene: 'case-11',
    input: {
      solar_time: '1990-01-01 12:00:00',
      longitude: 126.6,
      latitude: 45.7,
      use_dst: false,
      use_true_solar: true
    },
    expect: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" }
  },
  // 1950-2010骞存櫘閫氭棩鏈熷叏鏃惰景瑕嗙洊鐢ㄤ緥锛堝叡19涓紝瑕嗙洊0-23鐐规墍鏈夋椂杈帮級
  {
    case_id: 12,
    scene: 'case-12',
    input: {
      solar_time: '1955-03-15 00:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "乙未", month: "己卯", day: "乙亥", hour: "丙子" }
  },
  {
    case_id: 13,
    scene: 'case-13',
    input: {
      solar_time: '1962-05-20 01:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "壬寅", month: "乙巳", day: "戊午", hour: "癸丑" }
  },
  {
    case_id: 14,
    scene: 'case-14',
    input: {
      solar_time: '1970-07-08 03:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "庚戌", month: "癸未", day: "己丑", hour: "丙寅" }
  },
  {
    case_id: 15,
    scene: 'case-15',
    input: {
      solar_time: '1983-09-12 05:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "癸亥", month: "辛酉", day: "癸卯", hour: "乙卯" }
  },
  {
    case_id: 16,
    scene: 'case-16',
    input: {
      solar_time: '1995-11-25 07:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "乙亥", month: "丁亥", day: "庚申", hour: "庚辰" }
  },
  {
    case_id: 17,
    scene: 'case-17',
    input: {
      solar_time: '2005-02-18 09:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "乙酉", month: "戊寅", day: "癸酉", hour: "丁巳" }
  },
  {
    case_id: 18,
    scene: 'case-18',
    input: {
      solar_time: '1958-04-07 11:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "戊戌", month: "丙辰", day: "甲寅", hour: "庚午" }
  },
  {
    case_id: 19,
    scene: 'case-19',
    input: {
      solar_time: '1968-06-22 13:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "戊申", month: "戊午", day: "癸亥", hour: "己未" }
  },
  {
    case_id: 20,
    scene: 'case-20',
    input: {
      solar_time: '1978-08-16 15:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "戊午", month: "庚申", day: "庚戌", hour: "甲申" }
  },
  {
    case_id: 21,
    scene: 'case-21',
    input: {
      solar_time: '1988-10-09 17:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "戊辰", month: "壬戌", day: "丁酉", hour: "己酉" }
  },
  {
    case_id: 22,
    scene: 'case-22',
    input: {
      solar_time: '1998-12-03 19:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "戊寅", month: "癸亥", day: "甲申", hour: "甲戌" }
  },
  {
    case_id: 23,
    scene: 'case-23',
    input: {
      solar_time: '2008-01-25 21:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "丁亥", month: "癸丑", day: "甲子", hour: "乙亥" }
  },
  {
    case_id: 24,
    scene: 'case-24',
    input: {
      solar_time: '1952-08-03 23:30:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "壬辰", month: "丁未", day: "壬午", hour: "庚子" }
  },
  {
    case_id: 25,
    scene: 'case-25',
    input: {
      solar_time: '1965-10-01 01:05:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "乙巳", month: "乙酉", day: "戊子", hour: "癸丑" }
  },
  {
    case_id: 26,
    scene: 'case-26',
    input: {
      solar_time: '1975-12-12 05:10:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "乙卯", month: "戊子", day: "壬辰", hour: "癸卯" }
  },
  {
    case_id: 27,
    scene: 'case-27',
    input: {
      solar_time: '1985-07-25 09:15:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "乙丑", month: "癸未", day: "乙丑", hour: "辛巳" }
  },
  {
    case_id: 28,
    scene: 'case-28',
    input: {
      solar_time: '1990-04-15 13:20:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "庚午", month: "庚辰", day: "庚戌", hour: "癸未" }
  },
  {
    case_id: 29,
    scene: 'case-29',
    input: {
      solar_time: '2000-06-10 17:25:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "庚辰", month: "壬午", day: "己亥", hour: "癸酉" }
  },
  {
    case_id: 30,
    scene: 'case-30',
    input: {
      solar_time: '2010-09-09 21:05:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "庚寅", month: "乙酉", day: "壬戌", hour: "辛亥" }
  },
  {
    case_id: 31,
    scene: 'case-31',
    input: {
      solar_time: '1988-02-04 22:43:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "戊辰", month: "甲寅", day: "己丑", hour: "乙亥" }
  },
  {
    case_id: 32,
    scene: 'case-32',
    input: {
      solar_time: '1990-03-06 04:20:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "庚午", month: "己卯", day: "庚午", hour: "戊寅" }
  },
  {
    case_id: 33,
    scene: 'case-33',
    input: {
      solar_time: '1990-01-01 23:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丁卯", hour: "庚子" }
  },
  {
    case_id: 34,
    scene: 'case-34',
    input: {
      solar_time: '1990-01-02 00:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丁卯", hour: "庚子" }
  },
  {
    case_id: 35,
    scene: 'case-35',
    input: {
      solar_time: '1986-05-04 02:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false
    },
    expect: { year: "丙寅", month: "壬辰", day: "戊申", hour: "癸丑" }
  },
  {
    case_id: 36,
    scene: 'case-36',
    input: {
      solar_time: '1986-09-14 02:00:00',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: true,
      use_true_solar: false
    },
    expect: { year: "丙寅", month: "丁酉", day: "辛酉", hour: "己丑" }
  },
  {
    case_id: 37,
    scene: 'case-37',
    input: {
      solar_time: '2025-01-05 10:32:31',
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "甲辰", month: "丁丑", day: "甲戌", hour: "己巳" }
  },
  {
    case_id: 38,
    scene: 'case-38',
    input: {
      solar_time: '1990-01-01 14:05:00',
      longitude: 87.6,
      latitude: 43.8,
      use_dst: false,
      use_true_solar: true
    },
    expect: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" }
  },
  {
    case_id: 39,
    scene: 'case-39',
    input: {
      solar_time: '1990-01-01 12:00:00',
      calendarType: 'lunar',
      lunarYear: 2023,
      lunarMonth: 8,
      lunarDay: 15,
      isLeapMonth: false,
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "癸卯", month: "辛酉", day: "庚寅", hour: "壬午" }
  },
  {
    case_id: 40,
    scene: 'case-40',
    input: {
      solar_time: '1999-10-10 11:30:00',
      isLunar: true,
      lunarYear: 2023,
      lunarMonth: 8,
      lunarDay: 15,
      isLeapMonth: false,
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "癸卯", month: "辛酉", day: "庚寅", hour: "壬午" }
  },
  {
    case_id: 41,
    scene: 'case-41',
    input: {
      solar_time: '2010-01-01 09:00:00',
      calendarType: 'lunar',
      lunarYear: 2023,
      lunarMonth: 2,
      lunarDay: 10,
      isLeapMonth: true,
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "癸卯", month: "乙卯", day: "戊子", hour: "丁巳" }
  },
  {
    case_id: 42,
    scene: 'case-42',
    input: {
      solar_time: '2050-12-31 20:00:00',
      lunarYear: 2023,
      lunarMonth: 8,
      lunarDay: 15,
      isLeapMonth: 0,
      longitude: 120.0,
      latitude: 39.0,
      use_dst: false,
      use_true_solar: false
    },
    expect: { year: "癸卯", month: "辛酉", day: "庚寅", hour: "丙戌" }
  }
];

const sharedDefaultOptions = {
  name: 'verify-case',
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


