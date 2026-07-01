const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  createDraftDataPackFromRawSources
} = require('./generate-lunar-draft-data-pack');
const {
  validateLunarDraftDataPackRepository
} = require('./validate-lunar-draft-data-pack');

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function createHkoCsvFixture() {
  return [
    'Gregorian Date,Chinese year (Gan-Zhi),Chinese year (Zodiac),Lunar month,Lunar Date',
    '1-Jan-23,壬寅年,虎,十二月,初十',
    '22-Jan-23,癸卯年,兔,正月,初一',
    '31-Mar-23,癸卯年,兔,閏二月,初十',
    '29-Sep-23,癸卯年,兔,八月,十五'
  ].join('\n');
}

function createManifest(csvText) {
  return {
    sourceManifestVersion: 'lunar-source-manifest@2026.07.01',
    manifestKind: 'source-scaffold',
    targetDataPackId: 'lunar-conversions-2023-full-draft',
    targetCalendarDataVersion: 'lunar-data-pack@2026.07.01-full-draft.1',
    status: 'draft',
    writesPack: false,
    targetRuntimeEnabled: false,
    coverage: {
      years: [2023],
      scope: 'complete Gregorian year source-control draft',
      completeLunarCalendar: true
    },
    sources: [
      {
        sourceId: 'fixture-hko-csv',
        sourceRole: 'primary-data',
        sourceType: 'authority-open-data',
        sourceName: 'HKO Gregorian-Lunar Calendar Conversion Table 2023 CSV',
        sourceVersion: '2023',
        dataProvider: 'Hong Kong Observatory',
        datasetName: 'Gregorian-Lunar Calendar Conversion Table',
        resourceFormat: 'CSV',
        landingPageUrl: 'https://example.invalid/hko-calendar',
        sourceUrl: 'https://example.invalid/hko-2023.csv',
        byteLength: Buffer.byteLength(csvText, 'utf8'),
        retrievedAt: '2026-07-01T00:00:00+08:00',
        rawSourceChecksum: {
          algorithm: 'sha256',
          value: sha256(csvText)
        },
        note: 'fixture HKO CSV source'
      },
      {
        sourceId: 'fixture-hko-txt',
        sourceRole: 'cross-check-text',
        sourceType: 'authority-text',
        sourceName: 'HKO Gregorian-Lunar Calendar Conversion Table 2023 Text',
        sourceVersion: '2023',
        dataProvider: 'Hong Kong Observatory',
        datasetName: 'Gregorian-Lunar Calendar Conversion Table',
        resourceFormat: 'TXT',
        landingPageUrl: 'https://example.invalid/hko-text',
        sourceUrl: 'https://example.invalid/hko-2023.txt',
        byteLength: 2345,
        retrievedAt: '2026-07-01T00:00:00+08:00',
        rawSourceChecksum: {
          algorithm: 'sha256',
          value: 'b'.repeat(64)
        },
        note: 'fixture HKO TXT source'
      }
    ],
    generator: {
      name: 'lunar-data-pack-generator',
      version: '0.1.0',
      mode: 'dry-run'
    },
    reviewPolicy: {
      minimumSourceCount: 2,
      requiresManualReview: true,
      runtimeEnabled: false
    },
    outputPolicy: {
      requiresRecordsChecksum: true,
      requiresRuntimeMirrors: true,
      requiresManualReviewBeforeRuntime: true
    },
    sourceReviewBoundary: {
      sourceIndependence: 'same-provider-multi-format',
      independentReviewRequired: true,
      independentReviewStatus: 'pending'
    }
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const csvText = createHkoCsvFixture();
const manifest = createManifest(csvText);

const draft = createDraftDataPackFromRawSources(manifest, {
  'fixture-hko-csv': csvText
}, {
  generatedAt: '2026-07-01T00:00:00+08:00'
});

assert.strictEqual(draft.dataPackId, 'lunar-conversions-2023-full-draft');
assert.strictEqual(draft.status, 'draft');
assert.strictEqual(draft.runtimeEnabled, false);
assert.strictEqual(draft.targetRuntimeEnabled, false);
assert.strictEqual(draft.coverage.completeGregorianCalendar, true);
assert.strictEqual(draft.coverage.completeLunarCalendar, false);
assert.deepStrictEqual(draft.coverage.gregorianYears, [2023]);
assert.deepStrictEqual(draft.coverage.lunarYears, [2022, 2023]);
assert.strictEqual(draft.records.length, 4);
assert.deepStrictEqual(
  draft.records.map((record) => [
    record.caseId,
    record.lunarYear,
    record.lunarMonth,
    record.lunarDay,
    record.isLeapMonth,
    record.solarDate
  ]),
  [
    ['HKO-2023-0001', 2022, 12, 10, false, '2023-01-01'],
    ['HKO-2023-0002', 2023, 1, 1, false, '2023-01-22'],
    ['HKO-2023-0003', 2023, 2, 10, true, '2023-03-31'],
    ['HKO-2023-0004', 2023, 8, 15, false, '2023-09-29']
  ]
);
assert(/^[0-9a-f]{64}$/.test(draft.recordsChecksum.value));
assert.strictEqual(draft.generator.inputChecksum.value, sha256(csvText));
assert.strictEqual(draft.reviewLedger[0].reviewStatus, 'pending-independent-review');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-draft-generator-test-'));
const sourcePath = path.join(tempRoot, 'source-manifest.json');
const csvPath = path.join(tempRoot, 'hko.csv');
const outDir = path.join(tempRoot, 'drafts');
writeJson(sourcePath, manifest);
fs.writeFileSync(csvPath, csvText, 'utf8');

const cliOutput = execFileSync(
  process.execPath,
  [
    path.join(__dirname, 'generate-lunar-draft-data-pack.js'),
    '--source',
    sourcePath,
    '--raw-source',
    `fixture-hko-csv=${csvPath}`,
    '--out-dir',
    outDir,
    '--generated-at',
    '2026-07-01T00:00:00+08:00'
  ],
  { encoding: 'utf8' }
);
assert(cliOutput.includes('PASS draft lunar data-pack lunar-conversions-2023-full-draft'));
assert(cliOutput.includes('records: 4'));
assert(cliOutput.includes('runtimeEnabled: false'));
assert(cliOutput.includes('completeLunarCalendar: false'));

const draftJsonPath = path.join(outDir, 'lunar-conversions-2023-full-draft.json');
const draftJsPath = path.join(outDir, 'lunar-conversions-2023-full-draft.js');
assert(fs.existsSync(draftJsonPath));
assert(fs.existsSync(draftJsPath));
assert.deepStrictEqual(
  JSON.parse(fs.readFileSync(draftJsonPath, 'utf8')),
  require(draftJsPath)
);

const repoRoot = path.join(tempRoot, 'repo');
const lunarDir = path.join(repoRoot, 'code', 'data-packs', 'lunar');
const draftDir = path.join(lunarDir, 'drafts');
fs.mkdirSync(draftDir, { recursive: true });
writeJson(path.join(lunarDir, 'manifest.json'), {
  calendarDataVersion: 'lunar-data-pack@test',
  status: 'acceptance-seed',
  packs: [],
  warnings: []
});
fs.writeFileSync(
  path.join(lunarDir, 'manifest.js'),
  'module.exports = { calendarDataVersion: "lunar-data-pack@test", status: "acceptance-seed", packs: [], warnings: [] };\n',
  'utf8'
);
fs.copyFileSync(draftJsonPath, path.join(draftDir, 'lunar-conversions-2023-full-draft.json'));
fs.copyFileSync(draftJsPath, path.join(draftDir, 'lunar-conversions-2023-full-draft.js'));
const validation = validateLunarDraftDataPackRepository({ rootDir: repoRoot });
assert.deepStrictEqual(validation.errors, []);
assert.strictEqual(validation.summary.draftPackCount, 1);
assert.strictEqual(validation.summary.recordCount, 4);

console.log('PASS lunar draft data-pack generation');
