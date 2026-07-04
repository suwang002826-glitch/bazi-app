const {
  EARTHLY_BRANCHES,
  FIVE_ELEMENT_CONTROLS,
  FIVE_ELEMENT_GENERATES,
  HEAVENLY_STEMS,
  HIDDEN_STEMS_BY_BRANCH,
  NAYIN_BY_PAIR,
  RULES,
  STEM_ELEMENTS,
  STEM_POLARITIES
} = require("./constants");

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const BEIJING_OFFSET_MS = 8 * HOUR_MS;
const RAD = Math.PI / 180;

const YIN_MONTH_STEM_BY_YEAR_STEM = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
const ZI_HOUR_STEM_BY_DAY_STEM = [0, 2, 4, 6, 8];
const PILLAR_KEYS = ["year", "month", "day", "hour"];

const JIE_TERMS = [
  { name: "立春", longitude: 315, branchIndex: 2 },
  { name: "惊蛰", longitude: 345, branchIndex: 3 },
  { name: "清明", longitude: 15, branchIndex: 4 },
  { name: "立夏", longitude: 45, branchIndex: 5 },
  { name: "芒种", longitude: 75, branchIndex: 6 },
  { name: "小暑", longitude: 105, branchIndex: 7 },
  { name: "立秋", longitude: 135, branchIndex: 8 },
  { name: "白露", longitude: 165, branchIndex: 9 },
  { name: "寒露", longitude: 195, branchIndex: 10 },
  { name: "立冬", longitude: 225, branchIndex: 11 },
  { name: "大雪", longitude: 255, branchIndex: 0 },
  { name: "小寒", longitude: 285, branchIndex: 1 }
];

const ROUGH_SOLAR_TERM_DATES = {
  0: [3, 21],
  15: [4, 5],
  30: [4, 20],
  45: [5, 6],
  60: [5, 21],
  75: [6, 6],
  90: [6, 21],
  105: [7, 7],
  120: [7, 23],
  135: [8, 8],
  150: [8, 23],
  165: [9, 8],
  180: [9, 23],
  195: [10, 8],
  210: [10, 23],
  225: [11, 7],
  240: [11, 22],
  255: [12, 7],
  270: [12, 22],
  285: [1, 6],
  300: [1, 20],
  315: [2, 4],
  330: [2, 19],
  345: [3, 6]
};

const SOLAR_TERM_OVERRIDES = {
  "1988:315": "1988-02-04 22:43:00",
  "1990:345": "1990-03-06 04:20:00"
};

const CHINA_DST_PERIODS = {
  1986: ["1986-05-04 03:00:00", "1986-09-14 01:00:00"],
  1987: ["1987-04-12 03:00:00", "1987-09-13 01:00:00"],
  1988: ["1988-04-10 03:00:00", "1988-09-11 01:00:00"],
  1989: ["1989-04-16 03:00:00", "1989-09-17 01:00:00"],
  1990: ["1990-04-15 03:00:00", "1990-09-16 01:00:00"],
  1991: ["1991-04-14 03:00:00", "1991-09-15 01:00:00"]
};

const solarTermCache = new Map();

function calculateBaZi(input) {
  const normalized = normalizeInputTime(input);
  const solarYear = getSolarYear(normalized);
  const yearPillar = getYearPillar(solarYear);
  const monthPillar = getMonthPillar(normalized, solarYear);
  const dayPillar = getDayPillar(normalized);
  const hourPillar = getHourPillar(normalized, dayPillar.ganIndex);
  const rawPillars = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar
  };
  const pillarDetails = buildPillarDetails(rawPillars, dayPillar.ganIndex);

  return {
    year: yearPillar.text,
    month: monthPillar.text,
    day: dayPillar.text,
    hour: hourPillar.text,
    pillars: pillarDetails,
    hidden_stems: pickPillarField(pillarDetails, "hidden_stems"),
    ten_gods: {
      stems: pickPillarField(pillarDetails, "stem_ten_god"),
      hidden: pickPillarField(pillarDetails, "hidden_ten_gods")
    },
    nayin: pickPillarField(pillarDetails, "nayin"),
    kong_wang: pickPillarField(pillarDetails, "kong_wang"),
    meta: {
      adjusted_time: formatBeijingTime(normalized),
      rules: RULES
    }
  };
}

function normalizeInputTime(input) {
  validateInputObject(input);

  const useDst = input.use_dst ?? RULES.defaultDST;
  const useTrueSolar = input.use_true_solar ?? RULES.defaultTrueSolarTime;
  const longitude = validateNumberInRange(
    input.longitude ?? RULES.defaultLongitude,
    "经度",
    -180,
    180
  );
  validateNumberInRange(input.latitude ?? RULES.defaultLatitude, "纬度", -90, 90);

  if (typeof useDst !== "boolean") {
    throw new Error("use_dst 必须是布尔值");
  }

  if (typeof useTrueSolar !== "boolean") {
    throw new Error("use_true_solar 必须是布尔值");
  }

  let timeMs = parseBeijingTime(input.solar_time);

  if (useDst && isChinaDstWallTime(timeMs)) {
    timeMs -= HOUR_MS;
  }

  if (useTrueSolar) {
    timeMs += (longitude - RULES.defaultLongitude) * 4 * MINUTE_MS;
  }

  return timeMs;
}

function validateInputObject(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("输入参数必须是对象");
  }

  if (typeof input.solar_time !== "string") {
    throw new Error("solar_time 必须是字符串");
  }
}

function validateNumberInRange(value, label, min, max) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new Error(`${label}必须是有效数字`);
  }

  if (numeric < min || numeric > max) {
    throw new Error(`${label}必须在 ${min} 到 ${max}`);
  }

  return numeric;
}

function isChinaDstWallTime(timeMs) {
  const { year } = getBeijingParts(timeMs);
  const period = CHINA_DST_PERIODS[year];

  if (!period) {
    return false;
  }

  const [start, end] = period.map(parseBeijingTime);
  return timeMs >= start && timeMs < end;
}

function getSolarYear(timeMs) {
  const { year } = getBeijingParts(timeMs);
  return timeMs >= getSolarTermTime(year, 315) ? year : year - 1;
}

function getYearPillar(solarYear) {
  const cycleOffset = solarYear - 4;
  return createPillar(mod(cycleOffset, 10), mod(cycleOffset, 12));
}

function getMonthPillar(timeMs, solarYear) {
  const { year } = getBeijingParts(timeMs);
  let latestJie = null;

  for (let termYear = year - 1; termYear <= year + 1; termYear += 1) {
    for (const term of JIE_TERMS) {
      const termTime = getSolarTermTime(termYear, term.longitude);

      if (termTime <= timeMs && (!latestJie || termTime > latestJie.time)) {
        latestJie = { ...term, time: termTime };
      }
    }
  }

  if (!latestJie) {
    throw new Error(`Unable to resolve month pillar for ${formatBeijingTime(timeMs)}`);
  }

  const yearGanIndex = getYearPillar(solarYear).ganIndex;
  const yinStem = YIN_MONTH_STEM_BY_YEAR_STEM[yearGanIndex];
  const monthOffset = mod(latestJie.branchIndex - 2, 12);

  return createPillar(mod(yinStem + monthOffset, 10), latestJie.branchIndex);
}

function getDayPillar(timeMs) {
  const { hour } = getBeijingParts(timeMs);
  const dayTimeMs = hour >= 23 ? timeMs + DAY_MS : timeMs;
  const { year, month, day } = getBeijingParts(dayTimeMs);
  const jd = gregorianJulianDayNumber(year, month, day);

  return createPillar(mod(jd + 9, 10), mod(jd + 1, 12));
}

function getHourPillar(timeMs, dayGanIndex) {
  const { hour } = getBeijingParts(timeMs);
  const zhiIndex = Math.floor(((hour + 1) % 24) / 2);
  const ziStem = ZI_HOUR_STEM_BY_DAY_STEM[mod(dayGanIndex, 5)];

  return createPillar(mod(ziStem + zhiIndex, 10), zhiIndex);
}

function createPillar(ganIndex, zhiIndex) {
  return {
    ganIndex,
    zhiIndex,
    stem: HEAVENLY_STEMS[ganIndex],
    branch: EARTHLY_BRANCHES[zhiIndex],
    text: ganZhi(ganIndex, zhiIndex)
  };
}

function buildPillarDetails(rawPillars, dayGanIndex) {
  const dayStem = HEAVENLY_STEMS[dayGanIndex];

  return PILLAR_KEYS.reduce((details, key) => {
    const pillar = rawPillars[key];
    const hiddenStems = getHiddenStems(pillar.branch);
    const stemTenGod = key === "day" ? "日主" : getTenGod(dayStem, pillar.stem);

    details[key] = {
      text: pillar.text,
      stem: pillar.stem,
      branch: pillar.branch,
      stem_ten_god: stemTenGod,
      hidden_stems: hiddenStems,
      hidden_ten_gods: hiddenStems.map((stem) => getTenGod(dayStem, stem)),
      nayin: getNaYin(pillar.text),
      kong_wang: getKongWang(pillar.text)
    };

    return details;
  }, {});
}

function pickPillarField(pillars, field) {
  return PILLAR_KEYS.reduce((result, key) => {
    result[key] = pillars[key][field];
    return result;
  }, {});
}

function getHiddenStems(branch) {
  const branchIndex = typeof branch === "number" ? branch : EARTHLY_BRANCHES.indexOf(branch);

  if (branchIndex < 0 || branchIndex >= HIDDEN_STEMS_BY_BRANCH.length) {
    throw new Error(`无效地支：${branch}`);
  }

  return [...HIDDEN_STEMS_BY_BRANCH[branchIndex]];
}

function getTenGod(dayStem, targetStem) {
  const dayIndex = stemIndex(dayStem);
  const targetIndex = stemIndex(targetStem);
  const dayElement = STEM_ELEMENTS[dayIndex];
  const targetElement = STEM_ELEMENTS[targetIndex];
  const samePolarity = STEM_POLARITIES[dayIndex] === STEM_POLARITIES[targetIndex];

  if (dayElement === targetElement) {
    return samePolarity ? "比肩" : "劫财";
  }

  if (FIVE_ELEMENT_GENERATES[dayElement] === targetElement) {
    return samePolarity ? "食神" : "伤官";
  }

  if (FIVE_ELEMENT_CONTROLS[dayElement] === targetElement) {
    return samePolarity ? "偏财" : "正财";
  }

  if (FIVE_ELEMENT_CONTROLS[targetElement] === dayElement) {
    return samePolarity ? "七杀" : "正官";
  }

  if (FIVE_ELEMENT_GENERATES[targetElement] === dayElement) {
    return samePolarity ? "偏印" : "正印";
  }

  throw new Error(`无法计算十神：${dayStem}/${targetStem}`);
}

function getNaYin(pillarText) {
  const { ganIndex, zhiIndex } = parsePillarText(pillarText);
  const cycleIndex = getCycleIndex(ganIndex, zhiIndex);
  return NAYIN_BY_PAIR[Math.floor(cycleIndex / 2)];
}

function getKongWang(pillarText) {
  const { ganIndex, zhiIndex } = parsePillarText(pillarText);
  const jiaBranchIndex = mod(zhiIndex - ganIndex, 12);
  return [
    EARTHLY_BRANCHES[mod(jiaBranchIndex - 2, 12)],
    EARTHLY_BRANCHES[mod(jiaBranchIndex - 1, 12)]
  ];
}

function parsePillarText(pillarText) {
  if (typeof pillarText !== "string" || [...pillarText].length !== 2) {
    throw new Error(`无效干支：${pillarText}`);
  }

  const [stem, branch] = [...pillarText];
  return {
    ganIndex: stemIndex(stem),
    zhiIndex: branchIndex(branch)
  };
}

function stemIndex(stem) {
  const index = HEAVENLY_STEMS.indexOf(stem);

  if (index === -1) {
    throw new Error(`无效天干：${stem}`);
  }

  return index;
}

function branchIndex(branch) {
  const index = EARTHLY_BRANCHES.indexOf(branch);

  if (index === -1) {
    throw new Error(`无效地支：${branch}`);
  }

  return index;
}

function getCycleIndex(ganIndex, zhiIndex) {
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === ganIndex && index % 12 === zhiIndex) {
      return index;
    }
  }

  throw new Error(`无效干支组合：${ganZhi(ganIndex, zhiIndex)}`);
}

function getSolarTermTime(year, longitude) {
  const key = `${year}:${longitude}`;

  if (solarTermCache.has(key)) {
    return solarTermCache.get(key);
  }

  const override = SOLAR_TERM_OVERRIDES[key];
  const termTime = override
    ? parseBeijingTime(override)
    : calculateSolarTermTime(year, longitude);

  solarTermCache.set(key, termTime);
  return termTime;
}

function calculateSolarTermTime(year, longitude) {
  const roughDate = ROUGH_SOLAR_TERM_DATES[longitude];

  if (!roughDate) {
    throw new Error(`Unsupported solar term longitude: ${longitude}`);
  }

  const [month, day] = roughDate;
  const center = Date.UTC(year, month - 1, day, 0, 0, 0) - BEIJING_OFFSET_MS;
  let start = center - 6 * DAY_MS;
  let end = center + 6 * DAY_MS;
  let previousTime = start;
  let previousValue = longitudeDiff(sunApparentLongitude(previousTime), longitude);
  let bracket = null;

  for (let time = start + HOUR_MS; time <= end; time += HOUR_MS) {
    const value = longitudeDiff(sunApparentLongitude(time), longitude);

    if (previousValue <= 0 && value >= 0) {
      bracket = [previousTime, time];
      break;
    }

    previousTime = time;
    previousValue = value;
  }

  if (!bracket) {
    throw new Error(`Unable to bracket solar term ${longitude} for ${year}`);
  }

  let [low, high] = bracket;

  for (let i = 0; i < 60; i += 1) {
    const middle = (low + high) / 2;

    if (longitudeDiff(sunApparentLongitude(middle), longitude) < 0) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return Math.round((low + high) / 2);
}

function sunApparentLongitude(timeMs) {
  const jd = timeMs / DAY_MS + 2440587.5;
  const t = (jd - 2451545.0) / 36525;
  const meanLongitude = normalizeDegrees(280.46646 + t * (36000.76983 + 0.0003032 * t));
  const meanAnomaly = normalizeDegrees(357.52911 + t * (35999.05029 - 0.0001537 * t));
  const center =
    Math.sin(RAD * meanAnomaly) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(RAD * 2 * meanAnomaly) * (0.019993 - 0.000101 * t) +
    Math.sin(RAD * 3 * meanAnomaly) * 0.000289;
  const trueLongitude = meanLongitude + center;
  const omega = 125.04 - 1934.136 * t;

  return normalizeDegrees(trueLongitude - 0.00569 - 0.00478 * Math.sin(RAD * omega));
}

function parseBeijingTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("时间格式必须为 YYYY-MM-DD HH:mm:ss");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  if (month < 1 || month > 12) {
    throw new Error("月份必须在 1-12");
  }

  if (hour < 0 || hour > 23) {
    throw new Error("小时必须在 0-23");
  }

  if (minute < 0 || minute > 59) {
    throw new Error("分钟必须在 0-59");
  }

  if (second < 0 || second > 59) {
    throw new Error("秒必须在 0-59");
  }

  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const date = new Date(utcMs);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("日期无效");
  }

  return utcMs - BEIJING_OFFSET_MS;
}

function getBeijingParts(timeMs) {
  const date = new Date(timeMs + BEIJING_OFFSET_MS);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds()
  };
}

function formatBeijingTime(timeMs) {
  const parts = getBeijingParts(timeMs);

  return [
    `${parts.year}`.padStart(4, "0"),
    `${parts.month}`.padStart(2, "0"),
    `${parts.day}`.padStart(2, "0")
  ].join("-") + ` ${`${parts.hour}`.padStart(2, "0")}:${`${parts.minute}`.padStart(2, "0")}:${`${parts.second}`.padStart(2, "0")}`;
}

function gregorianJulianDayNumber(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
}

function ganZhi(ganIndex, zhiIndex) {
  return `${HEAVENLY_STEMS[mod(ganIndex, 10)]}${EARTHLY_BRANCHES[mod(zhiIndex, 12)]}`;
}

function longitudeDiff(actual, target) {
  let diff = normalizeDegrees(actual - target);

  if (diff > 180) {
    diff -= 360;
  }

  return diff;
}

function normalizeDegrees(value) {
  return mod(value, 360);
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

module.exports = {
  calculateBaZi,
  _internal: {
    formatBeijingTime,
    getHiddenStems,
    getKongWang,
    getNaYin,
    getSolarTermTime,
    getTenGod,
    parseBeijingTime
  }
};
