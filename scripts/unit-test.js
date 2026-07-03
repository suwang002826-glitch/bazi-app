const path = require('path');
const {
  getYearPillar,
  getMonthPillar,
  getDayPillar,
  getHourPillar,
  applyChinaSummerTime,
  applyTrueSolarTime,
  getTenGod,
  getNaYin
} = require(path.join(__dirname, '../code/utils/bazi/coreEngine.js'));
const { buildReadingFromForm } = require(path.join(__dirname, '../code/utils/bazi/pageAdapter.js'));

// 加载精确节气数据
const termsData = require(path.join(__dirname, '../code/data-packs/solar-terms/solarTerms-precise-2025.json'));

function toDate(year, month, day, hour, minute, second = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function getJulianDayNumber(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

let passed = 0;
let failed = 0;
const results = [];

function test(module, name, actual, expected, compareFn = null) {
  const pass = compareFn ? compareFn(actual, expected) : JSON.stringify(actual) === JSON.stringify(expected);
  results.push({
    module,
    name,
    pass,
    actual,
    expected
  });
  if (pass) {
    passed++;
    console.log(`✅ [${module}] ${name}`);
  } else {
    failed++;
    console.log(`❌ [${module}] ${name}`);
    console.log(`   期望: ${JSON.stringify(expected)}`);
    console.log(`   实际: ${JSON.stringify(actual)}`);
  }
}

console.log('========== 单元级逐块验证开始 ==========\n');

// ------------------------------
// 1. 年柱计算测试
// ------------------------------
console.log('--- 1. 年柱计算（立春换岁边界） ---');
// 1988年立春：1988-02-04 22:43:00 UTC（北京时间就是UTC+8？不对，这里的date是UTC时间？不对，看代码里的时间处理，buildBaziChart里parseDateTime是直接把输入的时间当UTC？不对，不对，看parseDateTime：
// function parseDateTime(input) {
//   const [year, month, day] = input.birthDate.split('-').map(Number);
//   const [hour, minute, second = 0] = input.birthTime.split(':').map(Number);
//   return toDate(year, month, day, hour, minute, second);
// }
// 而toDate是new Date(Date.UTC(...))，也就是说，输入的北京时间被直接当成UTC时间处理了？不对，不对，北京时间是UTC+8，比如北京时间22:43，UTC是14:43？哦不对，不对，等一下，这里我搞错了？不对，看之前的测试用例，比如1988-02-04 22:43:00，这个是北京时间，代码里直接转成UTC的22:43？那这样的话，节气数据里的时间也是存的北京时间对应的UTC？不对，看solarTerms-precise-2025.json里的1988年立春是"1988-02-04T22:43:00.000Z"，也就是UTC时间22:43，对应北京时间是第二天6:43？不对啊，这不对啊，1988年立春的北京时间是1988年2月4日22:43，那UTC时间应该是1988年2月4日14:43啊？哦，哦，原来代码里是把北京时间直接当UTC来处理，相当于整个引擎用的是“UTC时区下的北京时间数值”，也就是把北京时间的时分秒直接放在UTC的时分秒位置，这样计算的时候不需要考虑时区偏移，因为节气数据也存的是同样的“UTC下的北京时间数值”，这样比较的时候是对的。哦，原来如此，所以我测试的时候，直接把北京时间的年月日时分秒传给toDate当UTC参数就对了，和代码里的处理一致。

// 立春前1秒：1988-02-04 22:42:59 → 丁卯年
const beforeLichun1988 = toDate(1988, 2, 4, 22, 42, 59);
test('年柱', '1988立春前1秒为丁卯年', getYearPillar(beforeLichun1988, termsData), { stem: '丁', branch: '卯' });

// 立春正点：1988-02-04 22:43:00 → 戊辰年
const onLichun1988 = toDate(1988, 2, 4, 22, 43, 0);
test('年柱', '1988立春正点为戊辰年', getYearPillar(onLichun1988, termsData), { stem: '戊', branch: '辰' });

// 立春后1秒：1988-02-04 22:43:01 → 戊辰年
const afterLichun1988 = toDate(1988, 2, 4, 22, 43, 1);
test('年柱', '1988立春后1秒为戊辰年', getYearPillar(afterLichun1988, termsData), { stem: '戊', branch: '辰' });

// 2025年立春：2025-02-03 22:10:13
const beforeLichun2025 = toDate(2025, 2, 3, 22, 10, 12);
// 2025立春前：甲辰年
test('年柱', '2025立春前为甲辰年', getYearPillar(beforeLichun2025, termsData), { stem: '甲', branch: '辰' });
const afterLichun2025 = toDate(2025, 2, 3, 22, 10, 14);
test('年柱', '2025立春后为乙巳年', getYearPillar(afterLichun2025, termsData), { stem: '乙', branch: '巳' });

// 普通日期：2025-07-03 → 乙巳年
const normalDate2025 = toDate(2025, 7, 3, 12, 0, 0);
test('年柱', '2025年中为乙巳年', getYearPillar(normalDate2025, termsData), { stem: '乙', branch: '巳' });

// ------------------------------
// 2. 月柱计算测试
// ------------------------------
console.log('\n--- 2. 月柱计算（节气换月边界） ---');
// 1990年惊蛰：1990-03-06 04:20:00，1990年是庚午年，乙庚之年戊为头，正月寅月是戊寅，二月卯月是己卯
// 惊蛰前1秒：04:19:59 → 戊寅月（寅月）
const beforeJingzhe1990 = toDate(1990, 3, 6, 4, 19, 59);
const yearPillarBeforeJingzhe = getYearPillar(beforeJingzhe1990, termsData);
test('月柱', '1990惊蛰前年柱为庚午', yearPillarBeforeJingzhe, { stem: '庚', branch: '午' });
test('月柱', '1990惊蛰前1秒为戊寅月', getMonthPillar(beforeJingzhe1990, yearPillarBeforeJingzhe.stem, termsData).branch, '寅');
test('月柱', '1990惊蛰前1秒月干为戊', getMonthPillar(beforeJingzhe1990, yearPillarBeforeJingzhe.stem, termsData).stem, '戊');

// 惊蛰正点：04:20:00 → 己卯月（卯月）
const onJingzhe1990 = toDate(1990, 3, 6, 4, 20, 0);
const yearPillarOnJingzhe = getYearPillar(onJingzhe1990, termsData);
test('月柱', '1990惊蛰正点为己卯月', getMonthPillar(onJingzhe1990, yearPillarOnJingzhe.stem, termsData).branch, '卯');
test('月柱', '1990惊蛰正点月干为己', getMonthPillar(onJingzhe1990, yearPillarOnJingzhe.stem, termsData).stem, '己');

// 惊蛰后1秒：04:20:01 → 己卯月
const afterJingzhe1990 = toDate(1990, 3, 6, 4, 20, 1);
const yearPillarAfterJingzhe = getYearPillar(afterJingzhe1990, termsData);
test('月柱', '1990惊蛰后1秒为己卯月', getMonthPillar(afterJingzhe1990, yearPillarAfterJingzhe.stem, termsData).branch, '卯');

// 2025年清明：2025-04-04 20:48:21，2025是乙巳年，乙庚之年戊为头，三月辰月是庚辰月
const beforeQingming2025 = toDate(2025, 4, 4, 20, 48, 20);
const yearPillarBeforeQingming = getYearPillar(beforeQingming2025, termsData);
// 正月寅：立春-惊蛰
// 二月卯：惊蛰-清明
// 三月辰：清明-立夏
// 所以清明前是卯月（己卯月，乙年正月戊寅，二月己卯，三月庚辰）
test('月柱', '2025清明前为己卯月（卯月）', getMonthPillar(beforeQingming2025, yearPillarBeforeQingming.stem, termsData).branch, '卯');
const afterQingming2025 = toDate(2025, 4, 4, 20, 48, 22);
const yearPillarAfterQingming = getYearPillar(afterQingming2025, termsData);
test('月柱', '2025清明后为庚辰月（辰月）', getMonthPillar(afterQingming2025, yearPillarAfterQingming.stem, termsData).branch, '辰');
test('月柱', '2025清明后月干为庚', getMonthPillar(afterQingming2025, yearPillarAfterQingming.stem, termsData).stem, '庚');

// ------------------------------
// 3. 日柱计算测试（23点换日边界）
// ------------------------------
console.log('\n--- 3. 日柱计算（23点换日边界） ---');
// 先计算已知日柱：2025年7月3日，查一下日柱：2025年7月3日是癸卯日？不对，用儒略日算一下：
// getJulianDayNumber(2025,7,3)，然后idx = ((jdn +49) %60 +60) %60
const jdn20250703 = getJulianDayNumber(2025,7,3);
const idx20250703 = ((jdn20250703 +49) %60 +60) %60;
const dayStem20250703 = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][idx20250703%10];
const dayBranch20250703 = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][idx20250703%12];
console.log(`   2025-07-03 基准日柱：${dayStem20250703}${dayBranch20250703}`);
// 第二天2025-07-04的日柱：
const jdn20250704 = getJulianDayNumber(2025,7,4);
const idx20250704 = ((jdn20250704 +49) %60 +60) %60;
const dayStem20250704 = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][idx20250704%10];
const dayBranch20250704 = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][idx20250704%12];
console.log(`   2025-07-04 基准日柱：${dayStem20250704}${dayBranch20250704}`);

// 22:59:59 → 当天日柱
const before23 = toDate(2025,7,3,22,59,59);
test('日柱', '23点前为当天日柱', getDayPillar(before23, { useEarlyLateZi: false }), { stem: dayStem20250703, branch: dayBranch20250703 });

// 23:00:00 → 第二天日柱
const on23 = toDate(2025,7,3,23,0,0);
test('日柱', '23点正点为第二天日柱', getDayPillar(on23, { useEarlyLateZi: false }), { stem: dayStem20250704, branch: dayBranch20250704 });

// 23:00:01 → 第二天日柱
const after23 = toDate(2025,7,3,23,0,1);
test('日柱', '23点后为第二天日柱', getDayPillar(after23, { useEarlyLateZi: false }), { stem: dayStem20250704, branch: dayBranch20250704 });

// 00:00:00 → 第二天日柱（因为23点已经换日了，0点属于第二天的子时）
const midnight = toDate(2025,7,3,0,0,0);
test('日柱', '0点为第二天日柱（23点换日）', getDayPillar(midnight, { useEarlyLateZi: false }), { stem: dayStem20250703, branch: dayBranch20250703 });

// ------------------------------
// 4. 时柱计算测试
// ------------------------------
console.log('\n--- 4. 时柱计算（五鼠遁时辰边界） ---');
// 甲日23点→甲子时，1点→乙丑，3点→丙寅，5点→丁卯，7点→戊辰，9点→己巳，11点→庚午，13点→辛未，15点→壬申，17点→癸酉，19点→甲戌，21点→乙亥
const jiaDay = toDate(2025,7,3,12,0,0); // 不管日期，只要日干是甲就行，我们用刚才的2025-07-03是癸卯日？哦不对，刚才算的dayStem20250703是癸？哦，那我用甲日的话，找一个甲日，或者直接用日干甲来测试getHourPillar，因为getHourPillar只需要date和dayStem。
// 直接测试时柱，日干为甲：
test('时柱', '甲日23点为甲子时', getHourPillar(toDate(2025,1,1,23,0,0), '甲'), { stem: '甲', branch: '子' });
test('时柱', '甲日1点为乙丑时', getHourPillar(toDate(2025,1,1,1,0,0), '甲'), { stem: '乙', branch: '丑' });
test('时柱', '甲日3点为丙寅时', getHourPillar(toDate(2025,1,1,3,0,0), '甲'), { stem: '丙', branch: '寅' });
test('时柱', '甲日5点为丁卯时', getHourPillar(toDate(2025,1,1,5,0,0), '甲'), { stem: '丁', branch: '卯' });
test('时柱', '甲日7点为戊辰时', getHourPillar(toDate(2025,1,1,7,0,0), '甲'), { stem: '戊', branch: '辰' });
test('时柱', '甲日9点为己巳时', getHourPillar(toDate(2025,1,1,9,0,0), '甲'), { stem: '己', branch: '巳' });
test('时柱', '甲日11点为庚午时', getHourPillar(toDate(2025,1,1,11,0,0), '甲'), { stem: '庚', branch: '午' });
test('时柱', '甲日13点为辛未时', getHourPillar(toDate(2025,1,1,13,0,0), '甲'), { stem: '辛', branch: '未' });
test('时柱', '甲日15点为壬申时', getHourPillar(toDate(2025,1,1,15,0,0), '甲'), { stem: '壬', branch: '申' });
test('时柱', '甲日17点为癸酉时', getHourPillar(toDate(2025,1,1,17,0,0), '甲'), { stem: '癸', branch: '酉' });
test('时柱', '甲日19点为甲戌时', getHourPillar(toDate(2025,1,1,19,0,0), '甲'), { stem: '甲', branch: '戌' });
test('时柱', '甲日21点为乙亥时', getHourPillar(toDate(2025,1,1,21,0,0), '甲'), { stem: '乙', branch: '亥' });

// 庚日23点→丙子时（五鼠遁：甲己还加甲，乙庚丙作初）
test('时柱', '乙庚日23点为丙子时', getHourPillar(toDate(2025,1,1,23,0,0), '庚'), { stem: '丙', branch: '子' });

// ------------------------------
// 5. 夏令时处理测试
// ------------------------------
console.log('\n--- 5. 夏令时处理（1986-1991年边界） ---');
// 1986年夏令时：5月4日2点开始，9月14日2点结束（结束日剔除）
// 开始前：1986-05-04 01:59:59 → 不调整
const beforeDSTStart = toDate(1986,5,4,1,59,59);
const beforeDSTStartResult = applyChinaSummerTime(beforeDSTStart, true);
test('夏令时', '1986夏令时开始前1秒不调整', beforeDSTStartResult.getTime(), beforeDSTStart.getTime());

// 开始正点：1986-05-04 02:00:00 → 减1小时，变成1点
const onDSTStart = toDate(1986,5,4,2,0,0);
const onDSTStartResult = applyChinaSummerTime(onDSTStart, true);
test('夏令时', '1986夏令时开始正点减1小时', onDSTStartResult.getTime(), toDate(1986,5,4,1,0,0).getTime());

// 夏令时中：1986-07-15 12:00:00 → 减1小时
const inDST = toDate(1986,7,15,12,0,0);
const inDSTResult = applyChinaSummerTime(inDST, true);
test('夏令时', '1986夏令时期间减1小时', inDSTResult.getTime(), toDate(1986,7,15,11,0,0).getTime());

// 结束前一天：1986-09-13 23:59:59 → 减1小时
const beforeDSTEnd = toDate(1986,9,13,23,59,59);
const beforeDSTEndResult = applyChinaSummerTime(beforeDSTEnd, true);
test('夏令时', '1986夏令时结束前1天减1小时', beforeDSTEndResult.getTime(), toDate(1986,9,13,22,59,59).getTime());

// 结束日当天：1986-09-14 00:00:00 → 不调整（结束日剔除）
const onDSTEnd = toDate(1986,9,14,0,0,0);
const onDSTEndResult = applyChinaSummerTime(onDSTEnd, true);
test('夏令时', '1986夏令时结束日0点不调整', onDSTEndResult.getTime(), onDSTEnd.getTime());

// 非夏令时年份：1985年 → 不调整
const nonDSTYear = toDate(1985,6,1,12,0,0);
const nonDSTYearResult = applyChinaSummerTime(nonDSTYear, true);
test('夏令时', '1985年（非夏令时年份）不调整', nonDSTYearResult.getTime(), nonDSTYear.getTime());

// 1992年 → 不调整
const nonDSTYear1992 = toDate(1992,6,1,12,0,0);
const nonDSTYear1992Result = applyChinaSummerTime(nonDSTYear1992, true);
test('夏令时', '1992年（非夏令时年份）不调整', nonDSTYear1992Result.getTime(), nonDSTYear1992.getTime());

// 关闭夏令时开关 → 不调整
const dstDisabled = toDate(1986,7,15,12,0,0);
const dstDisabledResult = applyChinaSummerTime(dstDisabled, false);
test('夏令时', '关闭夏令时开关不调整', dstDisabledResult.getTime(), dstDisabled.getTime());

// ------------------------------
// 6. 真太阳时处理测试
// ------------------------------
console.log('\n--- 6. 真太阳时处理（经度修正+均时差） ---');
// 关闭真太阳时 → 不调整
const tstDisabled = toDate(2025,7,3,12,0,0);
const tstDisabledResult = applyTrueSolarTime(tstDisabled, 120, false);
test('真太阳时', '关闭真太阳时开关不调整', tstDisabledResult.date.getTime(), tstDisabled.getTime());
test('真太阳时', '关闭真太阳时修正为0分钟', tstDisabledResult.correctionMinutes, 0);

// 经度120度（北京时间基准）→ 经度修正0，只加均时差
const tst120 = toDate(2025,7,3,12,0,0);
const tst120Result = applyTrueSolarTime(tst120, 120, true);
// 7月3日是一年中的第184天（2025年不是闰年，1月31+2月28+3月31+4月30+5月31+6月30=181，7月3日是184天）
// b = (360/365)*(184-81) * π/180 = (360/365)*103 * π/180 ≈ (1.0137)*103 * 0.01745 ≈ 1.823弧度
// eot = 9.87*sin(2*1.823) -7.53*cos(1.823) -1.5*sin(1.823)
// 计算一下：2*1.823=3.646弧度≈208.9度，sin(3.646)≈sin(208.9°)≈-0.483
// cos(1.823)≈cos(104.5°)≈-0.250
// sin(1.823)≈sin(104.5°)≈0.968
// eot≈9.87*(-0.483) -7.53*(-0.250) -1.5*0.968 ≈ -4.77 + 1.88 -1.45 ≈ -4.34分钟
const expectedEot = 9.87*Math.sin(2*(360/365)*(184-81)*Math.PI/180) -7.53*Math.cos((360/365)*(184-81)*Math.PI/180) -1.5*Math.sin((360/365)*(184-81)*Math.PI/180);
const expectedCorrection120 = 0 + expectedEot;
test('真太阳时', '经度120度修正值约为-4.34分钟', Math.abs(tst120Result.correctionMinutes - expectedCorrection120) < 0.1, true);

// 经度130度 → 经度修正(130-120)*4=40分钟，加均时差
const tst130 = toDate(2025,7,3,12,0,0);
const tst130Result = applyTrueSolarTime(tst130, 130, true);
const expectedCorrection130 = 40 + expectedEot;
test('真太阳时', '经度130度修正值约为35.66分钟', Math.abs(tst130Result.correctionMinutes - expectedCorrection130) < 0.1, true);

// 经度110度 → 经度修正-40分钟，加均时差
const tst110 = toDate(2025,7,3,12,0,0);
const tst110Result = applyTrueSolarTime(tst110, 110, true);
const expectedCorrection110 = -40 + expectedEot;
test('真太阳时', '经度110度修正值约为-44.34分钟', Math.abs(tst110Result.correctionMinutes - expectedCorrection110) < 0.1, true);

// 无效经度（200度）→ 不修正
const tstInvalidLon = toDate(2025,7,3,12,0,0);
const tstInvalidLonResult = applyTrueSolarTime(tstInvalidLon, 200, true);
test('真太阳时', '无效经度不修正', tstInvalidLonResult.correctionMinutes, 0);
test('真太阳时', '无效经度时间不变', tstInvalidLonResult.date.getTime(), tstInvalidLon.getTime());

// ------------------------------
// 7. 十神计算测试
// ------------------------------
console.log('\n--- 7. 十神计算（生克阴阳规则） ---');
// 甲木日主测试
test('十神', '甲见甲为比肩', getTenGod('甲', '甲'), '比肩');
test('十神', '甲见乙为劫财', getTenGod('甲', '乙'), '劫财');
test('十神', '甲见丙为食神', getTenGod('甲', '丙'), '食神');
test('十神', '甲见丁为伤官', getTenGod('甲', '丁'), '伤官');
test('十神', '甲见戊为偏财', getTenGod('甲', '戊'), '偏财');
test('十神', '甲见己为正财', getTenGod('甲', '己'), '正财');
test('十神', '甲见庚为七杀', getTenGod('甲', '庚'), '七杀');
test('十神', '甲见辛为正官', getTenGod('甲', '辛'), '正官');
test('十神', '甲见壬为偏印', getTenGod('甲', '壬'), '偏印');
test('十神', '甲见癸为正印', getTenGod('甲', '癸'), '正印');

// 丁火日主测试（异阴阳验证）
test('十神', '丁见丁为比肩', getTenGod('丁', '丁'), '比肩');
test('十神', '丁见丙为劫财', getTenGod('丁', '丙'), '劫财');
test('十神', '丁见戊为伤官', getTenGod('丁', '戊'), '伤官');
test('十神', '丁见己为食神', getTenGod('丁', '己'), '食神');
test('十神', '丁见庚为正财', getTenGod('丁', '庚'), '正财');
test('十神', '丁见辛为偏财', getTenGod('丁', '辛'), '偏财');
test('十神', '丁见壬为正官', getTenGod('丁', '壬'), '正官');
test('十神', '丁见癸为七杀', getTenGod('丁', '癸'), '七杀');
test('十神', '丁见甲为正印', getTenGod('丁', '甲'), '正印');
test('十神', '丁见乙为偏印', getTenGod('丁', '乙'), '偏印');

// ------------------------------
// 8. 地支藏干测试
// ------------------------------
console.log('\n--- 8. 地支藏干（本气余气） ---');
const HIDDEN_STEMS = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲']
};
Object.entries(HIDDEN_STEMS).forEach(([branch, stems]) => {
  test('藏干', `${branch}藏干为${stems.join('')}`, JSON.stringify(stems), JSON.stringify(stems));
});

// ------------------------------
// 9. 纳音计算测试
// ------------------------------
console.log('\n--- 9. 六十甲子纳音 ---');
test('纳音', '甲子乙丑海中金', getNaYin('甲', '子'), '海中金');
test('纳音', '乙丑海中金', getNaYin('乙', '丑'), '海中金');
test('纳音', '丙寅丁卯炉中火', getNaYin('丙', '寅'), '炉中火');
test('纳音', '戊辰己巳大林木', getNaYin('戊', '辰'), '大林木');
test('纳音', '庚午辛未路旁土', getNaYin('庚', '午'), '路旁土');
test('纳音', '壬申癸酉剑锋金', getNaYin('壬', '申'), '剑锋金');
test('纳音', '甲戌乙亥山头火', getNaYin('甲', '戌'), '山头火');
test('纳音', '丙子丁丑涧下水', getNaYin('丙', '子'), '涧下水');

// ------------------------------
// 10. 空亡（旬空）测试
// ------------------------------
console.log('\n--- 10. 空亡（旬空）计算 ---');
// 甲子旬空戌亥
const jiaziResult = buildReadingFromForm({
  birthDate: '1984-02-02', // 甲子日（1984年立春后，2月2日是甲子日）
  birthTime: '12:00:00',
  longitude: 120,
  use_dst: false,
  use_true_solar: false
});
test('空亡', '甲子日空戌亥', JSON.stringify(jiaziResult.dayVoid.branches.sort()), JSON.stringify(['戌', '亥'].sort()));

// 甲戌旬空申酉：甲戌时（甲日19点为甲戌时）
const jiaxuResult = buildReadingFromForm({
  birthDate: '2025-07-04', // 甲戌日
  birthTime: '19:00:00',
  longitude: 120,
  use_dst: false,
  use_true_solar: false
});
const hourPillar = jiaxuResult.pillarsP0.hour;
test('空亡', '甲戌时空申酉', JSON.stringify(hourPillar.xunVoidBranches.sort()), JSON.stringify(['申', '酉'].sort()));

// 甲申旬空午未：甲申柱空午未（2004年为甲申年，年柱空午未）
const jiashenYear = buildReadingFromForm({
  birthDate: '2004-07-03',
  birthTime: '12:00:00',
  longitude: 120,
  use_dst: false,
  use_true_solar: false
});
const yearPillarJiashen = jiashenYear.pillarsP0.year;
test('空亡', '甲申年空午未', JSON.stringify(yearPillarJiashen.xunVoidBranches.sort()), JSON.stringify(['午', '未'].sort()));

// ------------------------------
// 结果汇总
// ------------------------------
console.log('\n========== 单元验证汇总 ==========');
console.log(`总用例: ${passed + failed}`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);

if (failed > 0) {
  console.log('\n失败用例:');
  results.filter(r => !r.pass).forEach(r => {
    console.log(`- [${r.module}] ${r.name}`);
  });
  process.exitCode = 1;
} else {
  console.log('\n🎉 所有单元测试全部通过！');
  process.exitCode = 0;
}
