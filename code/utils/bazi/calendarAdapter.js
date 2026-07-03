const { baziRuleConfig } = require('./ruleConfig');
const {
  findLunarConversion,
  getLunarDataPackCoverage
} = require('./lunarDataPack');

function buildLunarConversionWarnings(match, coverage) {
  const isComplete = match && match.completeLunarCalendar && coverage.completeLunarCalendar;
  if (isComplete) return [];

  const scopeText = match && match.scope ? `（${match.scope}）` : '（部分覆盖）';
  return [
    {
      code: 'LUNAR_DATA_PACK_PARTIAL_COVERAGE',
      level: 'warning',
      message: `当前农历转换数据包为非完整覆盖${scopeText}，建议限制输入年份在[${(coverage.years && coverage.years[0]) || '-'}-${(coverage.years && coverage.years[coverage.years.length - 1]) || '-'}]内。`
    }
  ];
}

function normalizeCalendarType(value) {
  const raw = String(value || 'solar').trim().toLowerCase();
  if (['lunar', '农历', 'nongli', 'lunarleap', 'lunar_leap', 'lunarleapmonth', '农历闰月'].includes(raw)) {
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

function isExplicitLeapMonth(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function hasLunarDateFields(input = {}) {
  return input.lunarYear !== undefined
    || input.lunarMonth !== undefined
    || input.lunarDay !== undefined
    || input.isLeapMonth === true
    || input.isLeapMonth === 'true'
    || input.isLeapMonth === 1
    || input.isLeapMonth === '1';
}

function normalizeCalendarIntent(input = {}) {
  if (input.isLunar === true) return 'lunar';
  if (hasLunarDateFields(input)) return 'lunar';
  return normalizeCalendarType(input.calendarType || input.calendarMode);
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

function resolveCalendar(input = {}) {
  const calendarType = normalizeCalendarIntent(input);
  const hasLunar = hasLunarDateFields(input);
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

  if (!hasLunar) {
    return {
      birthDate: input.birthDate,
      conversion: {
        calendarType: 'solar',
        solarDate: input.birthDate,
        source: 'lunar_mode_missing_fields',
        calendarDataVersion: baziRuleConfig.calendarDataVersion,
        note: 'lunar mode is enabled but lunar date fields are missing; fallback to direct solar input.'
      },
      warnings: [
        {
          code: 'LUNAR_MODE_MISSING_FIELDS',
          level: 'warning',
          message: 'lunar mode missing fields; fallback to direct solar input.'
        }
      ]
    };
  }

  const lunarInput = {
    calendarType: 'lunar',
    lunarYear: toPositiveInteger(input.lunarYear, 'lunarYear'),
    lunarMonth: toPositiveInteger(input.lunarMonth, 'lunarMonth'),
    lunarDay: toPositiveInteger(input.lunarDay, 'lunarDay'),
    isLeapMonth: isExplicitLeapMonth(input.isLeapMonth)
  };
  const match = findLunarConversion(lunarInput);
  if (!match) {
    throw createOutsideCoverageError(lunarInput);
  }

  const coverage = getLunarDataPackCoverage();
  const warnings = buildLunarConversionWarnings(match, coverage);

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
    warnings
  };
}

module.exports = {
  resolveCalendar,
  normalizeCalendarType
};
