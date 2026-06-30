const lunarConversions2023 = require('../../data-packs/lunar/lunar-conversions-2023.json');
const lunarManifest = require('../../data-packs/lunar/manifest.json');

const lunarDataPacks = [lunarConversions2023];

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

module.exports = {
  lunarManifest,
  findLunarConversion
};
