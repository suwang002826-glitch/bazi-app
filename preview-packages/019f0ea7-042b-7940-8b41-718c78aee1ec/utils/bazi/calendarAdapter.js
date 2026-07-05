const { baziRuleConfig } = require('./ruleConfig');
const {
  findLunarConversion,
  getLunarDataPackCoverage
} = require('./lunarDataPack');

function normalizeCalendarType(value) {
  const raw = String(value || 'solar').trim().toLowerCase();
  if (['lunar', '农历', 'nongli', 'lunarleap', 'lunar_leap', '农历闰月'].includes(raw)) {
    return 'lunar';
  }
  return 'solar';
}

function toPositiveInteger(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`Invalid lunar field: ${fieldName}`);
  }
  return numberValue;
}

const chineseDigits = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9
};

function parseChineseNumber(value) {
  const text = String(value || '').trim();
  if (/^\d+$/.test(text)) {
    return Number(text);
  }
  if (text.length === 1 && chineseDigits[text] !== undefined) {
    return chineseDigits[text];
  }
  if (text === '十') {
    return 10;
  }
  if (text.startsWith('十')) {
    return 10 + (chineseDigits[text.slice(1)] || 0);
  }
  if (text.endsWith('十')) {
    return (chineseDigits[text.slice(0, -1)] || 0) * 10;
  }
  if (text.includes('十')) {
    const [tens, ones] = text.split('十');
    return (chineseDigits[tens] || 0) * 10 + (chineseDigits[ones] || 0);
  }
  return undefined;
}

function parseLunarMonth(value) {
  const raw = String(value || '').trim().replace(/\s/g, '');
  const isLeapMonth = raw.startsWith('闰');
  const label = raw.replace(/^闰/, '').replace(/月$/, '');

  if (label === '正') {
    return { value: 1, isLeapMonth };
  }
  if (label === '冬') {
    return { value: 11, isLeapMonth };
  }
  if (label === '腊') {
    return { value: 12, isLeapMonth };
  }

  const month = parseChineseNumber(label);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Invalid lunar field: lunarMonth');
  }
  return { value: month, isLeapMonth };
}

function parseLunarDay(value) {
  const raw = String(value || '').trim().replace(/\s/g, '').replace(/日$/, '');
  let label = raw.replace(/^初/, '');
  if (label.startsWith('廿')) {
    label = `二十${label.slice(1)}`;
  }
  if (label.startsWith('卅')) {
    label = `三十${label.slice(1)}`;
  }

  const day = parseChineseNumber(label);
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    throw new Error('Invalid lunar field: lunarDay');
  }
  return day;
}

function parseLunarDateText(input = {}) {
  const text = String(
    input.lunarDateText || input.lunarDateLabel || input.lunarDate || ''
  ).trim().replace(/\s+/g, '');
  if (!text) {
    return {};
  }

  const match = text.match(/^(\d{4})年(闰?(?:正|冬|腊|[一二三四五六七八九十\d]+)月)(初?[一二三四五六七八九十]|廿[一二三四五六七八九]|卅|三十|\d{1,2})日?$/);
  if (!match) {
    throw new Error('Invalid lunar field: lunarDateText');
  }
  return {
    lunarYear: match[1],
    lunarMonth: match[2],
    lunarDay: match[3]
  };
}

function isExplicitLeapMonth(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function hasLunarDateFields(input = {}) {
  return input.lunarYear !== undefined
    || input.lunarMonth !== undefined
    || input.lunarDay !== undefined
    || input.lunarDateText !== undefined
    || input.lunarDateLabel !== undefined
    || input.lunarDate !== undefined
    || input.isLeapMonth !== undefined;
}

function normalizeLunarInput(input = {}) {
  const dateText = parseLunarDateText(input);
  const month = parseLunarMonth(input.lunarMonth !== undefined
    ? input.lunarMonth
    : dateText.lunarMonth);

  return {
    calendarType: 'lunar',
    lunarYear: toPositiveInteger(
      input.lunarYear !== undefined ? input.lunarYear : dateText.lunarYear,
      'lunarYear'
    ),
    lunarMonth: month.value,
    lunarDay: input.lunarDay !== undefined
      ? parseLunarDay(input.lunarDay)
      : parseLunarDay(dateText.lunarDay),
    isLeapMonth: isExplicitLeapMonth(input.isLeapMonth) || month.isLeapMonth
  };
}

function createOutsideCoverageError(lunarInput) {
  const coverage = getLunarDataPackCoverage();
  const error = new Error('Lunar date is outside verified data-pack coverage.');
  error.code = 'LUNAR_DATE_OUTSIDE_DATA_PACK_COVERAGE';
  error.details = {
    ...lunarInput,
    calendarDataVersion: coverage.calendarDataVersion,
    status: coverage.status,
    completeLunarCalendar: coverage.completeLunarCalendar,
    availablePackIds: coverage.packIds,
    availableYears: coverage.years,
    scope: baziRuleConfig.policies.lunarConversionScope
  };
  return error;
}

function createLunarDataPackWarning(match) {
  if (match.dataPackStatus === 'runtime-preview' && match.source === 'HKO_OPEN_DATA_NONGLI_2023') {
    return {
      code: 'HKO_LUNAR_DATA_PACK_RUNTIME_PREVIEW',
      level: 'info',
      message: '当前农历转换使用香港天文台开放数据运行时预览包。'
    };
  }

  if (match.dataPackStatus === 'candidate-not-runtime-approved') {
    return {
      code: 'LUNAR_DATA_PACK_PREVIEW_ONLY',
      level: 'warning',
      message: '2025 农历 data-pack 目前仅供内部预览，尚未批准为稳定排盘数据。'
    };
  }

  return {
    code: 'LUNAR_DATA_PACK_SEED_ONLY',
    level: 'warning',
    message: 'Lunar data-pack currently contains acceptance seed records only.'
  };
}

function resolveCalendar(input = {}) {
  const hasExplicitCalendarType = input.calendarType !== undefined || input.calendarMode !== undefined;
  const calendarType = hasExplicitCalendarType
    ? normalizeCalendarType(input.calendarType || input.calendarMode)
    : (hasLunarDateFields(input) ? 'lunar' : 'solar');
  if (calendarType !== 'lunar') {
    return {
      birthDate: input.birthDate,
      conversion: {
        calendarType: 'solar',
        solarDate: input.birthDate,
        source: 'direct_solar_input',
        calendarDataVersion: baziRuleConfig.calendarDataVersion
      },
      warnings: []
    };
  }

  const lunarInput = normalizeLunarInput(input);
  const match = findLunarConversion(lunarInput);
  if (!match) {
    throw createOutsideCoverageError(lunarInput);
  }

  return {
    birthDate: match.solarDate,
    conversion: {
      ...lunarInput,
      solarDate: match.solarDate,
      source: match.source,
      calendarDataVersion: match.calendarDataVersion,
      dataPackId: match.dataPackId,
      dataPackStatus: match.dataPackStatus,
      completeLunarCalendar: match.completeLunarCalendar,
      sourceNote: match.sourceNote,
      scope: baziRuleConfig.policies.lunarConversionScope
    },
    warnings: [createLunarDataPackWarning(match)]
  };
}

module.exports = {
  resolveCalendar,
  normalizeCalendarType
};
