const fs = require('fs');
const path = require('path');
const { sha256 } = require('./generate-lunar-data-pack');

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

function assertDraftAndScope(draft, scope) {
  if (!draft || draft.dataPackId !== 'lunar-conversions-2023-full-draft') {
    throw new Error('source draft must be lunar-conversions-2023-full-draft');
  }
  if (draft.status !== 'draft') throw new Error('source draft status must be draft');
  if (draft.runtimeEnabled !== false) throw new Error('source draft runtimeEnabled must be false');
  if (!Array.isArray(draft.records) || draft.records.length !== 365) {
    throw new Error('source draft must contain 365 records');
  }

  if (!scope || scope.scopeId !== 'lunar-limited-runtime-scope-2023-hko') {
    throw new Error('limited runtime scope must be lunar-limited-runtime-scope-2023-hko');
  }
  if (scope.status !== 'design-only') throw new Error('limited runtime scope must remain design-only');
  if (scope.runtimeEnabled !== false) throw new Error('limited runtime scope runtimeEnabled must be false');
  if (scope.completeLunarCalendar !== false) {
    throw new Error('limited runtime scope completeLunarCalendar must be false');
  }
}

function createLimitedRuntimeCandidateFromDraft(draft, scope, options = {}) {
  assertDraftAndScope(draft, scope);

  const records = draft.records.map((record) => ({ ...record }));
  const firstRecord = records[0] || {};
  const lastRecord = records[records.length - 1] || {};
  const generatedAt = options.generatedAt || '2026-07-01T00:00:00+08:00';

  return {
    dataPackId: 'lunar-conversions-2023-hko-limited-candidate',
    calendarDataVersion: 'lunar-data-pack@2026.07.01-hko-2023-limited.candidate.1',
    source: 'runtime-candidate:lunar-conversions-2023-hko-limited-candidate',
    status: 'candidate',
    relatedIssue: '#43',
    scopeId: scope.scopeId,
    sourceDraftDataPackId: draft.dataPackId,
    sourceDraftCalendarDataVersion: draft.calendarDataVersion,
    sourceDraftRecordsChecksum: draft.recordsChecksum,
    runtimeEnabled: false,
    manifestRegistered: false,
    completeLunarCalendar: false,
    coverage: {
      mode: 'gregorian-year',
      startDate: firstRecord.solarDate,
      endDate: lastRecord.solarDate,
      gregorianYears: [2023],
      lunarYears: draft.coverage.lunarYears.slice(),
      completeGregorianCalendar: true,
      completeLunarCalendar: false,
      scope: 'candidate for 2023 Gregorian-year limited runtime; not registered in runtime manifest'
    },
    authoritySource: draft.authoritySource,
    sourceLedger: draft.sourceLedger.map((entry) => ({ ...entry })),
    generatedAt,
    generatedBy: 'lunar-limited-runtime-candidate-generator',
    generator: {
      name: 'lunar-limited-runtime-candidate-generator',
      version: '0.1.0',
      sourceDraftDataPackId: draft.dataPackId,
      sourceScopeId: scope.scopeId
    },
    reviewLedger: [
      {
        reviewedBy: 'pending',
        reviewedAt: generatedAt,
        reviewStatus: 'candidate-not-approved-for-runtime',
        scope: 'candidate generation only; manifest registration remains blocked',
        note: 'This candidate preserves HKO 2023 draft records and adds limited runtime metadata only.'
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
    draft: '',
    scope: '',
    outDir: '',
    generatedAt: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--draft') {
      args.draft = argv[index + 1] || '';
      index += 1;
    } else if (value === '--scope') {
      args.scope = argv[index + 1] || '';
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

function printUsage() {
  console.error('Usage: node scripts/generate-lunar-limited-runtime-candidate.js --draft <draft.json> --scope <scope.json> --out-dir <candidate-dir> [--generated-at <iso-datetime>]');
}

function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.draft || !args.scope || !args.outDir || args.unknown) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    const candidate = createLimitedRuntimeCandidateFromDraft(
      readJson(path.resolve(args.draft)),
      readJson(path.resolve(args.scope)),
      { generatedAt: args.generatedAt || undefined }
    );
    fs.mkdirSync(path.resolve(args.outDir), { recursive: true });
    const jsonPath = path.join(path.resolve(args.outDir), `${candidate.dataPackId}.json`);
    const jsPath = path.join(path.resolve(args.outDir), `${candidate.dataPackId}.js`);
    writeJson(jsonPath, candidate);
    writeModule(jsPath, candidate);

    console.log(`PASS limited lunar runtime candidate ${candidate.dataPackId}`);
    console.log(`  records: ${candidate.records.length}`);
    console.log(`  coverage: ${candidate.coverage.startDate}..${candidate.coverage.endDate}`);
    console.log(`  runtimeEnabled: ${candidate.runtimeEnabled}`);
    console.log(`  manifestRegistered: ${candidate.manifestRegistered}`);
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  createLimitedRuntimeCandidateFromDraft,
  runCli
};
