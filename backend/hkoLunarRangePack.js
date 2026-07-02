const hkoRangePack = require('../code/data-packs/lunar/backend/hko-lunar-1901-2100.compact.json');
const hkoRangeManifest = require('../code/data-packs/lunar/backend/hko-lunar-1901-2100.manifest.json');
const hkoRangeValidation = require('../code/data-packs/lunar/backend/hko-lunar-1901-2100.validation.json');

let lunarDateIndex;

function lunarKey(input = {}) {
  return [
    Number(input.lunarYear),
    Number(input.lunarMonth),
    Number(input.lunarDay),
    input.isLeapMonth ? 1 : 0
  ].join('-');
}

function buildLunarDateIndex() {
  const index = new Map();
  const years = hkoRangePack.years || {};
  Object.keys(years).forEach((year) => {
    const records = Array.isArray(years[year]) ? years[year] : [];
    records.forEach((record) => {
      index.set(lunarKey({
        lunarYear: record.ly,
        lunarMonth: record.lm,
        lunarDay: record.ld,
        isLeapMonth: record.le === 1
      }), {
        solarDate: record.s,
        lunarYear: record.ly,
        lunarMonth: record.lm,
        lunarDay: record.ld,
        isLeapMonth: record.le === 1,
        weekday: record.w,
        solarTermName: record.st || '',
        sourceYear: Number(year)
      });
    });
  });
  return index;
}

function getLunarDateIndex() {
  if (!lunarDateIndex) lunarDateIndex = buildLunarDateIndex();
  return lunarDateIndex;
}

function findHkoLunarRangeConversion(lunarInput = {}) {
  const record = getLunarDateIndex().get(lunarKey(lunarInput));
  if (!record) return null;

  return {
    calendarType: 'lunar',
    lunarYear: record.lunarYear,
    lunarMonth: record.lunarMonth,
    lunarDay: record.lunarDay,
    isLeapMonth: record.isLeapMonth,
    solarDate: record.solarDate,
    source: hkoRangePack.source,
    dataPackId: hkoRangePack.dataPackId,
    calendarDataVersion: hkoRangePack.calendarDataVersion,
    dataPackStatus: hkoRangePack.status,
    completeLunarCalendar: Boolean(hkoRangePack.coverage && hkoRangePack.coverage.completeLunarCalendar),
    sourceNote: `${hkoRangePack.authoritySource}; backend range ${hkoRangePack.coverage.gregorianYears[0]}-${hkoRangePack.coverage.gregorianYears[1]}.`,
    scope: 'backend_hko_lunar_range_runtime_preview',
    weekday: record.weekday,
    solarTermName: record.solarTermName,
    sourceYear: record.sourceYear,
    runtimeApproval: {
      status: hkoRangePack.status,
      validationStatus: hkoRangeValidation.status,
      totalRecords: hkoRangeValidation.totalRecords
    }
  };
}

function getHkoLunarRangePackInfo() {
  return {
    dataPackId: hkoRangeManifest.dataPackId,
    provider: 'Hong Kong Observatory',
    source: hkoRangeManifest.source,
    authoritySource: hkoRangeManifest.authoritySource,
    calendarDataVersion: hkoRangeManifest.calendarDataVersion,
    status: hkoRangeManifest.status,
    coverage: hkoRangeManifest.coverage,
    validationStatus: hkoRangeValidation.status,
    totalRecords: hkoRangeValidation.totalRecords
  };
}

module.exports = {
  findHkoLunarRangeConversion,
  getHkoLunarRangePackInfo
};
