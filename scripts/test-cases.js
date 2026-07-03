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
    expect: { year: '宸卞烦', month: '涓欏瓙', day: '涓欏瘏', hour: '鐢插崍' }
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
    expect: { year: '宸卞烦', month: '涓欏瓙', day: '涓佸嵂', hour: '搴氬瓙' }
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
    expect: { year: '宸卞烦', month: '涓欏瓙', day: '涓佸嵂', hour: '搴氬瓙' }
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
    expect: { year: '涓佸嵂', month: '鐧镐笐', day: '宸变笐', hour: '涔欎亥' }
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
    expect: { year: '鎴婅景', month: '鐢插瘏', day: '搴氬瘏', hour: '涓欏瓙' }
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
    expect: { year: '搴氬崍', month: '鎴婂瘏', day: '搴氬崍', hour: '鎴婂瘏' }
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
    expect: { year: '搴氬崍', month: '宸卞嵂', day: '搴氬崍', hour: '宸卞嵂' }
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
    expect: { year: '涓佸嵂', month: '鐢茶景', day: '杈涘嵂', hour: '宸变笐' }
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
    expect: { year: '涓佸嵂', month: '宸遍厜', day: '涔欎笐', hour: '涓佷笐' }
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
    expect: { year: '宸卞烦', month: '涓欏瓙', day: '涓欏瘏', hour: '鐧稿烦' }
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
    expect: { year: '宸卞烦', month: '涓欏瓙', day: '涓欏瘏', hour: '鐢插崍' }
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
    expect: { year: '涔欐湭', month: '宸卞嵂', day: '涔欎亥', hour: '涓欏瓙' }
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
    expect: { year: '澹瘏', month: '涔欏烦', day: '鎴婂崍', hour: '鐧镐笐' }
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
    expect: { year: '搴氭垖', month: '鐧告湭', day: '宸变笐', hour: '涓欏瘏' }
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
    expect: { year: '鐧镐亥', month: '杈涢厜', day: '鐧稿嵂', hour: '涔欏嵂' }
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
    expect: { year: '涔欎亥', month: '涓佷亥', day: '搴氱敵', hour: '搴氳景' }
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
    expect: { year: '涔欓厜', month: '鎴婂瘏', day: '鐧搁厜', hour: '涓佸烦' }
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
    expect: { year: '鎴婃垖', month: '涓欒景', day: '鐢插瘏', hour: '搴氬崍' }
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
    expect: { year: '鎴婄敵', month: '鎴婂崍', day: '鐧镐亥', hour: '宸辨湭' }
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
    expect: { year: '鎴婂崍', month: '搴氱敵', day: '搴氭垖', hour: '鐢茬敵' }
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
    expect: { year: '鎴婅景', month: '澹垖', day: '涓侀厜', hour: '宸遍厜' }
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
    expect: { year: '鎴婂瘏', month: '鐧镐亥', day: '鐢茬敵', hour: '鐢叉垖' }
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
    expect: { year: '涓佷亥', month: '鐧镐笐', day: '鐢插瓙', hour: '涔欎亥' }
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
    expect: { year: '澹景', month: '涓佹湭', day: '澹崍', hour: '搴氬瓙' }
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
    expect: { year: '涔欏烦', month: '涔欓厜', day: '鎴婂瓙', hour: '鐧镐笐' }
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
    expect: { year: '涔欏嵂', month: '鎴婂瓙', day: '澹景', hour: '鐧稿嵂' }
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
    expect: { year: '涔欎笐', month: '鐧告湭', day: '涔欎笐', hour: '杈涘烦' }
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
    expect: { year: '搴氬崍', month: '搴氳景', day: '搴氭垖', hour: '鐧告湭' }
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
    expect: { year: '搴氳景', month: '澹崍', day: '宸变亥', hour: '鐧搁厜' }
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
    expect: { year: '搴氬瘏', month: '涔欓厜', day: '澹垖', hour: '杈涗亥' }
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
    expect: { year: '鎴婅景', month: '鐢插瘏', day: '宸变笐', hour: '涔欎亥' }
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
    expect: { year: '搴氬崍', month: '宸卞嵂', day: '搴氬崍', hour: '鎴婂瘏' }
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
    expect: { year: '宸卞烦', month: '涓欏瓙', day: '涓佸嵂', hour: '搴氬瓙' }
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
    expect: { year: '宸卞烦', month: '涓欏瓙', day: '涓佸嵂', hour: '搴氬瓙' }
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
    expect: { year: '涓欏瘏', month: '澹景', day: '鎴婄敵', hour: '鐧镐笐' }
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
    expect: { year: '涓欏瘏', month: '涓侀厜', day: '杈涢厜', hour: '宸变笐' }
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
    expect: { year: '鐢茶景', month: '涓佷笐', day: '鐢叉垖', hour: '宸卞烦' }
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
    expect: { year: '宸卞烦', month: '涓欏瓙', day: '涓欏瘏', hour: '鐢插崍' }
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
    expect: { year: '澹瘏', month: '澹瓙', day: '宸辨湭', hour: '搴氬崍' }
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
    expect: { year: '澹瘏', month: '澹瓙', day: '宸辨湭', hour: '搴氬崍' }
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
    expect: { year: '澹瘏', month: '澹瓙', day: '宸辨湭', hour: '宸卞烦' }
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
    expect: { year: '澹瘏', month: '澹瓙', day: '宸辨湭', hour: '鐢叉垖' }
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


