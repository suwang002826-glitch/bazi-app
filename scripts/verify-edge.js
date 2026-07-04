const path = require('path');
const { buildReadingFromForm } = require(path.join(__dirname, '../code/utils/bazi/pageAdapter.js'));
const data = require(path.join(__dirname, './edge-cases.js'));

const cases = Array.isArray(data.cases) ? data.cases : (Array.isArray(data.EDGE_CASES) ? data.EDGE_CASES : []);
const sharedDefaultOptions = data.sharedDefaultOptions || {};

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

function toExpectedArray(expectedPillars) {
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

function runCase(caseItem) {
  const id = caseItem.case_id || caseItem.id;
  const title = caseItem.scene || caseItem.title || `Case ${id}`;
  const category = caseItem.category || '';
  const expected = toExpectedArray(caseItem.expect || caseItem.expectedPillars);
  const input = normalizeInput(caseItem.input);

  if (!input || !input.birthDate || !input.birthTime) {
    return {
      id,
      category,
      title,
      passed: false,
      expected: expected.join(' '),
      actual: 'INVALID_INPUT',
      message: 'invalid input, can not parse birthDate/birthTime'
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
      category,
      title,
      passed,
      expected: expected.join(' '),
      actual: actual.join(' '),
      message: passed ? '' : 'not match'
    };
  } catch (error) {
    return {
      id,
      category,
      title,
      passed: false,
      expected: expected.join(' '),
      actual: 'EXECUTION_ERROR',
      message: error.message
    };
  }
}

function printCase(item) {
  const prefix = `[${item.category || 'edge'}] ${item.id}`;
  console.log(`\n${prefix} ${item.title}`);
  console.log(`结果: ${item.passed ? 'PASS' : 'FAIL'}`);
  console.log(`期望: ${item.expected}`);
  console.log(`实际: ${item.actual}`);
  if (item.message) {
    console.log(`说明: ${item.message}`);
  }
}

function run() {
  const results = cases.map(runCase);
  results.forEach(printCase);

  const passCount = results.filter((item) => item.passed).length;
  const failCount = results.length - passCount;
  const total = results.length;

  console.log('\n========== 边界用例汇总 ==========');
  console.log(`总计: ${total}`);
  console.log(`通过: ${passCount}`);
  console.log(`失败: ${failCount}`);

  if (failCount > 0) {
    console.log('\n失败清单:');
    results.filter((item) => !item.passed).forEach((item) => {
      console.log(`- ${item.id} ${item.title}`);
      console.log(`  期望: ${item.expected}`);
      console.log(`  实际: ${item.actual}`);
      if (item.message) {
        console.log(`  说明: ${item.message}`);
      }
    });
    process.exitCode = 1;
  }
}

run();
