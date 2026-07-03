const TEST_CASES = [
  // 已实际排盘验证的用例
  {
    case_id: 1,
    scene: "普通平日期/无边界",
    input: {
      solar_time: "1990-01-01 12:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" }
  },
  {
    case_id: 2,
    scene: "夜子时跨日（23点后换日）",
    input: {
      solar_time: "1990-01-01 23:05:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丁卯", hour: "庚子" }
  },
  {
    case_id: 3,
    scene: "早子时（0点后）",
    input: {
      solar_time: "1990-01-02 00:10:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丁卯", hour: "庚子" }
  },
  // 核心边界用例（对齐问真规则）
  {
    case_id: 4,
    scene: "立春交节前（1988年立春22:43）",
    input: {
      solar_time: "1988-02-04 21:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "丁卯", month: "癸丑", day: "己丑", hour: "乙亥" }
  },
  {
    case_id: 5,
    scene: "立春交节后",
    input: {
      solar_time: "1988-02-04 23:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "戊辰", month: "甲寅", day: "庚寅", hour: "丙子" }
  },
  {
    case_id: 6,
    scene: "惊蛰交节前（1990年惊蛰04:20）",
    input: {
      solar_time: "1990-03-06 03:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "庚午", month: "戊寅", day: "庚午", hour: "戊寅" }
  },
  {
    case_id: 7,
    scene: "惊蛰交节后",
    input: {
      solar_time: "1990-03-06 05:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "庚午", month: "己卯", day: "庚午", hour: "己卯" }
  },
  {
    case_id: 8,
    scene: "夏令时开始当天（1987年4月12日02:00开始）",
    input: {
      solar_time: "1987-04-12 01:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "丁卯", month: "甲辰", day: "辛卯", hour: "己丑" }
  },
  {
    case_id: 9,
    scene: "夏令时结束当天（1987年9月13日02:00结束）",
    input: {
      solar_time: "1987-09-13 01:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "丁卯", month: "己酉", day: "乙丑", hour: "丁丑" }
  },
  {
    case_id: 10,
    scene: "乌鲁木齐真太阳时（东经87.6°，时差-2h10m）",
    input: {
      solar_time: "1990-01-01 12:00:00",
      longitude: 87.6, latitude: 43.8,
      use_dst: false, use_true_solar: true
    },
    expect: { year: "己巳", month: "丙子", day: "丙寅", hour: "癸巳" }
  },
  {
    case_id: 11,
    scene: "哈尔滨真太阳时（东经126.6°，时差+26m）",
    input: {
      solar_time: "1990-01-01 12:00:00",
      longitude: 126.6, latitude: 45.7,
      use_dst: false, use_true_solar: true
    },
    expect: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" }
  },
  // 普通日期补充用例：1950-2010，补齐0-23点输入小时覆盖
  {
    case_id: 12,
    scene: "普通日期/补充覆盖02点",
    input: {
      solar_time: "1950-01-15 02:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己丑", month: "丁丑", day: "庚戌", hour: "丁丑" }
  },
  {
    case_id: 13,
    scene: "普通日期/补充覆盖04点",
    input: {
      solar_time: "1953-02-15 04:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "癸巳", month: "甲寅", day: "丁酉", hour: "壬寅" }
  },
  {
    case_id: 14,
    scene: "普通日期/补充覆盖06点",
    input: {
      solar_time: "1956-03-15 06:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "丙申", month: "辛卯", day: "辛巳", hour: "辛卯" }
  },
  {
    case_id: 15,
    scene: "普通日期/补充覆盖07点",
    input: {
      solar_time: "1959-04-15 07:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己亥", month: "戊辰", day: "丁卯", hour: "甲辰" }
  },
  {
    case_id: 16,
    scene: "普通日期/补充覆盖08点",
    input: {
      solar_time: "1962-05-15 08:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "壬寅", month: "乙巳", day: "癸丑", hour: "丙辰" }
  },
  {
    case_id: 17,
    scene: "普通日期/补充覆盖09点",
    input: {
      solar_time: "1965-06-15 09:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "乙巳", month: "壬午", day: "庚子", hour: "辛巳" }
  },
  {
    case_id: 18,
    scene: "普通日期/补充覆盖10点",
    input: {
      solar_time: "1968-07-15 10:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "戊申", month: "己未", day: "丙戌", hour: "癸巳" }
  },
  {
    case_id: 19,
    scene: "普通日期/补充覆盖11点",
    input: {
      solar_time: "1971-08-15 11:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "辛亥", month: "丙申", day: "壬申", hour: "丙午" }
  },
  {
    case_id: 20,
    scene: "普通日期/补充覆盖13点",
    input: {
      solar_time: "1974-09-15 13:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "甲寅", month: "癸酉", day: "己未", hour: "辛未" }
  },
  {
    case_id: 21,
    scene: "普通日期/补充覆盖14点",
    input: {
      solar_time: "1977-10-15 14:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "丁巳", month: "庚戌", day: "乙巳", hour: "癸未" }
  },
  {
    case_id: 22,
    scene: "普通日期/补充覆盖15点",
    input: {
      solar_time: "1980-11-15 15:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "庚申", month: "丁亥", day: "壬辰", hour: "戊申" }
  },
  {
    case_id: 23,
    scene: "普通日期/补充覆盖16点",
    input: {
      solar_time: "1983-12-15 16:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "癸亥", month: "甲子", day: "丁丑", hour: "戊申" }
  },
  {
    case_id: 24,
    scene: "普通日期/补充覆盖17点",
    input: {
      solar_time: "1986-01-15 17:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "乙丑", month: "己丑", day: "己未", hour: "癸酉" }
  },
  {
    case_id: 25,
    scene: "普通日期/补充覆盖18点",
    input: {
      solar_time: "1989-02-15 18:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己巳", month: "丙寅", day: "丙午", hour: "丁酉" }
  },
  {
    case_id: 26,
    scene: "普通日期/补充覆盖19点",
    input: {
      solar_time: "1992-03-15 19:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "壬申", month: "癸卯", day: "庚寅", hour: "丙戌" }
  },
  {
    case_id: 27,
    scene: "普通日期/补充覆盖20点",
    input: {
      solar_time: "1995-04-15 20:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "乙亥", month: "庚辰", day: "丙子", hour: "戊戌" }
  },
  {
    case_id: 28,
    scene: "普通日期/补充覆盖22点",
    input: {
      solar_time: "1998-05-15 22:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "戊寅", month: "丁巳", day: "壬戌", hour: "辛亥" }
  },
  {
    case_id: 29,
    scene: "普通日期/补充覆盖00点",
    input: {
      solar_time: "2004-07-15 00:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "甲申", month: "辛未", day: "乙未", hour: "丙子" }
  },
  {
    case_id: 30,
    scene: "普通日期/补充覆盖21点",
    input: {
      solar_time: "2010-08-15 21:30:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "庚寅", month: "甲申", day: "丁酉", hour: "辛亥" }
  }
];

module.exports = { TEST_CASES };
