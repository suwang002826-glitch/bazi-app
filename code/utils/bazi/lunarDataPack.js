const lunarConversions2023 = require('../../data-packs/lunar/lunar-conversions-2023');
const lunarManifest = require('../../data-packs/lunar/manifest');

const lunarPackModules = {
  'lunar-conversions-2023.js': lunarConversions2023,
  'lunar-conversions-2023.json': lunarConversions2023
};

function loadLunarDataPacks(manifest = lunarManifest) {
  return manifest.packs.filter((pack) => pack.runtimeEnabled !== false).map((pack) => {
    const dataPack = lunarPackModules[pack.path];
    if (!dataPack) {
      const error = new Error(`Lunar data-pack file is not registered: ${pack.path}`);
      error.code = 'LUNAR_DATA_PACK_NOT_REGISTERED';
      error.details = {
        dataPackId: pack.dataPackId,
        path: pack.path,
        calendarDataVersion: manifest.calendarDataVersion
      };
      throw error;
    }
    return {
      ...dataPack,
      manifestEntry: pack
    };
  });
}

const lunarDataPacks = loadLunarDataPacks();

function sameLunarDate(record, lunarInput) {
  return record.lunarYear === lunarInput.lunarYear
    && record.lunarMonth === lunarInput.lunarMonth
    && record.lunarDay === lunarInput.lunarDay
    && record.isLeapMonth === lunarInput.isLeapMonth;
}

function findLunarConversion(lunarInput) {
  for (const dataPack of lunarDataPacks) {
    const record = dataPack.records.find((item) => sameLunarDate(item, lunarInput));
    if (record) {
      return {
        ...record,
        dataPackId: dataPack.dataPackId,
        calendarDataVersion: dataPack.calendarDataVersion,
        source: dataPack.source,
        dataPackStatus: dataPack.status,
        completeLunarCalendar: Boolean(dataPack.coverage && dataPack.coverage.completeLunarCalendar)
      };
    }
  }
  return null;
}

function getLunarDataPackCoverage() {
  const runtimePacks = lunarManifest.packs.filter((pack) => pack.runtimeEnabled !== false);
  const years = Array.from(new Set(
    runtimePacks.flatMap((pack) => pack.years || [])
  )).sort((a, b) => a - b);
  const packIds = runtimePacks.map((pack) => pack.dataPackId);
  const completeLunarCalendar = runtimePacks.length > 0
    && runtimePacks.every((pack) => Boolean(pack.completeLunarCalendar));

  return {
    calendarDataVersion: lunarManifest.calendarDataVersion,
    status: lunarManifest.status,
    packIds,
    years,
    completeLunarCalendar,
    warnings: lunarManifest.warnings || []
  };
}

module.exports = {
  lunarManifest,
  loadLunarDataPacks,
  findLunarConversion,
  getLunarDataPackCoverage
};
