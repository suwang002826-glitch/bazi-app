const assert = require('assert');
const {
  loadLunarDataPacks
} = require('../code/utils/bazi/lunarDataPack');

const disabledManifest = {
  calendarDataVersion: 'lunar-data-pack@test',
  status: 'test-fixture',
  packs: [
    {
      dataPackId: 'draft-pack',
      path: 'missing-draft-pack.js',
      years: [2023],
      completeLunarCalendar: true,
      runtimeEnabled: false
    }
  ],
  warnings: []
};

assert.deepStrictEqual(loadLunarDataPacks(disabledManifest), []);

assert.throws(
  () => loadLunarDataPacks({
    ...disabledManifest,
    packs: [
      {
        ...disabledManifest.packs[0],
        runtimeEnabled: true
      }
    ]
  }),
  (error) => error.code === 'LUNAR_DATA_PACK_NOT_REGISTERED'
);

console.log('PASS lunar runtime loader gate');
