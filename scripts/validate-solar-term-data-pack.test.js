const assert = require('assert');
const path = require('path');
const {
  validateSolarTermDataPackRepository
} = require('./validate-solar-term-data-pack');

const result = validateSolarTermDataPackRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.calendarDataVersion, 'hko-solar-term-data-pack@2026.07.03-preview');
assert.strictEqual(result.summary.status, 'hko-candidate-preview-not-runtime-approved');
assert.strictEqual(result.summary.primaryAuthority, 'Hong Kong Observatory');
assert.strictEqual(result.summary.packCount, 1);
assert.deepStrictEqual(result.summary.coveredYears, [2024, 2025, 2026]);
assert.strictEqual(result.summary.termCount, 72);
assert.deepStrictEqual(result.summary.runtimeEnabledPackIds, []);
assert.deepStrictEqual(result.summary.blockers, [
  'stable-runtime-approval-not-granted'
]);
assert.deepStrictEqual(result.summary.crossCheck.userScreenshotMatchedYears, [2024, 2026]);
assert.strictEqual(result.summary.crossCheck.comparisonRule, 'within-one-minute');
assert.strictEqual(result.summary.crossCheck.toleranceMinutes, 1);

console.log('PASS solar-term data-pack gate');
