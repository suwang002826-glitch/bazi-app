const { buildBaziChart } = require('../code/utils/bazi/coreEngine');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

// 测试案例：男命 2000-12-17 10:00 庚辰年 戊子月 己酉日 己巳时，日主己土
const chart = buildBaziChart({
  birthDate: '2000-12-17',
  birthTime: '10:00:00',
  gender: '男',
  longitude: 120
});

test('流年列表长度正确（0-80岁共81年）', () => {
  assert.strictEqual(chart.liuNian.length, 81);
});

test('出生当年（2000年）流年干支正确（庚辰）', () => {
  const ln2000 = chart.liuNian.find(ln => ln.year === 2000);
  assert.strictEqual(ln2000.ganZhi, '庚辰');
  assert.strictEqual(ln2000.age, 0);
});

test('2024年流年干支正确（甲辰）', () => {
  const ln2024 = chart.liuNian.find(ln => ln.year === 2024);
  assert.strictEqual(ln2024.ganZhi, '甲辰');
  assert.strictEqual(ln2024.age, 24);
  assert.strictEqual(ln2024.tenGod, '正官'); // 甲木克己土，阳克阴，正官
});

test('2025年流年干支正确（乙巳）', () => {
  const ln2025 = chart.liuNian.find(ln => ln.year === 2025);
  assert.strictEqual(ln2025.ganZhi, '乙巳');
  assert.strictEqual(ln2025.age, 25);
  assert.strictEqual(ln2025.tenGod, '七杀'); // 乙木克己土，阴克阴，七杀
});

test('每年流月数量正确（12个月）', () => {
  chart.liuNian.forEach(ln => {
    assert.strictEqual(ln.months.length, 12, `${ln.year}年流月数量不是12`);
  });
});

test('2024年（甲年）正月寅月干支正确（丙寅，甲己之年丙作首）', () => {
  const ln2024 = chart.liuNian.find(ln => ln.year === 2024);
  const yinYue = ln2024.months.find(m => m.name === '寅月');
  assert.strictEqual(yinYue.ganZhi, '丙寅');
  assert.strictEqual(yinYue.jieName, '立春');
});

test('2024年二月卯月干支正确（丁卯）', () => {
  const ln2024 = chart.liuNian.find(ln => ln.year === 2024);
  const maoYue = ln2024.months.find(m => m.name === '卯月');
  assert.strictEqual(maoYue.ganZhi, '丁卯');
  assert.strictEqual(maoYue.jieName, '惊蛰');
});

test('2025年（乙年）正月寅月干支正确（戊寅，乙庚之年戊为头）', () => {
  const ln2025 = chart.liuNian.find(ln => ln.year === 2025);
  const yinYue = ln2025.months.find(m => m.name === '寅月');
  assert.strictEqual(yinYue.ganZhi, '戊寅');
});

test('2024年腊月丑月干支正确（丁丑）', () => {
  const ln2024 = chart.liuNian.find(ln => ln.year === 2024);
  const chouYue = ln2024.months.find(m => m.name === '丑月');
  assert.strictEqual(chouYue.ganZhi, '丁丑');
  assert.strictEqual(chouYue.jieName, '小寒');
});

test('流年纳音正确（庚辰白蜡金）', () => {
  const ln2000 = chart.liuNian.find(ln => ln.year === 2000);
  assert.strictEqual(ln2000.naYin, '白蜡金');
});

test('流月纳音正确（丙寅炉中火）', () => {
  const ln2024 = chart.liuNian.find(ln => ln.year === 2024);
  const yinYue = ln2024.months.find(m => m.name === '寅月');
  assert.strictEqual(yinYue.naYin, '炉中火');
});

console.log(`\n=== 流年流月测试汇总 ===`);
console.log(`通过: ${passed}, 失败: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
