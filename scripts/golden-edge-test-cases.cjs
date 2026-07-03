const EXTREME_TEST_CASES = [
  {
    case_id: 31,
    scene: "23点前最后一分钟",
    input: {
      solar_time: "1990-01-01 22:59:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丙寅", hour: "己亥" }
  },
  {
    case_id: 32,
    scene: "23点整换日",
    input: {
      solar_time: "1990-01-01 23:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丁卯", hour: "庚子" }
  },
  {
    case_id: 33,
    scene: "00点整早子时",
    input: {
      solar_time: "1990-01-02 00:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "己巳", month: "丙子", day: "丁卯", hour: "庚子" }
  },
  {
    case_id: 34,
    scene: "1988立春前1分钟",
    input: {
      solar_time: "1988-02-04 22:42:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "丁卯", month: "癸丑", day: "己丑", hour: "乙亥" }
  },
  {
    case_id: 35,
    scene: "1988立春精确时刻",
    input: {
      solar_time: "1988-02-04 22:43:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "戊辰", month: "甲寅", day: "己丑", hour: "乙亥" }
  },
  {
    case_id: 36,
    scene: "1988立春后1分钟",
    input: {
      solar_time: "1988-02-04 22:44:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "戊辰", month: "甲寅", day: "己丑", hour: "乙亥" }
  },
  {
    case_id: 37,
    scene: "1990惊蛰前1分钟",
    input: {
      solar_time: "1990-03-06 04:19:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "庚午", month: "戊寅", day: "庚午", hour: "戊寅" }
  },
  {
    case_id: 38,
    scene: "1990惊蛰精确时刻",
    input: {
      solar_time: "1990-03-06 04:20:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: false, use_true_solar: false
    },
    expect: { year: "庚午", month: "己卯", day: "庚午", hour: "戊寅" }
  },
  {
    case_id: 39,
    scene: "1986夏令时开始精确点",
    input: {
      solar_time: "1986-05-04 03:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "丙寅", month: "壬辰", day: "戊申", hour: "癸丑" }
  },
  {
    case_id: 40,
    scene: "1986夏令时结束精确点",
    input: {
      solar_time: "1986-09-14 01:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "丙寅", month: "丁酉", day: "辛酉", hour: "己丑" }
  },
  {
    case_id: 41,
    scene: "1987夏令时开始精确点",
    input: {
      solar_time: "1987-04-12 03:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "丁卯", month: "甲辰", day: "辛卯", hour: "己丑" }
  },
  {
    case_id: 42,
    scene: "1987夏令时结束精确点",
    input: {
      solar_time: "1987-09-13 01:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "丁卯", month: "己酉", day: "乙丑", hour: "丁丑" }
  },
  {
    case_id: 43,
    scene: "1988夏令时开始精确点",
    input: {
      solar_time: "1988-04-10 03:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "戊辰", month: "丙辰", day: "乙未", hour: "丁丑" }
  },
  {
    case_id: 44,
    scene: "1988夏令时结束精确点",
    input: {
      solar_time: "1988-09-11 01:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "戊辰", month: "辛酉", day: "己巳", hour: "乙丑" }
  },
  {
    case_id: 45,
    scene: "1989夏令时开始精确点",
    input: {
      solar_time: "1989-04-16 03:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "己巳", month: "戊辰", day: "丙午", hour: "己丑" }
  },
  {
    case_id: 46,
    scene: "1989夏令时结束精确点",
    input: {
      solar_time: "1989-09-17 01:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "己巳", month: "癸酉", day: "庚辰", hour: "丁丑" }
  },
  {
    case_id: 47,
    scene: "1990夏令时开始精确点",
    input: {
      solar_time: "1990-04-15 03:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "庚午", month: "庚辰", day: "庚戌", hour: "丁丑" }
  },
  {
    case_id: 48,
    scene: "1990夏令时结束精确点",
    input: {
      solar_time: "1990-09-16 01:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "庚午", month: "乙酉", day: "甲申", hour: "乙丑" }
  },
  {
    case_id: 49,
    scene: "1991夏令时开始精确点",
    input: {
      solar_time: "1991-04-14 03:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "辛未", month: "壬辰", day: "甲寅", hour: "乙丑" }
  },
  {
    case_id: 50,
    scene: "1991夏令时结束精确点",
    input: {
      solar_time: "1991-09-15 01:00:00",
      longitude: 120.0, latitude: 39.0,
      use_dst: true, use_true_solar: false
    },
    expect: { year: "辛未", month: "丁酉", day: "戊子", hour: "癸丑" }
  }
];

module.exports = { EXTREME_TEST_CASES };
