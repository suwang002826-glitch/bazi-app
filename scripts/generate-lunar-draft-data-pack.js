const fs = require('fs');
const path = require('path');

const {
  parseHkoCsvRows,
  sha256,
  validateSourceManifest
} = require('./generate-lunar-data-pack');

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = canonicalize(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function checksumRecords(records) {
  return sha256(JSON.stringify(canonicalize(records)));
}

function validateRawSourceContent(source, content) {
  const errors = [];
  if (Buffer.byteLength(content, 'utf8') !== source.byteLength) {
    errors.push(`${source.sourceId} raw source byteLength mismatch`);
  }
  if (!source.rawSourceChecksum || source.rawSourceChecksum.value !== sha256(content)) {
    errors.push(`${source.sourceId} raw source checksum mismatch`);
  }
  return errors;
}

function findCsvSource(manifest, rawSources) {
  return (manifest.sources || []).find((source) => (
    String(source.resourceFormat).toUpperCase() === 'CSV'
      && rawSources[source.sourceId]
  ));
}

function inferLunarYears(records, gregorianYear) {
  const firstMonthStartIndex = records.findIndex((record) => (
    !record.isLeapMonth
      && record.lunarMonth === 1
      && record.lunarDay === 1
  ));

  return records.map((record, index) => ({
    ...record,
    lunarYear: firstMonthStartIndex >= 0 && index < firstMonthStartIndex
      ? gregorianYear - 1
      : gregorianYear
  }));
}

function createRecords(rows, gregorianYear) {
  const rowsWithYears = inferLunarYears(rows, gregorianYear);
  return rowsWithYears.map((row, index) => ({
    caseId: `HKO-${gregorianYear}-${String(index + 1).padStart(4, '0')}`,
    lunarYear: row.lunarYear,
    lunarMonth: row.lunarMonth,
    lunarDay: row.lunarDay,
    isLeapMonth: row.isLeapMonth,
    solarDate: row.solarDate,
    sourceNote: `HKO CSV row ${index + 2}`,
    lunarYearGanZhi: row.lunarYearGanZhi,
    lunarZodiac: row.lunarZodiac,
    lunarMonthName: row.lunarMonthName,
    lunarDayName: row.lunarDayName
  }));
}

function sourceLedgerFromManifest(manifest) {
  return (manifest.sources || []).map((source) => ({
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    sourceVersion: source.sourceVersion,
    sourceUrl: source.sourceUrl,
    dataProvider: source.dataProvider,
    datasetName: source.datasetName,
    sourceRole: source.sourceRole,
    resourceFormat: source.resourceFormat,
    byteLength: source.byteLength,
    rawSourceChecksum: source.rawSourceChecksum,
    retrievedAt: source.retrievedAt,
    note: source.note
  }));
}

function createDraftDataPackFromRawSources(manifest, rawSources, options = {}) {
  const manifestResult = validateSourceManifest(manifest);
  if (manifestResult.errors.length > 0) {
    throw new Error(`source manifest validation failed: ${manifestResult.errors.join('; ')}`);
  }

  const csvSource = findCsvSource(manifest, rawSources);
  if (!csvSource) {
    throw new Error('a declared CSV raw source is required to create a draft data-pack');
  }

  const rawCsv = rawSources[csvSource.sourceId];
  const rawErrors = validateRawSourceContent(csvSource, rawCsv);
  if (rawErrors.length > 0) {
    throw new Error(rawErrors.join('; '));
  }

  const gregorianYear = manifest.coverage.years[0];
  const records = createRecords(parseHkoCsvRows(rawCsv), gregorianYear);
  const lunarYears = Array.from(new Set(records.map((record) => record.lunarYear))).sort((a, b) => a - b);
  const generatedAt = options.generatedAt || new Date().toISOString().replace('.000Z', 'Z');

  return {
    dataPackId: manifest.targetDataPackId,
    calendarDataVersion: manifest.targetCalendarDataVersion,
    source: `data-pack-draft:${manifest.targetDataPackId}`,
    status: 'draft',
    runtimeEnabled: false,
    targetRuntimeEnabled: false,
    coverage: {
      gregorianYears: manifest.coverage.years.slice(),
      lunarYears,
      scope: 'complete Gregorian-year source draft; not a complete lunar-year runtime pack',
      completeGregorianCalendar: true,
      completeLunarCalendar: false
    },
    authoritySource: 'same-provider-multi-format:Hong Kong Observatory',
    sourceLedger: sourceLedgerFromManifest(manifest),
    generatedAt,
    generatedBy: 'lunar-draft-data-pack-generator',
    generator: {
      name: 'lunar-draft-data-pack-generator',
      version: '0.1.0',
      inputSourceId: csvSource.sourceId,
      inputChecksum: {
        algorithm: 'sha256',
        value: sha256(rawCsv)
      }
    },
    reviewLedger: [
      {
        reviewedBy: 'pending',
        reviewedAt: generatedAt,
        reviewStatus: 'pending-independent-review',
        scope: 'draft generation only; not approved for runtime',
        note: 'HKO CSV/TXT are same-provider multi-format sources. Independent review remains required before runtime use.'
      }
    ],
    recordsChecksum: {
      algorithm: 'sha256',
      value: checksumRecords(records)
    },
    records
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeModule(filePath, value) {
  fs.writeFileSync(filePath, `module.exports = ${JSON.stringify(value, null, 2)};\n`, 'utf8');
}

function parseArgs(argv) {
  const args = {
    source: '',
    rawSources: [],
    outDir: '',
    generatedAt: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--source') {
      args.source = argv[index + 1] || '';
      index += 1;
    } else if (value === '--raw-source') {
      args.rawSources.push(argv[index + 1] || '');
      index += 1;
    } else if (value === '--out-dir') {
      args.outDir = argv[index + 1] || '';
      index += 1;
    } else if (value === '--generated-at') {
      args.generatedAt = argv[index + 1] || '';
      index += 1;
    } else {
      args.unknown = value;
    }
  }

  return args;
}

function readRawSourceFiles(rawSourceArgs) {
  const rawSources = {};
  rawSourceArgs.forEach((entry) => {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex <= 0) {
      throw new Error(`raw source argument must be sourceId=path: ${entry}`);
    }
    rawSources[entry.slice(0, separatorIndex)] = fs.readFileSync(
      path.resolve(entry.slice(separatorIndex + 1)),
      'utf8'
    );
  });
  return rawSources;
}

function printUsage() {
  console.error('Usage: node scripts/generate-lunar-draft-data-pack.js --source <source-manifest.json> --raw-source <sourceId=path> --out-dir <draft-dir> [--generated-at <iso-datetime>]');
}

function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.source || !args.rawSources.length || !args.outDir || args.unknown) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    const manifest = readJson(path.resolve(args.source));
    const draft = createDraftDataPackFromRawSources(
      manifest,
      readRawSourceFiles(args.rawSources),
      { generatedAt: args.generatedAt || undefined }
    );

    fs.mkdirSync(path.resolve(args.outDir), { recursive: true });
    const jsonPath = path.join(path.resolve(args.outDir), `${draft.dataPackId}.json`);
    const jsPath = path.join(path.resolve(args.outDir), `${draft.dataPackId}.js`);
    writeJson(jsonPath, draft);
    writeModule(jsPath, draft);

    console.log(`PASS draft lunar data-pack ${draft.dataPackId}`);
    console.log(`  records: ${draft.records.length}`);
    console.log(`  gregorianYears: ${draft.coverage.gregorianYears.join(', ')}`);
    console.log(`  lunarYears: ${draft.coverage.lunarYears.join(', ')}`);
    console.log(`  completeGregorianCalendar: ${draft.coverage.completeGregorianCalendar}`);
    console.log(`  completeLunarCalendar: ${draft.coverage.completeLunarCalendar}`);
    console.log(`  runtimeEnabled: ${draft.runtimeEnabled}`);
    console.log(`  recordsChecksum: ${draft.recordsChecksum.value}`);
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  createDraftDataPackFromRawSources,
  runCli
};
