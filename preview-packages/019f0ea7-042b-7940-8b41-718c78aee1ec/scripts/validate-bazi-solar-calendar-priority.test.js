const assert = require('assert');

global.getApp = () => ({
  globalData: {
    baziApi: {
      enabled: false
    }
  }
});

global.wx = {
  request() {
    throw new Error('wx.request should not run while local bazi engine is enabled');
  }
};

const { resolveCalendar } = require('../utils/bazi/calendarAdapter');
const { calculateBazi } = require('../utils/bazi/baziCalculator');

async function main() {
  const solarWithDefaultLunarFields = {
    name: 'WS',
    gender: '男',
    calendarType: 'solar',
    birthDate: '2002-08-26',
    birthTime: '16:45',
    lunarYear: '2023',
    lunarMonth: '8',
    lunarDay: '15',
    isLeapMonth: false,
    region: ['江苏省', '苏州市', '太仓市'],
    birthPlace: '江苏省 苏州市 太仓市',
    longitude: '116.40',
    latitude: '39.90',
    coordType: 'GCJ02',
    timeMode: 'beijingTime',
    useTrueSolarTime: false
  };

  const directCalendar = resolveCalendar(solarWithDefaultLunarFields);
  assert.strictEqual(directCalendar.birthDate, '2002-08-26');
  assert.strictEqual(directCalendar.conversion.calendarType, 'solar');
  assert.strictEqual(directCalendar.conversion.source, 'direct_solar_input');

  const reading = await calculateBazi(solarWithDefaultLunarFields);
  assert.ok(reading.result, 'expected bazi result');
  assert.strictEqual(reading.result.solarTime, '2002-08-26 16:45');
  assert.notStrictEqual(reading.result.solarTime, '2023-09-29 16:45');
  assert.strictEqual(reading.result.sourceInput.birthDate, '2002-08-26');
  assert.strictEqual(reading.result.requestPayload.calendarType, 'solar');

  const lunarCalendar = resolveCalendar({
    calendarType: 'lunar',
    birthDate: '2002-08-26',
    birthTime: '16:45',
    lunarYear: '2023',
    lunarMonth: '8',
    lunarDay: '15',
    isLeapMonth: false
  });
  assert.strictEqual(lunarCalendar.birthDate, '2023-09-29');
  assert.strictEqual(lunarCalendar.conversion.calendarType, 'lunar');

  console.log('pass: solar calendar type overrides stale default lunar fields');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
