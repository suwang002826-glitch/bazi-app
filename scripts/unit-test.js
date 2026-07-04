const path = require('path');
const {
  buildBaziChart,
  getYearPillar,
  getMonthPillar,
  getDayPillar,
  getHourPillar,
  getTenGod,
  getNaYin,
  applyChinaSummerTime,
  applyTrueSolarTime,
  STEMS,
  BRANCHES,
  calculateDaYun
} = require(path.join(__dirname, '../code/utils/bazi/coreEngine.js'));
const { buildReadingFromForm } = require(path.join(__dirname, '../code/utils/bazi/pageAdapter.js'));
const {
  createBaziHistoryRecord,
  saveBaziHistoryRecord,
  listBaziHistoryRecords,
  deleteBaziHistoryRecord
} = require(path.join(__dirname, '../code/utils/bazi/historyStore.js'));
let baziExplainModule = {};
try {
  baziExplainModule = require(path.join(__dirname, '../code/utils/bazi/explanations.js'));
} catch (error) {
  baziExplainModule = {};
}
let shenShaSampleModule = {};
try {
  shenShaSampleModule = require(path.join(__dirname, '../code/utils/bazi/shenshaSamples.js'));
} catch (error) {
  shenShaSampleModule = {};
}
let citySelectorModule = {};
try {
  citySelectorModule = require(path.join(__dirname, '../code/utils/bazi/citySelector.js'));
} catch (error) {
  citySelectorModule = {};
}
let resultSectionsModule = {};
try {
  resultSectionsModule = require(path.join(__dirname, '../code/utils/bazi/resultSections.js'));
} catch (error) {
  resultSectionsModule = {};
}

const termsData = require(path.join(__dirname, '../code/data-packs/solar-terms/solarTerms-precise-1900-2100.json'));

function toUTCDate(year, month, day, hour, minute, second = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function findTermTimeByDateText(year, matcher) {
  const yearPack = termsData[String(year)] || {};
  const matched = Object.entries(yearPack).find(([, timeText]) => matcher(timeText));
  return matched ? new Date(matched[1]) : null;
}

let passed = 0;
let failed = 0;
const failures = [];

function check(condition, message, expected, actual) {
  if (condition) {
    passed += 1;
    return;
  }
  failed += 1;
  failures.push({
    message,
    expected,
    actual
  });
}

function assertEqual(actual, expected, message) {
  check(actual === expected, message, expected, actual);
}

function runHeader(title) {
  console.log(`\n=== ${title} ===`);
}

// 1) boundary by exact term boundaries
runHeader('Boundary: year boundary around Lichun');
const lichun1988 = findTermTimeByDateText(1988, (v) => typeof v === 'string' && /-02-04T/.test(v));
const lichun2025 = findTermTimeByDateText(2025, (v) => typeof v === 'string' && /-02-03T/.test(v));
const jingzhe1990 = findTermTimeByDateText(1990, (v) => typeof v === 'string' && /-03-06T/.test(v));
const qingming2025 = findTermTimeByDateText(2025, (v) => typeof v === 'string' && /-04-04T/.test(v));

assertEqual(Boolean(lichun1988), true, 'should find 1988 Lichun from term pack');
assertEqual(Boolean(lichun2025), true, 'should find 2025 Lichun from term pack');
assertEqual(Boolean(jingzhe1990), true, 'should find 1990 Jingzhe from term pack');
assertEqual(Boolean(qingming2025), true, 'should find 2025 Qingming from term pack');

if (lichun1988) {
  const before = new Date(lichun1988.getTime() - 1000);
  const after = new Date(lichun1988.getTime() + 1000);
  const beforeYear = getYearPillar(before, termsData);
  const afterYear = getYearPillar(after, termsData);
  check(
    beforeYear.stem !== afterYear.stem || beforeYear.branch !== afterYear.branch,
    'Year pillar must change across Lichun boundary',
    'different stems/branches',
    `${beforeYear.stem}${beforeYear.branch} -> ${afterYear.stem}${afterYear.branch}`
  );
}

if (jingzhe1990) {
  const before = new Date(jingzhe1990.getTime() - 1000);
  const after = new Date(jingzhe1990.getTime() + 1000);
  const beforeYear = getYearPillar(before, termsData);
  const afterYear = getYearPillar(after, termsData);
  const beforeMonth = getMonthPillar(before, beforeYear.stem, termsData);
  const afterMonth = getMonthPillar(after, afterYear.stem, termsData);
  check(
    beforeMonth.stem !== afterMonth.stem || beforeMonth.branch !== afterMonth.branch,
    'Month pillar must change across solar-term boundary',
    'different stems/branches',
    `${beforeMonth.stem}${beforeMonth.branch} -> ${afterMonth.stem}${afterMonth.branch}`
  );
}

if (qingming2025) {
  const before = new Date(qingming2025.getTime() - 1000);
  const after = new Date(qingming2025.getTime() + 1000);
  const yearBefore = getYearPillar(before, termsData);
  const yearAfter = getYearPillar(after, termsData);
  const monthBefore = getMonthPillar(before, yearBefore.stem, termsData);
  const monthAfter = getMonthPillar(after, yearAfter.stem, termsData);
  check(
    monthBefore.stem !== monthAfter.stem || monthBefore.branch !== monthAfter.branch,
    'Month pillar must change across Qingming boundary',
    'different stems/branches',
    `${monthBefore.stem}${monthBefore.branch} -> ${monthAfter.stem}${monthAfter.branch}`
  );
}

if (lichun2025) {
  const before = new Date(lichun2025.getTime() - 1000);
  const on = new Date(lichun2025.getTime());
  const after = new Date(lichun2025.getTime() + 1000);
  const yearBefore = getYearPillar(before, termsData);
  const yearOn = getYearPillar(on, termsData);
  const yearAfter = getYearPillar(after, termsData);
  check(
    yearBefore.stem !== yearOn.stem || yearBefore.branch !== yearOn.branch,
    'Lichun exact moment should switch to new year when >= boundary',
    `${yearBefore.stem}${yearBefore.branch}`,
    `${yearOn.stem}${yearOn.branch}`
  );
  check(
    yearOn.stem === yearAfter.stem && yearOn.branch === yearAfter.branch,
    'time just after boundary must remain in new year',
    `${yearOn.stem}${yearOn.branch}`,
    `${yearAfter.stem}${yearAfter.branch}`
  );
}

// 2) day switch logic
runHeader('Boundary: day switch at 23:00 (no early-late Zi mode)');
const before23 = toUTCDate(2025, 7, 3, 22, 59, 59);
const at23 = toUTCDate(2025, 7, 3, 23, 0, 0);
const atAfter = toUTCDate(2025, 7, 3, 23, 0, 1);
const midnight = toUTCDate(2025, 7, 4, 0, 0, 0);
const beforeDay = getDayPillar(before23, { useEarlyLateZi: false });
const afterDay = getDayPillar(at23, { useEarlyLateZi: false });
const afterDay2 = getDayPillar(atAfter, { useEarlyLateZi: false });
const midnightDay = getDayPillar(midnight, { useEarlyLateZi: false });
check(
  beforeDay.stem !== afterDay.stem || beforeDay.branch !== afterDay.branch,
  'day pillar should switch at 23:00',
  'different stems/branches',
  `${beforeDay.stem}${beforeDay.branch} -> ${afterDay.stem}${afterDay.branch}`
);
check(
  afterDay.stem === afterDay2.stem && afterDay.branch === afterDay2.branch,
  '23:00 and 23:00:01 should be same day pillar',
  `${afterDay.stem}${afterDay.branch}`,
  `${afterDay2.stem}${afterDay2.branch}`
);
check(
  afterDay.stem === midnightDay.stem && afterDay.branch === midnightDay.branch,
  'day pillar should not re-switch at midnight (already switched at 23:00)',
  `${afterDay.stem}${afterDay.branch}`,
  `${midnightDay.stem}${midnightDay.branch}`
);

// 3) hour pillar branch sequence (Zi to Hai)
runHeader('Boundary: hour branches at 2-hour gates');
const hourBase = getDayPillar(toUTCDate(2025, 7, 3, 12, 0, 0), { useEarlyLateZi: false });
const hourSamples = [
  [23, BRANCHES[0]],
  [0, BRANCHES[0]],
  [1, BRANCHES[1]],
  [3, BRANCHES[2]],
  [5, BRANCHES[3]],
  [7, BRANCHES[4]],
  [9, BRANCHES[5]],
  [11, BRANCHES[6]],
  [13, BRANCHES[7]],
  [15, BRANCHES[8]],
  [17, BRANCHES[9]],
  [19, BRANCHES[10]],
  [21, BRANCHES[11]]
];
hourSamples.forEach(([hour, expectedBranch]) => {
  const actual = getHourPillar(toUTCDate(2025, 7, 4, hour, 0, 0), hourBase.stem).branch;
  assertEqual(actual, expectedBranch, `hour ${hour} should map to branch ${expectedBranch}`);
});

// 4) DST behavior
runHeader('Boundary: China DST rule');
const dstNoShift = applyChinaSummerTime(toUTCDate(1987, 4, 12, 1, 59, 0), true);
const dstShift = applyChinaSummerTime(toUTCDate(1987, 4, 12, 2, 0, 0), true);
const dstOff = applyChinaSummerTime(toUTCDate(1987, 4, 12, 2, 0, 0), false);
assertEqual(
  dstNoShift.getUTCHours(),
  1,
  'before DST start: hour unchanged should stay 1:59 (no shift in this test point)'
);
assertEqual(
  dstShift.getUTCHours(),
  1,
  'DST start: 02:00 should become 01:00'
);
assertEqual(
  dstOff.getUTCHours(),
  2,
  'DST disabled: 02:00 should stay 02:00'
);
const endOffPoint = applyChinaSummerTime(toUTCDate(1987, 9, 13, 2, 0, 0), true);
const endOnPoint = applyChinaSummerTime(toUTCDate(1987, 9, 12, 23, 0, 0), true);
assertEqual(
  endOffPoint.getUTCHours(),
  2,
  'DST end day: 02:00 should not shift (end boundary)'
);
assertEqual(
  endOnPoint.getUTCHours(),
  22,
  'DST still active on previous day: 23:00 previous day should shift by one hour'
);

// 5) True solar time behavior
runHeader('Boundary: true solar time correction');
const trueSolarEarly = applyTrueSolarTime(toUTCDate(1990, 1, 1, 12, 0, 0), 87.6, true);
const trueSolarLate = applyTrueSolarTime(toUTCDate(1990, 1, 1, 12, 0, 0), 126.6, true);
check(
  trueSolarEarly.correctionMinutes < 0,
  'longitude west of 120° should produce negative correction',
  'negative minutes',
  trueSolarEarly.correctionMinutes
);
check(
  trueSolarLate.correctionMinutes > 0,
  'longitude east of 120° should produce positive correction',
  'positive minutes',
  trueSolarLate.correctionMinutes
);
check(
  Math.abs(trueSolarEarly.correctionMinutes) > 2.0,
  'west correction should be at least 2 minutes',
  '>= 2',
  Math.abs(trueSolarEarly.correctionMinutes)
);
check(
  Math.abs(trueSolarLate.correctionMinutes) > 2.0,
  'east correction should be at least 2 minutes',
  '>= 2',
  Math.abs(trueSolarLate.correctionMinutes)
);

// 6) core semantic helpers
runHeader('Core: Ten God and NaYin mapping');
assertEqual(typeof getTenGod(STEMS[0], STEMS[0]), 'string', 'ten god should return string');
assertEqual(typeof getNaYin(STEMS[0], BRANCHES[0]), 'string', 'na yin should return string');
check(
  getTenGod(STEMS[0], STEMS[1]) !== getTenGod(STEMS[0], STEMS[0]),
  'different stem pairing should produce different ten-god label in this sample'
);

// 7) daYun integration
runHeader('Core: DaYun base calculation and mapping');
const chartMale = buildBaziChart({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  gender: '男',
  longitude: 120
});
const chartFemale = buildBaziChart({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  gender: '女',
  longitude: 120
});
check(
  chartMale.daYun && chartFemale.daYun && chartMale.daYun.direction !== chartFemale.daYun.direction,
  'male/female direction should be opposite',
  'opposite direction',
  `${chartMale.daYun && chartMale.daYun.direction} vs ${chartFemale.daYun && chartFemale.daYun.direction}`
);
check(
  chartMale.daYun && Array.isArray(chartMale.daYun.list) && chartMale.daYun.list.length >= 8,
  'male daYun should output at least 8 cycles',
  '>=8',
  chartMale.daYun && chartMale.daYun.list && chartMale.daYun.list.length
);
if (chartMale.daYun && chartMale.daYun.list.length > 0) {
  const first = chartMale.daYun.list[0];
  const step = 10;
  for (let i = 1; i < chartMale.daYun.list.length; i += 1) {
    const current = chartMale.daYun.list[i];
    check(
      current.startAge === first.startAge + i * step,
      `daYun step ${i}: startAge should +10`,
      `${first.startAge + i * step}`,
      `${current.startAge}`
    );
    check(
      current.startYear === first.startYear + i * step,
      `daYun step ${i}: startYear should +10`,
      `${first.startYear + i * step}`,
      `${current.startYear}`
    );
  }
}

// 8) adapter mapping to page result
runHeader('Adapter: bazi page mapping includes daYun cycles');
const adapted = buildReadingFromForm({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  gender: '男',
  longitude: 120,
  useTrueSolarTime: false
});
check(
  adapted && adapted.luck && Array.isArray(adapted.luck.cycles),
  'adapter should expose luck.cycles array',
  'array',
  adapted && adapted.luck
);
if (adapted.luck && Array.isArray(adapted.luck.cycles) && adapted.luck.cycles.length > 0) {
  const c0 = adapted.luck.cycles[0];
  const d0 = chartMale.daYun.list[0];
  check(
    c0.fullStemBranch === d0.fullStemBranch,
    'first cycle full stem-branch should keep core value',
    d0.fullStemBranch,
    c0.fullStemBranch
  );
  check(
    c0.startAge === d0.startAge,
    'first cycle startAge should keep core value',
    d0.startAge,
    c0.startAge
  );
}

const adaptedNumericFemale = buildReadingFromForm({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  sex: 0,
  longitude: 120,
  useTrueSolarTime: false
});
check(
  adaptedNumericFemale.luck && adaptedNumericFemale.luck.direction === '\u9006',
  'adapter should preserve numeric female sex=0 as reverse daYun',
  '\u9006',
  adaptedNumericFemale.luck && adaptedNumericFemale.luck.direction
);

const adaptedLunarModeOnly = buildReadingFromForm({
  birthDate: '1990-01-01',
  birthTime: '12:00:00',
  calendarType: 'lunar',
  lunarYear: 2023,
  lunarMonth: 8,
  lunarDay: 15,
  isLeapMonth: false,
  useTrueSolarTime: false,
  useDST: false,
  useEarlyLateZi: false,
  longitude: 120,
  latitude: 39
});
check(
  adaptedLunarModeOnly.calendarConversion && adaptedLunarModeOnly.calendarConversion.isLunar === true,
  'adapter should keep calendarMode=lunar as lunar conversion mode',
  true,
  adaptedLunarModeOnly.calendarConversion && adaptedLunarModeOnly.calendarConversion.isLunar
);

// 9) adapter liuNian/liuYue mapping
runHeader('Adapter: bazi page mapping includes liuNian/liuYue data');
check(
  adapted && Array.isArray(adapted.flowYears) && adapted.flowYears.length === 81,
  'adapter should expose 81 flowYears (0-80岁)',
  81,
  adapted && adapted.flowYears && adapted.flowYears.length
);
check(
  adapted && adapted.flowYears[0].value === '庚辰',
  '0岁流年干支应为庚辰（2000年）',
  '庚辰',
  adapted && adapted.flowYears[0] && adapted.flowYears[0].value
);
check(
  adapted && adapted.flowYears[24].value === '甲辰',
  '24岁流年干支应为甲辰（2024年）',
  '甲辰',
  adapted && adapted.flowYears[24] && adapted.flowYears[24].value
);
check(
  adapted && adapted.flowYears[24].months && adapted.flowYears[24].months.length === 12,
  '每个流年应包含12个流月',
  12,
  adapted && adapted.flowYears[24].months && adapted.flowYears[24].months.length
);
check(
  adapted && adapted.flowYears[24].months[0].value === '丙寅',
  '2024年（甲年）正月寅月干支应为丙寅',
  '丙寅',
  adapted && adapted.flowYears[24].months[0] && adapted.flowYears[24].months[0].value
);
check(
  adapted && Array.isArray(adapted.flowMonths) && adapted.flowMonths.length === 1,
  'adapter should expose current flowMonth',
  1,
  adapted && adapted.flowMonths && adapted.flowMonths.length
);
// 农历输入下流年流月正确性
check(
  adaptedLunarModeOnly && Array.isArray(adaptedLunarModeOnly.flowYears) && adaptedLunarModeOnly.flowYears.length === 81,
  '农历输入下应同样返回81个流年',
  81,
  adaptedLunarModeOnly && adaptedLunarModeOnly.flowYears && adaptedLunarModeOnly.flowYears.length
);
check(
  adaptedLunarModeOnly && adaptedLunarModeOnly.flowYears[0].value === '癸卯',
  '农历2023年出生0岁流年干支应为癸卯',
  '癸卯',
  adaptedLunarModeOnly && adaptedLunarModeOnly.flowYears[0] && adaptedLunarModeOnly.flowYears[0].value
);

// 10) bazi history snapshot storage
runHeader('Adapter: bazi history local snapshot storage');
function createMemoryWxStorage(initial = {}) {
  const store = { ...initial };
  return {
    getStorageSync(key) {
      return store[key];
    },
    setStorageSync(key, value) {
      store[key] = value;
    },
    removeStorageSync(key) {
      delete store[key];
    },
    dump() {
      return store;
    }
  };
}

const historyStorage = createMemoryWxStorage();
const historyReading = {
  result: adapted,
  baziPlate: { columns: [{ label: 'year' }], rows: [] },
  shareToken: 'share-test-token'
};
const historyInput = {
  calendarType: 'solar',
  isLunar: false,
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  gender: 'male',
  useTrueSolarTime: false,
  useEarlyLateZi: false,
  longitude: 120,
  latitude: 39
};
const historyRecordA = createBaziHistoryRecord({
  reading: historyReading,
  input: historyInput,
  now: new Date('2026-07-04T10:00:00+08:00'),
  id: 'case_a'
});
check(
  historyRecordA.title.includes('2000-12-17') && historyRecordA.title.includes('male'),
  'history default title should use birth date and gender',
  'title contains birth date and gender',
  historyRecordA.title
);
check(
  historyRecordA.payload === historyReading,
  'history record should keep exact reading snapshot object',
  'same object reference',
  historyRecordA.payload === historyReading
);
saveBaziHistoryRecord(historyStorage, historyRecordA);
saveBaziHistoryRecord(historyStorage, createBaziHistoryRecord({
  reading: { result: adaptedLunarModeOnly, baziPlate: { columns: [], rows: [] } },
  input: { ...historyInput, birthDate: '1990-01-01', gender: 'female' },
  name: 'custom case',
  now: new Date('2026-07-04T11:00:00+08:00'),
  id: 'case_b'
}));
const savedHistory = listBaziHistoryRecords(historyStorage);
assertEqual(savedHistory.length, 2, 'history should save two local bazi records');
assertEqual(savedHistory[0].id, 'case_b', 'history should be sorted by saved time descending');
assertEqual(savedHistory[0].title, 'custom case', 'custom case name should override default title');
assertEqual(savedHistory[1].input.birthTime, '10:00:00', 'history should persist birth time input');
assertEqual(savedHistory[1].payload.result.flowYears.length, 81, 'history should persist full result snapshot');
const afterDelete = deleteBaziHistoryRecord(historyStorage, 'case_b');
assertEqual(afterDelete.length, 1, 'deleting one history record should leave one record');
assertEqual(afterDelete[0].id, 'case_a', 'delete should remove the selected record only');

// 11) bazi field explanation dictionary
runHeader('Adapter: bazi field explanations');
const { getBaziExplanation, listBaziExplanationTopics } = baziExplainModule;
check(
  typeof getBaziExplanation === 'function',
  'bazi field explanation helper should be importable',
  'function',
  typeof getBaziExplanation
);
check(
  typeof listBaziExplanationTopics === 'function',
  'bazi field explanation topic list should be importable',
  'function',
  typeof listBaziExplanationTopics
);

if (typeof getBaziExplanation === 'function') {
  const tenGodExplain = getBaziExplanation('tenGod', '正官');
  const hiddenStemExplain = getBaziExplanation('hiddenStem', '寅');
  const voidExplain = getBaziExplanation('void', '寅卯');
  const naYinExplain = getBaziExplanation('naYin', '涧下水');
  const spiritExplain = getBaziExplanation('spirit', '');
  const strengthExplain = getBaziExplanation('strength', '中和');

  assertEqual(tenGodExplain.title, '十神', 'ten god explanation should use standard title');
  check(
    tenGodExplain.content.includes('日干') && tenGodExplain.content.includes('生克'),
    'ten god explanation should describe basis without custom reading',
    'contains 日干 and 生克',
    tenGodExplain.content
  );
  check(
    hiddenStemExplain.content.includes('本气') && hiddenStemExplain.content.includes('藏干表'),
    'hidden stem explanation should describe fixed hidden-stem table order',
    'contains 本气 and 藏干表',
    hiddenStemExplain.content
  );
  check(
    voidExplain.content.includes('六甲旬空'),
    'void explanation should describe xun-kong basis',
    'contains 六甲旬空',
    voidExplain.content
  );
  check(
    naYinExplain.content.includes('六十甲子纳音表'),
    'na yin explanation should describe sixty-jiazi mapping',
    'contains 六十甲子纳音表',
    naYinExplain.content
  );
  check(
    spiritExplain.content.includes('问真') && spiritExplain.content.includes('不做自定义解释'),
    'spirit explanation should avoid unverified custom interpretation',
    'mentions 问真 and no custom interpretation',
    spiritExplain.content
  );
  check(
    strengthExplain.content.includes('月令') && strengthExplain.content.includes('五行'),
    'strength explanation should describe element-season basis',
    'contains 月令 and 五行',
    strengthExplain.content
  );
}

if (typeof listBaziExplanationTopics === 'function') {
  const topics = listBaziExplanationTopics();
  ['tenGod', 'hiddenStem', 'void', 'naYin', 'spirit', 'strength'].forEach((topic) => {
    check(topics.includes(topic), `explanation topics should include ${topic}`, topic, topics.join(','));
  });
}

// 12) WenZhen ShenSha sample intake guard
runHeader('Adapter: WenZhen shensha sample intake schema');
const {
  REQUIRED_WENZHEN_SHENSHA,
  createWenZhenShenShaSampleTemplate,
  validateWenZhenShenShaSample,
  summarizeWenZhenShenShaReadiness
} = shenShaSampleModule;

check(
  Array.isArray(REQUIRED_WENZHEN_SHENSHA),
  'required WenZhen shensha list should be importable',
  'array',
  typeof REQUIRED_WENZHEN_SHENSHA
);
if (Array.isArray(REQUIRED_WENZHEN_SHENSHA)) {
  ['天乙贵人', '太极贵人', '文昌', '驿马', '桃花', '羊刃', '华盖', '将星', '天德', '月德'].forEach((name) => {
    check(REQUIRED_WENZHEN_SHENSHA.includes(name), `required WenZhen shensha list should include ${name}`, name, REQUIRED_WENZHEN_SHENSHA.join(','));
  });
}
check(
  typeof createWenZhenShenShaSampleTemplate === 'function',
  'WenZhen shensha sample template builder should be importable',
  'function',
  typeof createWenZhenShenShaSampleTemplate
);
check(
  typeof validateWenZhenShenShaSample === 'function',
  'WenZhen shensha sample validator should be importable',
  'function',
  typeof validateWenZhenShenShaSample
);
check(
  typeof summarizeWenZhenShenShaReadiness === 'function',
  'WenZhen shensha readiness summarizer should be importable',
  'function',
  typeof summarizeWenZhenShenShaReadiness
);

if (
  typeof createWenZhenShenShaSampleTemplate === 'function' &&
  typeof validateWenZhenShenShaSample === 'function' &&
  typeof summarizeWenZhenShenShaReadiness === 'function'
) {
  const template = createWenZhenShenShaSampleTemplate();
  assertEqual(template.length, REQUIRED_WENZHEN_SHENSHA.length, 'sample template should cover every required shensha');
  check(
    template.every((item) => item.status === 'pending_wenzhen_sample' && item.cases.length === 0),
    'sample template should be pending and contain no invented cases',
    'all pending without cases',
    JSON.stringify(template[0])
  );

  const invalidSample = validateWenZhenShenShaSample({
    spiritName: '天乙贵人',
    rule: { basis: '年干/日干', calculation: '以问真截图为准' },
    cases: []
  });
  assertEqual(invalidSample.ok, false, 'validator should reject shensha sample without verified cases');

  const validSample = validateWenZhenShenShaSample({
    spiritName: '天乙贵人',
    rule: {
      basis: '以问真八字实际显示为准',
      calculation: '记录问真页面命中的柱位和地支，不自行外推'
    },
    cases: [{
      caseId: 'wz-tygr-001',
      source: '问真八字',
      screenshotRef: 'wenzhen-tygr-001.png',
      input: {
        solarTime: '1990-01-01 12:00:00',
        gender: '男',
        longitude: 120,
        latitude: 39,
        useTrueSolarTime: false,
        useDst: false
      },
      expect: {
        pillars: {
          year: '己巳',
          month: '丙子',
          day: '丙寅',
          hour: '甲午'
        },
        spirits: [{
          name: '天乙贵人',
          location: '年柱',
          branch: '巳'
        }]
      }
    }]
  });
  assertEqual(validSample.ok, true, 'validator should accept complete WenZhen-backed shensha sample shape');

  const readiness = summarizeWenZhenShenShaReadiness(template);
  assertEqual(readiness.ready, false, 'empty shensha template should not be ready for implementation');
  assertEqual(readiness.pendingCount, REQUIRED_WENZHEN_SHENSHA.length, 'empty shensha template should mark all targets pending');
}

// 13) frontend UX helpers: city selector
runHeader('Frontend UX: true solar city selector');
const {
  CITY_PICKER_OPTIONS,
  getCityPickerNames,
  resolveCityPickerSelection,
  findLocationByRegion
} = citySelectorModule;
check(
  Array.isArray(CITY_PICKER_OPTIONS),
  'city picker options should be importable',
  'array',
  typeof CITY_PICKER_OPTIONS
);
if (Array.isArray(CITY_PICKER_OPTIONS)) {
  check(CITY_PICKER_OPTIONS.length >= 50, 'city picker should cover at least 50 major cities', '>= 50', CITY_PICKER_OPTIONS.length);
  ['北京市', '上海市', '广州市', '深圳市', '乌鲁木齐市', '哈尔滨市', '拉萨市'].forEach((cityName) => {
    check(
      CITY_PICKER_OPTIONS.some((item) => item.name === cityName),
      `city picker should include ${cityName}`,
      cityName,
      CITY_PICKER_OPTIONS.map((item) => item.name).join(',')
    );
  });
}
check(typeof getCityPickerNames === 'function', 'city picker names helper should be importable', 'function', typeof getCityPickerNames);
check(typeof resolveCityPickerSelection === 'function', 'city picker selection resolver should be importable', 'function', typeof resolveCityPickerSelection);
check(typeof findLocationByRegion === 'function', 'city region matcher should be importable', 'function', typeof findLocationByRegion);
if (typeof getCityPickerNames === 'function' && Array.isArray(CITY_PICKER_OPTIONS)) {
  const names = getCityPickerNames();
  assertEqual(names.length, CITY_PICKER_OPTIONS.length, 'city picker names should match option count');
}
if (typeof resolveCityPickerSelection === 'function') {
  const urumqiIndex = Array.isArray(CITY_PICKER_OPTIONS)
    ? CITY_PICKER_OPTIONS.findIndex((item) => item.name === '乌鲁木齐市')
    : -1;
  const urumqi = resolveCityPickerSelection(urumqiIndex);
  assertEqual(urumqi && urumqi.longitude, '87.62', 'Urumqi city selection should autofill longitude');
  assertEqual(urumqi && urumqi.latitude, '43.82', 'Urumqi city selection should autofill latitude');
}
if (typeof findLocationByRegion === 'function') {
  const harbin = findLocationByRegion(['黑龙江省', '哈尔滨市', '南岗区']);
  assertEqual(harbin && harbin.longitude, '126.63', 'region picker should resolve Harbin longitude');
}

// 14) frontend UX helpers: result sections
runHeader('Frontend UX: result page collapsed sections');
const {
  getDefaultResultSectionState,
  toggleResultSection,
  findCurrentFlowYear
} = resultSectionsModule;
check(typeof getDefaultResultSectionState === 'function', 'default result section helper should be importable', 'function', typeof getDefaultResultSectionState);
check(typeof toggleResultSection === 'function', 'result section toggle helper should be importable', 'function', typeof toggleResultSection);
check(typeof findCurrentFlowYear === 'function', 'current flow year helper should be importable', 'function', typeof findCurrentFlowYear);
if (typeof getDefaultResultSectionState === 'function') {
  const defaultSections = getDefaultResultSectionState();
  ['pillarDetails', 'professionalDetails', 'luckList', 'flowYears', 'flowMonths', 'spirits'].forEach((key) => {
    assertEqual(defaultSections[key], false, `section ${key} should be collapsed by default`);
  });
}
if (typeof toggleResultSection === 'function' && typeof getDefaultResultSectionState === 'function') {
  const before = getDefaultResultSectionState();
  const after = toggleResultSection(before, 'luckList');
  assertEqual(after.luckList, true, 'toggle should expand selected section');
  assertEqual(before.luckList, false, 'toggle should not mutate previous section state');
}
if (typeof findCurrentFlowYear === 'function') {
  const flowYear = findCurrentFlowYear([
    { year: 2025, value: '乙巳', tenGod: '偏财', naYin: '覆灯火' },
    { year: 2026, value: '丙午', tenGod: '正财', naYin: '天河水' }
  ], 2026);
  assertEqual(flowYear && flowYear.yearText, '2026年', 'current flow year helper should format year text');
  assertEqual(flowYear && flowYear.value, '丙午', 'current flow year helper should return matched flow year');
}

console.log(`\nUnit Test Summary: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('--- Failures ---');
  failures.forEach((item) => {
    console.log(`- ${item.message}`);
    if (item.expected !== undefined || item.actual !== undefined) {
      console.log(`  expected: ${item.expected}`);
      console.log(`  actual:   ${item.actual}`);
    }
  });
  process.exitCode = 1;
}
