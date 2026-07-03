const path = require('path');
const { buildReadingFromForm } = require(path.join(__dirname, '../code/utils/bazi/pageAdapter.js'));
const data = require(path.join(__dirname, './test-cases.js'));

const cases = Array.isArray(data.cases)
  ? data.cases
  : (Array.isArray(data.TEST_CASES) ? data.TEST_CASES : []);
const sharedDefaultOptions = data.sharedDefaultOptions || {};

function normalizeExpected(expectedPillars) {
  if (Array.isArray(expectedPillars)) return expectedPillars;
  if (expectedPillars && typeof expectedPillars === 'object') {
    return [
      expectedPillars.year,
      expectedPillars.month,
      expectedPillars.day,
      expectedPillars.hour
    ];
  }
  return [];
}

function normalizeInput(input = {}) {
  if (!input || typeof input !== 'object') return null;
  if (input.solar_time) {
    const [birthDate, birthTime] = input.solar_time.split(' ');
    if (!birthDate || !birthTime) return null;
    return {
      ...input,
      birthDate,
      birthTime,
      useTrueSolarTime: input.use_true_solar !== undefined ? input.use_true_solar : input.useTrueSolarTime,
      useDST: input.use_dst !== undefined ? input.use_dst : input.useDST,
      useSummerTime: input.use_dst !== undefined ? input.use_dst : input.useSummerTime,
      useEarlyLateZi: input.use_early_late_zi !== undefined ? input.use_early_late_zi : input.useEarlyLateZi
    };
  }
  if (input.birthDate && input.birthTime) {
    return {
      ...input,
      useTrueSolarTime: input.use_true_solar !== undefined ? input.use_true_solar : input.useTrueSolarTime,
      useDST: input.use_dst !== undefined ? input.use_dst : input.useDST,
      useSummerTime: input.use_dst !== undefined ? input.use_dst : input.useSummerTime,
      useEarlyLateZi: input.use_early_late_zi !== undefined ? input.use_early_late_zi : input.useEarlyLateZi
    };
  }
  return null;
}

function runCase(caseItem) {
  const id = caseItem.case_id || caseItem.id;
  const title = caseItem.scene || caseItem.title || `Case ${id}`;
  const expected = normalizeExpected(caseItem.expect || caseItem.expectedPillars);
  const input = normalizeInput(caseItem.input);

  if (!input || !input.birthDate || !input.birthTime) {
    return {
      id,
      title,
      passed: false,
      blocked: true,
      expected: expected.join(' '),
      actual: '未执行',
      message: '缺少 solar_time 或 birthDate/birthTime'
    };
  }

  try {
    const form = {
      ...sharedDefaultOptions,
      ...input,
      termsData: {
        ...(sharedDefaultOptions.termsData || {}),
        ...(input.termsData || {})
      }
    };
    const result = buildReadingFromForm(form, form);
    const actual = [
      result.pillarsP0.year.fullStemBranch,
      result.pillarsP0.month.fullStemBranch,
      result.pillarsP0.day.fullStemBranch,
      result.pillarsP0.hour.fullStemBranch
    ];
    const passed = actual.join(' / ') === expected.join(' / ');

    return {
      id,
      title,
      passed,
      expected: expected.join(' '),
      actual: actual.join(' '),
      message: passed ? '' : '四柱不一致'
    };
  } catch (error) {
    return {
      id,
      title,
      passed: false,
      blocked: false,
      expected: expected.join(' '),
      actual: '执行失败',
      message: error.message
    };
  }
}

function printCase(item) {
  console.log(`\n[${item.id}] ${item.title}`);
  console.log(`结果: ${item.passed ? 'PASS' : 'FAIL'}`);
  console.log(`期望: ${item.expected}`);
  console.log(`实际: ${item.actual}`);
  if (item.message) {
    console.log(`说明: ${item.message}`);
  }
}

function printSummary(results) {
  const passCount = results.filter((item) => item.passed).length;
  const blockedCount = results.filter((item) => item.blocked).length;
  const failCount = results.filter((item) => !item.passed && !item.blocked).length;
  const total = results.length;

  console.log('\n========== 验证汇总 ==========');
  console.log(`总计: ${total}`);
  console.log(`通过: ${passCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`阻塞: ${blockedCount}`);

  if (failCount > 0 || blockedCount > 0) {
    console.log('\n未通过列表:');
    results.filter((item) => !item.passed).forEach((item) => {
      console.log(`- ${item.id} ${item.title}`);
      console.log(`  expected: ${item.expected}`);
      console.log(`  actual:   ${item.actual}`);
      console.log(`  message:  ${item.message}`);
    });
  }
}

function run() {
  const results = cases.map(runCase);
  results.forEach(printCase);
  printSummary(results);

  if (results.some((item) => !item.passed)) {
    process.exitCode = 1;
  }
}

run();
