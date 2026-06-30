const assert = require('assert');
const path = require('path');
const {
  validateLunarDataPackRepository
} = require('./validate-lunar-data-pack');

const result = validateLunarDataPackRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.calendarDataVersion, 'lunar-data-pack@2026.07.01');
assert.strictEqual(result.summary.status, 'acceptance-seed');
assert.strictEqual(result.summary.packCount, 1);
assert.strictEqual(result.summary.recordCount, 2);
assert.deepStrictEqual(result.summary.packIds, ['lunar-conversions-2023']);

console.log('PASS lunar data-pack schema validation');
