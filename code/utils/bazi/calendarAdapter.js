const { baziRuleConfig } = require('./ruleConfig');
const { findLunarConversion } = require('./lunarDataPack');

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

function isExplicitLeapMonth(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function resolveCalendar(input = {}) {
  const calendarType = normalizeCalendarType(input.calendarType || input.calendarMode);
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

  const lunarInput = {
    calendarType: 'lunar',
    lunarYear: toPositiveInteger(input.lunarYear, 'lunarYear'),
    lunarMonth: toPositiveInteger(input.lunarMonth, 'lunarMonth'),
    lunarDay: toPositiveInteger(input.lunarDay, 'lunarDay'),
    isLeapMonth: isExplicitLeapMonth(input.isLeapMonth)
  };
  const match = findLunarConversion(lunarInput);
  if (!match) {
    throw new Error('Lunar date is outside the verified acceptance sample set.');
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
    warnings: [
      {
        code: 'LUNAR_DATA_PACK_SEED_ONLY',
        level: 'warning',
        message: 'Lunar data-pack currently contains acceptance seed records only.'
      }
    ]
  };
}

module.exports = {
  resolveCalendar,
  normalizeCalendarType
};
