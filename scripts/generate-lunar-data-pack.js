const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const CHINESE_MONTHS = new Map([
  ['正月', 1],
  ['一月', 1],
  ['二月', 2],
  ['三月', 3],
  ['四月', 4],
  ['五月', 5],
  ['六月', 6],
  ['七月', 7],
  ['八月', 8],
  ['九月', 9],
  ['十月', 10],
  ['十一月', 11],
  ['十二月', 12]
]);

const CHINESE_DAYS = new Map([
  ['初一', 1],
  ['初二', 2],
  ['初三', 3],
  ['初四', 4],
  ['初五', 5],
  ['初六', 6],
  ['初七', 7],
  ['初八', 8],
  ['初九', 9],
  ['初十', 10],
  ['十一', 11],
  ['十二', 12],
  ['十三', 13],
  ['十四', 14],
  ['十五', 15],
  ['十六', 16],
  ['十七', 17],
  ['十八', 18],
  ['十九', 19],
  ['二十', 20],
  ['廿一', 21],
  ['廿二', 22],
  ['廿三', 23],
  ['廿四', 24],
  ['廿五', 25],
  ['廿六', 26],
  ['廿七', 27],
  ['廿八', 28],
  ['廿九', 29],
  ['三十', 30]
]);

const GREGORIAN_MONTHS = new Map([
  ['Jan', 1],
  ['Feb', 2],
  ['Mar', 3],
  ['Apr', 4],
  ['May', 5],
  ['Jun', 6],
  ['Jul', 7],
  ['Aug', 8],
  ['Sep', 9],
  ['Oct', 10],
  ['Nov', 11],
  ['Dec', 12]
]);

function isIsoDateTime(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(text)) {
    return false;
  }
  return !Number.isNaN(new Date(text).getTime());
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function validateRequiredText(label, value, errors) {
  if (!value || typeof value !== 'string') {
    errors.push(`${label}: missing ${label.split('.').pop()}`);
    return false;
  }
  return true;
}

function validateSha256ChecksumObject(label, checksum, errors) {
  if (!checksum || typeof checksum !== 'object') {
    errors.push(`${label} must be an object`);
    return false;
  }

  if (checksum.algorithm !== 'sha256') {
    errors.push(`${label}.algorithm must be sha256`);
  }

  if (!/^[0-9a-f]{64}$/.test(String(checksum.value || ''))) {
    errors.push(`${label}.value must be a sha256 hex digest`);
    return false;
  }

  return true;
}

function validateYearsArray(label, years, errors) {
  if (!Array.isArray(years)) {
    errors.push(`${label} must be an array`);
    return false;
  }

  if (!years.every((year) => Number.isInteger(year))) {
    errors.push(`${label} must contain only integers`);
    return false;
  }

  return true;
}

function validateCoverage(coverage, errors) {
  if (!coverage || typeof coverage !== 'object') {
    errors.push('coverage must be an object');
    return;
  }

  validateYearsArray('coverage.years', coverage.years, errors);

  if (coverage.completeLunarCalendar !== true) {
    errors.push('coverage.completeLunarCalendar must be true');
  }

  if (!coverage.scope) {
    errors.push('coverage: missing scope');
  }
}

function validateSource(source, index, errors) {
  const label = `sources[${index}]`;
  [
    'sourceId',
    'sourceRole',
    'sourceType',
    'sourceName',
    'sourceVersion',
    'dataProvider',
    'datasetName',
    'resourceFormat',
    'landingPageUrl',
    'sourceUrl',
    'retrievedAt',
    'note'
  ].forEach((field) => {
    if (!source || !source[field]) {
      errors.push(`${label}: missing ${field}`);
    }
  });

  if (source && source.resourceFormat) {
    const format = String(source.resourceFormat).toUpperCase();
    if (!['CSV', 'TXT', 'PDF', 'JSON', 'HTML'].includes(format)) {
      errors.push(`${label}: resourceFormat must be CSV, TXT, PDF, JSON, or HTML`);
    }
  }

  if (source && source.landingPageUrl && !isHttpUrl(source.landingPageUrl)) {
    errors.push(`${label}: landingPageUrl must be an http(s) URL`);
  }

  if (source && source.sourceUrl && !isHttpUrl(source.sourceUrl)) {
    errors.push(`${label}: sourceUrl must be an http(s) URL`);
  }

  if (!source || !Number.isInteger(source.byteLength) || source.byteLength <= 0) {
    errors.push(`${label}: byteLength must be a positive integer`);
  }

  if (source && source.retrievedAt && !isIsoDateTime(source.retrievedAt)) {
    errors.push(`${label}: retrievedAt must be ISO datetime`);
  }

  validateSha256ChecksumObject(`${label}: rawSourceChecksum`, source && source.rawSourceChecksum, errors);
}

function validateSources(sources, errors) {
  if (!Array.isArray(sources)) {
    errors.push('sources must be an array');
    return;
  }

  if (sources.length < 2) {
    errors.push('sources must contain at least 2 entries');
  }

  const ids = new Set();
  sources.forEach((source, index) => {
    validateSource(source, index, errors);
    if (source && source.sourceId) {
      if (ids.has(source.sourceId)) {
        errors.push(`sources[${index}]: duplicate sourceId ${source.sourceId}`);
      }
      ids.add(source.sourceId);
    }
  });
}

function validateGenerator(generator, errors) {
  if (!generator || typeof generator !== 'object') {
    errors.push('generator must be an object');
    return;
  }

  ['name', 'version', 'mode'].forEach((field) => {
    if (!generator[field]) {
      errors.push(`generator: missing ${field}`);
    }
  });

  if (generator.mode !== 'dry-run') {
    errors.push('generator.mode must be dry-run');
  }
}

function validateScaffoldRuntimeBoundary(manifest, errors) {
  if (manifest.manifestKind !== 'source-scaffold') {
    errors.push('manifestKind must be source-scaffold');
  }

  if (manifest.writesPack !== false) {
    errors.push('writesPack must be false for dry-run source manifests');
  }

  if (manifest.targetRuntimeEnabled !== false) {
    errors.push('targetRuntimeEnabled must be false for scaffold source manifests');
  }
}

function validateReviewPolicy(reviewPolicy, errors) {
  if (!reviewPolicy || typeof reviewPolicy !== 'object') {
    errors.push('reviewPolicy must be an object');
    return;
  }

  if (!Number.isInteger(reviewPolicy.minimumSourceCount) || reviewPolicy.minimumSourceCount < 2) {
    errors.push('reviewPolicy.minimumSourceCount must be an integer >= 2');
  }

  if (reviewPolicy.requiresManualReview !== true) {
    errors.push('reviewPolicy.requiresManualReview must be true');
  }

  if (reviewPolicy.runtimeEnabled !== false) {
    errors.push('reviewPolicy.runtimeEnabled must be false');
  }
}

function validateOutputPolicy(outputPolicy, errors) {
  if (!outputPolicy || typeof outputPolicy !== 'object') {
    errors.push('outputPolicy must be an object');
    return;
  }

  [
    'requiresRecordsChecksum',
    'requiresRuntimeMirrors',
    'requiresManualReviewBeforeRuntime'
  ].forEach((field) => {
    if (outputPolicy[field] !== true) {
      errors.push(`outputPolicy.${field} must be true`);
    }
  });
}

function validateSourceReviewBoundary(sourceReviewBoundary, errors) {
  if (!sourceReviewBoundary || typeof sourceReviewBoundary !== 'object') {
    errors.push('sourceReviewBoundary must be an object');
    return;
  }

  if (sourceReviewBoundary.sourceIndependence !== 'same-provider-multi-format') {
    errors.push('sourceReviewBoundary.sourceIndependence must be same-provider-multi-format');
  }

  if (sourceReviewBoundary.independentReviewRequired !== true) {
    errors.push('sourceReviewBoundary.independentReviewRequired must be true');
  }

  if (sourceReviewBoundary.independentReviewStatus !== 'pending') {
    errors.push('sourceReviewBoundary.independentReviewStatus must be pending');
  }
}

function validateSourceCountAgainstReviewPolicy(manifest, errors) {
  if (!Array.isArray(manifest.sources) || !manifest.reviewPolicy) return;
  const minimumSourceCount = manifest.reviewPolicy.minimumSourceCount;
  if (Number.isInteger(minimumSourceCount) && manifest.sources.length < minimumSourceCount) {
    errors.push('sources must contain at least reviewPolicy.minimumSourceCount entries');
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function formatIsoDate(year, month, day) {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0')
  ].join('-');
}

function parseGregorianDate(value) {
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) {
    throw new Error(`unsupported Gregorian Date "${value}"`);
  }

  const month = GREGORIAN_MONTHS.get(match[2]);
  if (!month) {
    throw new Error(`unsupported Gregorian month "${match[2]}"`);
  }

  return formatIsoDate(2000 + Number(match[3]), month, Number(match[1]));
}

function parseLunarMonth(value) {
  const monthName = String(value || '').trim();
  const isLeapMonth = monthName.startsWith('閏') || monthName.startsWith('闰');
  const plainMonthName = isLeapMonth ? monthName.slice(1) : monthName;
  const lunarMonth = CHINESE_MONTHS.get(plainMonthName);
  if (!lunarMonth) {
    throw new Error(`unsupported Lunar month "${value}"`);
  }

  return {
    isLeapMonth,
    lunarMonth,
    lunarMonthName: monthName
  };
}

function parseLunarDate(value) {
  const lunarDay = CHINESE_DAYS.get(String(value || '').trim());
  if (!lunarDay) {
    throw new Error(`unsupported Lunar Date "${value}"`);
  }
  return lunarDay;
}

function splitCsvLine(line) {
  return line.split(',').map((value) => value.trim());
}

function parseHkoCsvRows(csvText) {
  const lines = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());

  const header = lines.shift();
  const expectedHeader = 'Gregorian Date,Chinese year (Gan-Zhi),Chinese year (Zodiac),Lunar month,Lunar Date';
  if (header !== expectedHeader) {
    throw new Error('HKO CSV header is not recognized');
  }

  return lines.map((line, index) => {
    const fields = splitCsvLine(line);
    if (fields.length !== 5) {
      throw new Error(`HKO CSV row ${index + 2} must contain 5 fields`);
    }

    const lunarMonth = parseLunarMonth(fields[3]);
    return {
      solarDate: parseGregorianDate(fields[0]),
      lunarYearGanZhi: fields[1],
      lunarZodiac: fields[2],
      lunarMonth: lunarMonth.lunarMonth,
      lunarMonthName: lunarMonth.lunarMonthName,
      isLeapMonth: lunarMonth.isLeapMonth,
      lunarDay: parseLunarDate(fields[4]),
      lunarDayName: fields[4]
    };
  });
}

function summarizeLeapMonths(records) {
  const groups = new Map();

  records
    .filter((record) => record.isLeapMonth)
    .forEach((record) => {
      const key = `${record.lunarYearGanZhi}:${record.lunarMonthName}`;
      if (!groups.has(key)) {
        groups.set(key, {
          lunarYearGanZhi: record.lunarYearGanZhi,
          lunarMonth: record.lunarMonth,
          lunarMonthName: record.lunarMonthName,
          firstSolarDate: record.solarDate,
          lastSolarDate: record.solarDate,
          dayCount: 0
        });
      }
      const group = groups.get(key);
      group.dayCount += 1;
      if (record.solarDate < group.firstSolarDate) group.firstSolarDate = record.solarDate;
      if (record.solarDate > group.lastSolarDate) group.lastSolarDate = record.solarDate;
    });

  return Array.from(groups.values());
}

function createCsvRawSourceSummary(source, csvText) {
  const records = parseHkoCsvRows(csvText);
  if (records.length === 0) {
    throw new Error(`${source.sourceId} raw source contains no records`);
  }

  return {
    sourceId: source.sourceId,
    resourceFormat: source.resourceFormat,
    recordCount: records.length,
    firstSolarDate: records[0].solarDate,
    lastSolarDate: records[records.length - 1].solarDate,
    leapMonths: summarizeLeapMonths(records),
    recordsChecksumCandidate: {
      algorithm: 'sha256',
      value: sha256(JSON.stringify(records))
    },
    writesPack: false
  };
}

function validateRawSourceContent(source, content, errors) {
  const actualByteLength = Buffer.byteLength(content, 'utf8');
  if (actualByteLength !== source.byteLength) {
    errors.push(`${source.sourceId} raw source byteLength mismatch`);
  }

  const checksum = source.rawSourceChecksum;
  if (!checksum || checksum.algorithm !== 'sha256' || sha256(content) !== checksum.value) {
    errors.push(`${source.sourceId} raw source checksum mismatch`);
  }
}

function createRawSourceDryRunSummaries(manifest, rawSources = {}) {
  const errors = [];
  const summaries = [];

  Object.entries(rawSources).forEach(([sourceId, content]) => {
    const source = Array.isArray(manifest.sources)
      ? manifest.sources.find((entry) => entry.sourceId === sourceId)
      : null;
    if (!source) {
      errors.push(`${sourceId} raw source is not declared in source manifest`);
      return;
    }

    validateRawSourceContent(source, content, errors);
    if (errors.length > 0) return;

    if (String(source.resourceFormat).toUpperCase() !== 'CSV') {
      errors.push(`${sourceId} raw source parsing currently supports CSV only`);
      return;
    }

    try {
      summaries.push(createCsvRawSourceSummary(source, content));
    } catch (error) {
      errors.push(`${sourceId} raw source parse failed: ${error.message}`);
    }
  });

  return { errors, summaries };
}

function validateSourceManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { errors: ['source manifest must be an object'] };
  }

  [
    'sourceManifestVersion',
    'targetDataPackId',
    'targetCalendarDataVersion'
  ].forEach((field) => validateRequiredText(field, manifest[field], errors));

  if (manifest.status !== 'draft') {
    errors.push('status must be draft while the generator is dry-run only');
  }

  validateScaffoldRuntimeBoundary(manifest, errors);
  validateCoverage(manifest.coverage, errors);
  validateSources(manifest.sources, errors);
  validateGenerator(manifest.generator, errors);
  validateReviewPolicy(manifest.reviewPolicy, errors);
  validateOutputPolicy(manifest.outputPolicy, errors);
  validateSourceReviewBoundary(manifest.sourceReviewBoundary, errors);
  validateSourceCountAgainstReviewPolicy(manifest, errors);

  return { errors };
}

function createDryRunSummary(manifest) {
  return {
    targetDataPackId: manifest.targetDataPackId,
    targetCalendarDataVersion: manifest.targetCalendarDataVersion,
    status: manifest.status,
    years: manifest.coverage && Array.isArray(manifest.coverage.years)
      ? manifest.coverage.years.slice()
      : [],
    completeLunarCalendar: Boolean(manifest.coverage && manifest.coverage.completeLunarCalendar),
    sourceCount: Array.isArray(manifest.sources) ? manifest.sources.length : 0,
    manifestKind: manifest.manifestKind,
    writesPack: manifest.writesPack,
    runtimeEnabled: manifest.reviewPolicy ? manifest.reviewPolicy.runtimeEnabled : undefined,
    targetRuntimeEnabled: manifest.targetRuntimeEnabled,
    recordsChecksumRequired: manifest.outputPolicy
      ? manifest.outputPolicy.requiresRecordsChecksum
      : undefined,
    generatorMode: manifest.generator ? manifest.generator.mode : undefined
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function printUsage() {
  console.error('Usage: node scripts/generate-lunar-data-pack.js --check --source <source-manifest.json> [--raw-source <sourceId=path>]');
  console.error('This dry-run command validates source controls only. It does not write runtime data-pack records.');
}

function parseArgs(argv) {
  const args = {
    check: false,
    source: '',
    rawSources: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--check') {
      args.check = true;
    } else if (value === '--source') {
      args.source = argv[index + 1] || '';
      index += 1;
    } else if (value === '--raw-source') {
      args.rawSources.push(argv[index + 1] || '');
      index += 1;
    } else {
      args.unknown = value;
    }
  }

  return args;
}

function readRawSourceFiles(rawSourceArgs) {
  const rawSources = {};
  const errors = [];

  rawSourceArgs.forEach((entry) => {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex <= 0) {
      errors.push(`raw source argument must be sourceId=path: ${entry}`);
      return;
    }

    const sourceId = entry.slice(0, separatorIndex);
    const rawPath = path.resolve(entry.slice(separatorIndex + 1));
    try {
      rawSources[sourceId] = fs.readFileSync(rawPath, 'utf8');
    } catch (error) {
      errors.push(`${sourceId} raw source cannot be read: ${error.message}`);
    }
  });

  return { errors, rawSources };
}

function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.check || !args.source || args.unknown) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const sourcePath = path.resolve(args.source);
  let manifest;
  try {
    manifest = readJson(sourcePath);
  } catch (error) {
    console.error(`FAIL source manifest cannot be read: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const result = validateSourceManifest(manifest);
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  const summary = createDryRunSummary(manifest);
  const rawSourceFiles = readRawSourceFiles(args.rawSources);
  if (rawSourceFiles.errors.length > 0) {
    rawSourceFiles.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  const rawSourceSummaries = createRawSourceDryRunSummaries(manifest, rawSourceFiles.rawSources);
  if (rawSourceSummaries.errors.length > 0) {
    rawSourceSummaries.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar source manifest ${summary.targetDataPackId}`);
  console.log(`  calendar data version: ${summary.targetCalendarDataVersion}`);
  console.log(`  status: ${summary.status}`);
  console.log(`  years: ${summary.years.join(', ')}`);
  console.log(`  completeLunarCalendar: ${summary.completeLunarCalendar}`);
  console.log(`  sources: ${summary.sourceCount}`);
  console.log(`  manifestKind: ${summary.manifestKind}`);
  console.log(`  writesPack: ${summary.writesPack}`);
  console.log(`  runtimeEnabled: ${summary.runtimeEnabled}`);
  console.log(`  targetRuntimeEnabled: ${summary.targetRuntimeEnabled}`);
  console.log(`  recordsChecksumRequired: ${summary.recordsChecksumRequired}`);
  console.log(`  generatorMode: ${summary.generatorMode}`);
  rawSourceSummaries.summaries.forEach((rawSummary) => {
    const leapMonthsText = rawSummary.leapMonths.length > 0
      ? rawSummary.leapMonths.map((item) => `${item.lunarMonthName}(${item.dayCount})`).join(', ')
      : 'none';
    console.log(`  rawSource[${rawSummary.sourceId}] records: ${rawSummary.recordCount}`);
    console.log(`  rawSource[${rawSummary.sourceId}] dateRange: ${rawSummary.firstSolarDate}..${rawSummary.lastSolarDate}`);
    console.log(`  rawSource[${rawSummary.sourceId}] leapMonths: ${leapMonthsText}`);
    console.log(`  rawSource[${rawSummary.sourceId}] recordsChecksumCandidate: ${rawSummary.recordsChecksumCandidate.value}`);
    console.log(`  rawSource[${rawSummary.sourceId}] writesPack: ${rawSummary.writesPack}`);
  });
}

if (require.main === module) {
  runCli();
}

module.exports = {
  createDryRunSummary,
  createRawSourceDryRunSummaries,
  parseHkoCsvRows,
  runCli,
  sha256,
  validateSourceManifest
};
