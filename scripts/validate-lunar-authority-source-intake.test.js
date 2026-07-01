const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  validateLunarAuthoritySourceIntakeRepository
} = require('./validate-lunar-authority-source-intake');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected source intake error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const result = validateLunarAuthoritySourceIntakeRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.templateId, 'lunar-authority-source-intake-template');
assert.strictEqual(result.summary.status, 'template');
assert.strictEqual(result.summary.minimumRequiredFields.includes('gregorianDate'), true);
assert.strictEqual(result.summary.minimumRequiredFields.includes('lunarYear'), true);
assert.strictEqual(result.summary.minimumRequiredFields.includes('isLeapMonth'), true);
assert.strictEqual(result.summary.preferredFormats.includes('csv'), true);
assert.strictEqual(result.summary.rejectsScreenshotOnly, true);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-source-intake-test-'));
const sourceDir = path.join(tempRoot, 'code', 'data-packs', 'lunar', 'sources');
writeJson(path.join(sourceDir, 'lunar-authority-source-intake-template.json'), {
  templateId: 'fixture-source-template',
  status: 'template',
  sourceTiers: [
    {
      tier: 1,
      name: 'official-data-table',
      acceptableAsPrimary: true
    }
  ],
  preferredFormats: ['pdf'],
  minimumRequiredFields: [
    'gregorianDate',
    'lunarYear',
    'lunarMonth',
    'lunarDay'
  ],
  rejectionRules: {
    screenshotOnly: false
  },
  requiredProvenanceFields: [
    'sourceName',
    'publisherOrProvider'
  ]
});

const invalidResult = validateLunarAuthoritySourceIntakeRepository({ rootDir: tempRoot });
assertHasError(invalidResult.errors, 'fixture-source-template: minimumRequiredFields must include isLeapMonth');
assertHasError(invalidResult.errors, 'fixture-source-template: preferredFormats must include csv');
assertHasError(invalidResult.errors, 'fixture-source-template: rejectionRules.screenshotOnly must be true');

console.log('PASS lunar authority source intake validation');
