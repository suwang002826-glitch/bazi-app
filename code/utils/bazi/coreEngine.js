const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 默认加载1900-2100年精确节气数据包，外部传入数据仍保持最高优先级。
const DEFAULT_SOLAR_TERMS = require('../../data-packs/solar-terms/solarTerms-precise-1900-2100.json');

const STEM_META = {
  甲: { element: '木', yinYang: '阳' },
  乙: { element: '木', yinYang: '阴' },
  丙: { element: '火', yinYang: '阳' },
  丁: { element: '火', yinYang: '阴' },
  戊: { element: '土', yinYang: '阳' },
  己: { element: '土', yinYang: '阴' },
  庚: { element: '金', yinYang: '阳' },
  辛: { element: '金', yinYang: '阴' },
  壬: { element: '水', yinYang: '阳' },
  癸: { element: '水', yinYang: '阴' }
};

const BRANCH_ELEMENT = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水'
};

const HIDDEN_STEMS = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲']
};

const NA_YIN_PAIRS = [
  ['甲子', '乙丑', '海中金'],
  ['丙寅', '丁卯', '炉中火'],
  ['戊辰', '己巳', '大林木'],
  ['庚午', '辛未', '路旁土'],
  ['壬申', '癸酉', '剑锋金'],
  ['甲戌', '乙亥', '山头火'],
  ['丙子', '丁丑', '涧下水'],
  ['戊寅', '己卯', '城头土'],
  ['庚辰', '辛巳', '白蜡金'],
  ['壬午', '癸未', '杨柳木'],
  ['甲申', '乙酉', '泉中水'],
  ['丙戌', '丁亥', '屋上土'],
  ['戊子', '己丑', '霹雳火'],
  ['庚寅', '辛卯', '松柏木'],
  ['壬辰', '癸巳', '长流水'],
  ['甲午', '乙未', '沙中金'],
  ['丙申', '丁酉', '山下火'],
  ['戊戌', '己亥', '平地木'],
  ['庚子', '辛丑', '壁上土'],
  ['壬寅', '癸卯', '金箔金'],
  ['甲辰', '乙巳', '覆灯火'],
  ['丙午', '丁未', '天河水'],
  ['戊申', '己酉', '大驿土'],
  ['庚戌', '辛亥', '钗钏金'],
  ['壬子', '癸丑', '桑柘木'],
  ['甲寅', '乙卯', '大溪水'],
  ['丙辰', '丁巳', '沙中土'],
  ['戊午', '己未', '天上火'],
  ['庚申', '辛酉', '石榴木'],
  ['壬戌', '癸亥', '大海水']
];

const NA_YIN_MAP = NA_YIN_PAIRS.reduce((result, [left, right, name]) => {
  result[left] = name;
  result[right] = name;
  return result;
}, {});
const { RULES } = require('./constants');
const TEN_GOD_ELEMENT_FLOW = ['木', '火', '土', '金', '水'];

const ZI_HOUR_RANGES = [
  { branch: '子', start: 23, end: 1 },
  { branch: '丑', start: 1, end: 3 },
  { branch: '寅', start: 3, end: 5 },
  { branch: '卯', start: 5, end: 7 },
  { branch: '辰', start: 7, end: 9 },
  { branch: '巳', start: 9, end: 11 },
  { branch: '午', start: 11, end: 13 },
  { branch: '未', start: 13, end: 15 },
  { branch: '申', start: 15, end: 17 },
  { branch: '酉', start: 17, end: 19 },
  { branch: '戌', start: 19, end: 21 },
  { branch: '亥', start: 21, end: 23 }
];

const JIE_TERMS = [
  { name: '大寒', month: 1, day: 6, branch: '丑', index: 0 },
  { name: '小寒', month: 1, day: 5, branch: '丑', index: 0 },
  { name: '立春', month: 2, day: 4, branch: '寅', index: 1 },
  { name: '惊蛰', month: 3, day: 5, branch: '卯', index: 2 },
  { name: '清明', month: 4, day: 5, branch: '辰', index: 3 },
  { name: '立夏', month: 5, day: 6, branch: '巳', index: 4 },
  { name: '芒种', month: 6, day: 6, branch: '午', index: 5 },
  { name: '小暑', month: 7, day: 7, branch: '未', index: 6 },
  { name: '立秋', month: 8, day: 7, branch: '申', index: 7 },
  { name: '白露', month: 9, day: 7, branch: '酉', index: 8 },
  { name: '寒露', month: 10, day: 8, branch: '戌', index: 9 },
  { name: '立冬', month: 11, day: 7, branch: '亥', index: 10 },
  { name: '大雪', month: 12, day: 7, branch: '子', index: 11 },
  { name: '大寒', month: 1, day: 5, branch: '丑', index: 0 }
];

const DEFAULT_LONGITUDE = 120;
const DEFAULT_LATITUDE = RULES.defaultLatitude;
const CHINA_SUMMER_TIME_OFFICIAL = {
  1986: { start: [5, 4, 2], end: [9, 14, 2] },
  1987: { start: [4, 12, 2], end: [9, 13, 2] },
  1988: { start: [4, 17, 2], end: [9, 11, 2] },
  1989: { start: [4, 16, 2], end: [9, 17, 2] },
  1990: { start: [4, 15, 2], end: [9, 16, 2] },
  1991: { start: [4, 14, 2], end: [9, 15, 2] }
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDate(year, month, day, hour, minute, second = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function cloneDate(date) {
  return new Date(date.getTime());
}

function getDayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000) + 1;
}

function normalizeLongitude(longitude) {
  if (longitude === null || longitude === undefined) return null;
  if (typeof longitude === 'string' && longitude.trim() === '') return null;
  const value = Number(longitude);
  if (!Number.isFinite(value)) return null;
  if (value < 73 || value > 135) return null;
  return value;
}

function resolveLongitude(longitude) {
  const normalized = normalizeLongitude(longitude);
  return normalized === null ? DEFAULT_LONGITUDE : normalized;
}

function parseDateTime(input) {
  if (!input || !input.birthDate || !input.birthTime) {
    throw new Error('birthDate and birthTime are required');
  }
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute, second = 0] = input.birthTime.split(':').map(Number);
  if (![year, month, day, hour, minute, second].every(Number.isFinite)) {
    throw new Error('Invalid birthDate or birthTime');
  }
  return toDate(year, month, day, hour, minute, second);
}

function getJulianDayNumber(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function isChinaSummerTime(date) {
  const year = date.getUTCFullYear();
  if (year < 1986 || year > 1991) return false;
  const config = CHINA_SUMMER_TIME_OFFICIAL[year];
  if (!config) return false;

  const start = new Date(Date.UTC(year, config.start[0] - 1, config.start[1], config.start[2], 0, 0));
  const end = new Date(Date.UTC(year, config.end[0] - 1, config.end[1], config.end[2], 0, 0));
  const dayStart = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate(), 2, 0, 0));

  const startDoy = getDayOfYear(start);
  const endDoy = getDayOfYear(end);
  const doy = getDayOfYear(dayStart);
  const minuteOfDay = date.getUTCHours() * 60 + date.getUTCMinutes();

  return (
    (doy > startDoy && doy < endDoy) ||
    (doy === startDoy && minuteOfDay >= config.start[2] * 60)
  );
}

function applyChinaSummerTime(date, enabled = true) {
  if (!enabled) {
    return cloneDate(date);
  }
  const result = cloneDate(date);
  if (isChinaSummerTime(result)) {
    result.setUTCHours(result.getUTCHours() - 1);
  }
  return result;
}

function equationOfTimeMinutes(date) {
  const day = getDayOfYear(date);
  const b = (360 / 365) * (day - 81) * (Math.PI / 180);
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function isUnknownBeijingMode(options = {}) {
  const labels = [
    options.unknownBeijing,
    options.isUnknownBeijing,
    options.useUnknownBeijing,
    options.locationIsUnknown
  ];
  if (labels.some((item) => item === true)) return true;

  const mode = String(options.locationMode || '').toLowerCase().trim();
  if (mode === 'unknown-beijing') {
    return true;
  }

  const normalized = String(
    options.locationSource || options.locationLabel || options.birthPlace || ''
  ).trim().toLowerCase();
  return normalized === '未知地-北京时间' || normalized === 'unknown-beijing' || normalized.includes('unknown-beijing');
}

function isDSTRequested(options = {}) {
  const requested = options.applyDST
    || options.useDST
    || options.useDaylightSaving
    || options.useSummerTime
    || options.enableChinaSummerTime
    || options.use_dst;
  return Boolean(requested);
}

function applyTrueSolarTime(date, longitude, enabled = true, note = '') {
  const result = cloneDate(date);
  if (!enabled) {
    return {
      date: result,
      correctionMinutes: 0,
      label: `真太阳时未执行${note ? `（${note}）` : ''}`
    };
  }
  const lon = normalizeLongitude(longitude);
  if (lon === null) {
    return {
      date: result,
      correctionMinutes: 0,
      label: `经度无效，未进行真太阳时矫正${note ? `（${note}）` : ''}`
    };
  }

  const longitudeCorrection = (lon - 120) * 4;
  const eot = equationOfTimeMinutes(result);
  const correctionMinutes = longitudeCorrection + eot;
  result.setUTCMinutes(result.getUTCMinutes() + correctionMinutes);
  return {
    date: result,
    correctionMinutes: Number(correctionMinutes.toFixed(2)),
    label: `经度修正 ${longitudeCorrection.toFixed(2)} 分钟；均时差 ${eot.toFixed(2)} 分钟`
  };
}

function getSolarTermFromData(termsData, termName, year) {
  if (!termsData) return null;
  const byYear = termsData[String(year)] || termsData[year];
  if (!byYear) return null;
  const value = byYear[termName];
  if (!value) return null;
  return new Date(value);
}

function getSolarTermTime(year, termName, termsData) {
  // 优先级：传入的自定义termsData > 默认精确数据包 > 近似算法兜底
  const fromCustomData = getSolarTermFromData(termsData, termName, year);
  if (fromCustomData) return fromCustomData;
  const fromDefaultData = getSolarTermFromData(DEFAULT_SOLAR_TERMS, termName, year);
  if (fromDefaultData) return fromDefaultData;
  const term = JIE_TERMS.find((item) => item.name === termName);
  if (!term) {
    throw new Error(`Unknown solar term: ${termName}`);
  }
  return toDate(year, term.month, term.day, 12, 0, 0);
}

function compareDateTime(a, b) {
  return a.getTime() - b.getTime();
}

function getYearPillar(date, termsData) {
  const lichunThisYear = getSolarTermTime(date.getUTCFullYear(), '立春', termsData);
  const boundary = compareDateTime(date, lichunThisYear) >= 0
    ? date.getUTCFullYear()
    : date.getUTCFullYear() - 1;
  const stemIndex = (boundary - 4) % 10;
  const branchIndex = (boundary - 4) % 12;
  return {
    stem: STEMS[(stemIndex + 10) % 10],
    branch: BRANCHES[(branchIndex + 12) % 12]
  };
}

function getMonthPillar(date, yearStem, termsData) {
  const year = date.getUTCFullYear();
  const ordered = ['小寒', '立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪'];
  const termTimes = ordered.map((termName) => ({ termName, date: getSolarTermTime(year, termName, termsData) }));

  let monthIndex = 11;
  for (let i = 0; i < termTimes.length; i += 1) {
    if (compareDateTime(date, termTimes[i].date) >= 0) {
      monthIndex = i;
    } else {
      break;
    }
  }

  const monthBranches = ['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子'];
  const branch = monthBranches[monthIndex];

  const monthStemStartByYearStemGroup = {
    0: '丙',
    1: '戊',
    2: '庚',
    3: '壬',
    4: '甲'
  };

  const yearStemIndex = STEMS.indexOf(yearStem);
  const startStem = monthStemStartByYearStemGroup[yearStemIndex % 5];
  const stemOffset = (monthIndex + 11) % 12;
  const stem = STEMS[(STEMS.indexOf(startStem) + stemOffset) % 10];

  return {
    stem,
    branch,
    termStart: ordered[monthIndex]
  };
}

function getDayPillar(date, options = {}) {
  const hour = date.getUTCHours();
  const ziMode = options.useEarlyLateZi ? 'earlyLate' : 'default';
  const adjusted = cloneDate(date);
  if ((ziMode === 'default' && hour >= 23) || (ziMode === 'earlyLate' && hour === 0)) {
    adjusted.setUTCDate(adjusted.getUTCDate() + 1);
  }
  return getCalendarDayPillar(adjusted);
}

function getCalendarDayPillar(date) {
  const jdn = getJulianDayNumber(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
  const idx = ((jdn + 49) % 60 + 60) % 60;
  return {
    stem: STEMS[idx % 10],
    branch: BRANCHES[idx % 12]
  };
}

function getHourBranch(date) {
  const hour = date.getUTCHours();
  if (hour === 23 || hour === 0) return '子';
  if (hour >= 1 && hour < 3) return '丑';
  if (hour >= 3 && hour < 5) return '寅';
  if (hour >= 5 && hour < 7) return '卯';
  if (hour >= 7 && hour < 9) return '辰';
  if (hour >= 9 && hour < 11) return '巳';
  if (hour >= 11 && hour < 13) return '午';
  if (hour >= 13 && hour < 15) return '未';
  if (hour >= 15 && hour < 17) return '申';
  if (hour >= 17 && hour < 19) return '酉';
  if (hour >= 19 && hour < 21) return '戌';
  return '亥';
}

function getHourStemBasePillar(date, dayPillar, options = {}) {
  if (options.useEarlyLateZi && date.getUTCHours() === 23) {
    const nextDay = cloneDate(date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    return getCalendarDayPillar(nextDay);
  }
  return dayPillar;
}

function getHourPillar(date, dayStem) {
  const branch = getHourBranch(date);
  const hourBranchIndex = BRANCHES.indexOf(branch);
  const dayStemIndex = STEMS.indexOf(dayStem);
  const stem = STEMS[((dayStemIndex % 5) * 2 + hourBranchIndex) % 10];
  return {
    stem,
    branch
  };
}

function getNaYin(stem, branch) {
  return NA_YIN_MAP[`${stem}${branch}`] || `${stem}${branch}`;
}

function getZiHourLabel(date, useEarlyLateZi) {
  if (!useEarlyLateZi) return '子';
  const hour = date.getUTCHours();
  if (hour === 23) return '夜子';
  if (hour === 0) return '早子';
  return '子';
}

function getTenGod(dayStem, targetStem) {
  const dayMeta = STEM_META[dayStem];
  const targetMeta = STEM_META[targetStem];
  if (!dayMeta || !targetMeta) return "未知";

  const samePolarity = dayMeta.yinYang === targetMeta.yinYang;
  const dayIndex = TEN_GOD_ELEMENT_FLOW.indexOf(dayMeta.element);
  const targetIndex = TEN_GOD_ELEMENT_FLOW.indexOf(targetMeta.element);

  if (dayMeta.element === targetMeta.element) {
    return samePolarity ? "比肩" : "劫财";
  }
  if ((dayIndex + 1) % 5 === targetIndex) {
    return samePolarity ? "食神" : "伤官";
  }
  if ((targetIndex + 1) % 5 === dayIndex) {
    return samePolarity ? "偏印" : "正印";
  }
  if ((dayIndex + 2) % 5 === targetIndex) {
    return samePolarity ? "偏财" : "正财";
  }
  return samePolarity ? "七杀" : "正官";
}

function countElements(pillars) {
  const tally = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  pillars.forEach((pillar) => {
    tally[STEM_META[pillar.stem].element] += 1;
    tally[BRANCH_ELEMENT[pillar.branch]] += 1;
    (HIDDEN_STEMS[pillar.branch] || []).forEach((stem) => {
      tally[STEM_META[stem].element] += 1;
    });
  });
  return tally;
}

function buildBaziChart(input, options = {}) {
  const requestedDST = isDSTRequested(options);
  const optionsWithDefaults = {
    useTrueSolarTime: options.useTrueSolarTime,
    useEarlyLateZi: Boolean(options.useEarlyLateZi),
    useUnknownBeijing: Boolean(options.useUnknownBeijing || options.unknownBeijing || options.isUnknownBeijing),
    locationSource: options.locationSource || input.birthPlace || '',
    locationMode: options.locationMode || '',
    locationType: options.locationType || '',
    termsData: options.termsData || input.termsData || null,
    useSummerTime: requestedDST,
    applyDST: requestedDST
  };

  const normalized = {
    useTrueSolarTime: optionsWithDefaults.useTrueSolarTime !== undefined
      ? optionsWithDefaults.useTrueSolarTime
      : RULES.defaultTrueSolarTime,
    useEarlyLateZi: optionsWithDefaults.useEarlyLateZi,
    longitude: input.longitude,
    termsData: optionsWithDefaults.termsData,
    applyDST: optionsWithDefaults.useSummerTime,
    isUnknownBeijing: optionsWithDefaults.useUnknownBeijing || isUnknownBeijingMode(optionsWithDefaults)
  };

  const rawDate = parseDateTime(input);
  const shouldApplyTrueSolar = normalized.useTrueSolarTime && !normalized.isUnknownBeijing;
  const shouldApplyDST = normalized.applyDST;
  const afterSummerTime = applyChinaSummerTime(rawDate, shouldApplyDST);
  const solar = applyTrueSolarTime(
    afterSummerTime,
    shouldApplyTrueSolar ? resolveLongitude(normalized.longitude) : null,
    shouldApplyTrueSolar,
    normalized.isUnknownBeijing ? '未知地-北京时间' : ''
  );
  const readingDate = solar.date;

  const yearPillar = getYearPillar(readingDate, normalized.termsData);
  const monthPillar = getMonthPillar(readingDate, yearPillar.stem, normalized.termsData);
  const dayPillar = getDayPillar(readingDate, { useEarlyLateZi: normalized.useEarlyLateZi });
  const hourStemBasePillar = getHourStemBasePillar(readingDate, dayPillar, { useEarlyLateZi: normalized.useEarlyLateZi });
  const hourPillar = getHourPillar(readingDate, hourStemBasePillar.stem);

  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
  const elementCount = countElements(pillars);

  return {
    input: {
      ...input,
      useTrueSolarTime: normalized.useTrueSolarTime,
      useEarlyLateZi: normalized.useEarlyLateZi
    },
    adjustedDateTime: readingDate.toISOString(),
    trueSolarTime: {
      enabled: normalized.useTrueSolarTime,
      applied: shouldApplyTrueSolar,
      correctionMinutes: solar.correctionMinutes,
      label: solar.label
    },
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar
    },
    ziHourLabel: getZiHourLabel(readingDate, normalized.useEarlyLateZi),
    elementCount,
    tenGods: {
      year: getTenGod(dayPillar.stem, yearPillar.stem),
      month: getTenGod(dayPillar.stem, monthPillar.stem),
      day: '日主',
      hour: getTenGod(dayPillar.stem, hourPillar.stem)
    },
    naYin: {
      year: getNaYin(yearPillar.stem, yearPillar.branch),
      month: getNaYin(monthPillar.stem, monthPillar.branch),
      day: getNaYin(dayPillar.stem, dayPillar.branch),
      hour: getNaYin(hourPillar.stem, hourPillar.branch)
    }
  };
}

function getBoundaryDiagnostics(input, options = {}) {
  const rawDate = parseDateTime(input);
  const optionsWithDefaults = {
    useUnknownBeijing: Boolean(options.useUnknownBeijing || options.unknownBeijing || options.isUnknownBeijing),
    locationSource: options.locationSource || options.birthPlace || '',
    locationMode: options.locationMode || '',
    locationType: options.locationType || ''
  };
  const isUnknown = optionsWithDefaults.useUnknownBeijing || isUnknownBeijingMode(optionsWithDefaults);
  const applyDST = isDSTRequested(options);
  const shouldApplyDST = applyDST;
  const shouldApplyTrueSolar = Boolean(options.useTrueSolarTime) && !isUnknown;
  const summer = applyChinaSummerTime(rawDate, shouldApplyDST);
  const solar = applyTrueSolarTime(
    summer,
    shouldApplyTrueSolar ? resolveLongitude(input.longitude) : null,
    shouldApplyTrueSolar,
    isUnknown ? '未知地-北京时间' : ''
  );
  const yearPillar = getYearPillar(solar.date, options.termsData || null);
  const monthPillar = getMonthPillar(solar.date, yearPillar.stem, options.termsData || null);
  const dayPillar = getDayPillar(solar.date, { useEarlyLateZi: Boolean(options.useEarlyLateZi) });
  const hourStemBasePillar = getHourStemBasePillar(solar.date, dayPillar, { useEarlyLateZi: Boolean(options.useEarlyLateZi) });
  const hourPillar = getHourPillar(solar.date, hourStemBasePillar.stem);

  return {
    rawDate: rawDate.toISOString(),
    summerAdjustedDate: summer.toISOString(),
    trueSolar: solar,
    pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar }
  };
}

module.exports = {
  STEMS,
  BRANCHES,
  JIE_TERMS,
  buildBaziChart,
  getBoundaryDiagnostics,
  applyTrueSolarTime,
  applyChinaSummerTime,
  getSolarTermTime,
  getYearPillar,
  getMonthPillar,
  getDayPillar,
  getHourPillar,
  getTenGod,
  getNaYin
};


