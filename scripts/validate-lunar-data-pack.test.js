const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  validateLunarDataPackRepository
} = require('./validate-lunar-data-pack');

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createTempRepository(manifest, packs) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-data-pack-test-'));
  const lunarDir = path.join(rootDir, 'code', 'data-packs', 'lunar');
  fs.mkdirSync(lunarDir, { recursive: true });
  writeJson(path.join(lunarDir, 'manifest.json'), manifest);

  Object.entries(packs).forEach(([fileName, pack]) => {
    writeJson(path.join(lunarDir, fileName), pack);
  });

  return rootDir;
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected schema error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const result = validateLunarDataPackRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.calendarDataVersion, 'lunar-data-pack@2026.07.01');
assert.strictEqual(result.summary.status, 'acceptance-seed');
assert.strictEqual(result.summary.packCount, 1);
assert.strictEqual(result.summary.recordCount, 2);
assert.deepStrictEqual(result.summary.packIds, ['lunar-conversions-2023']);

const invalidRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-a',
        path: 'pack-a.json',
        years: [2023],
        completeLunarCalendar: false
      },
      {
        dataPackId: 'pack-b',
        path: 'pack-b.json',
        years: [2024],
        completeLunarCalendar: true
      }
    ],
    warnings: []
  },
  {
    'pack-a.json': {
      dataPackId: 'pack-a',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-a',
      status: 'test-fixture',
      coverage: {
        years: [2023],
        scope: 'test',
        completeLunarCalendar: false
      },
      records: [
        {
          caseId: 'BZI-DUP',
          lunarYear: 2023,
          lunarMonth: 1,
          lunarDay: 1,
          isLeapMonth: false,
          solarDate: '2023-01-22',
          sourceNote: 'test seed'
        }
      ]
    },
    'pack-b.json': {
      dataPackId: 'pack-b',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-b',
      status: 'test-fixture',
      coverage: {
        years: [2025],
        scope: 'test',
        completeLunarCalendar: false
      },
      records: [
        {
          caseId: 'BZI-DUP',
          lunarYear: 2023,
          lunarMonth: 1,
          lunarDay: 1,
          isLeapMonth: false,
          solarDate: '2023-01-22',
          sourceNote: 'duplicate lunar date and case id'
        },
        {
          caseId: 'BZI-OUTSIDE-YEAR',
          lunarYear: 2026,
          lunarMonth: 1,
          lunarDay: 2,
          isLeapMonth: false,
          solarDate: '2026-02-19',
          sourceNote: 'outside declared years'
        }
      ]
    }
  }
);

const invalidResult = validateLunarDataPackRepository({ rootDir: invalidRoot });
assertHasError(invalidResult.errors, 'pack-b: coverage.years [2025] does not match manifest years [2024]');
assertHasError(invalidResult.errors, 'pack-b: coverage.completeLunarCalendar false does not match manifest true');
assertHasError(invalidResult.errors, 'pack-b.records[0]: duplicate lunar date across packs 2023-1-1-normal');
assertHasError(invalidResult.errors, 'pack-b.records[0]: duplicate caseId across packs BZI-DUP');
assertHasError(invalidResult.errors, 'pack-b.records[0]: lunarYear 2023 outside coverage years 2025');

const invalidTypeRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-c',
        path: 'pack-c.json',
        years: ['2023'],
        completeLunarCalendar: false
      }
    ],
    warnings: []
  },
  {
    'pack-c.json': {
      dataPackId: 'pack-c',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-c',
      status: 'test-fixture',
      coverage: {
        years: ['2023'],
        scope: 'test'
      },
      records: [
        {
          caseId: 'BZI-TYPE',
          lunarYear: 2023,
          lunarMonth: 1,
          lunarDay: 1,
          isLeapMonth: false,
          solarDate: '2023-01-22',
          sourceNote: 'invalid year type fixture'
        }
      ]
    }
  }
);

const invalidTypeResult = validateLunarDataPackRepository({ rootDir: invalidTypeRoot });
assertHasError(invalidTypeResult.errors, 'manifest.packs[0]: years must contain only integers');
assertHasError(invalidTypeResult.errors, 'pack-c: coverage.years: years must contain only integers');
assertHasError(invalidTypeResult.errors, 'pack-c: coverage.completeLunarCalendar must be boolean');

console.log('PASS lunar data-pack schema validation');
