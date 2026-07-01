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

function readJson(filePath, errors) {
  try {
    if (path.extname(filePath) === '.js') {
      const resolvedPath = require.resolve(filePath);
      delete require.cache[resolvedPath];
      return require(resolvedPath);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid limited runtime candidate (${error.message})`);
    return null;
  }
}

function canonicalText(value) {
  return JSON.stringify(canonicalize(value));
}

function requireFalse(packId, label, value, errors) {
  if (value !== false) errors.push(`${packId}: ${label} must be false`);
}

function validateCandidatePack(pack, context, fileName, errors) {
  if (!pack || typeof pack !== 'object') return 0;

  const packId = pack.dataPackId || fileName;
  if (context.manifestPackIds.has(pack.dataPackId)) {
    errors.push(`${packId}: candidate pack must not be registered in runtime manifest`);
  }

  if (pack.status !== 'candidate') errors.push(`${packId}: status must be candidate`);
  if (pack.scopeId !== 'lunar-limited-runtime-scope-2023-hko') {
    errors.push(`${packId}: scopeId must be lunar-limited-runtime-scope-2023-hko`);
  }
  if (pack.sourceDraftDataPackId !== 'lunar-conversions-2023-full-draft') {
    errors.push(`${packId}: sourceDraftDataPackId must be lunar-conversions-2023-full-draft`);
  }
  requireFalse(packId, 'runtimeEnabled', pack.runtimeEnabled, errors);
  requireFalse(packId, 'manifestRegistered', pack.manifestRegistered, errors);
  requireFalse(packId, 'completeLunarCalendar', pack.completeLunarCalendar, errors);

  if (!/^lunar-data-pack@2026\.07\.01-hko-2023-limited\.candidate\.\d+$/.test(String(pack.calendarDataVersion || ''))) {
    errors.push(`${packId}: calendarDataVersion must use hko-2023-limited candidate version`);
  }

  const coverage = pack.coverage || {};
  if (coverage.mode !== 'gregorian-year') errors.push(`${packId}: coverage.mode must be gregorian-year`);
  if (coverage.startDate !== '2023-01-01') errors.push(`${packId}: coverage.startDate must be 2023-01-01`);
  if (coverage.endDate !== '2023-12-31') errors.push(`${packId}: coverage.endDate must be 2023-12-31`);
  if (coverage.completeGregorianCalendar !== true) {
    errors.push(`${packId}: coverage.completeGregorianCalendar must be true`);
  }
  if (coverage.completeLunarCalendar !== false) {
    errors.push(`${packId}: coverage.completeLunarCalendar must be false`);
  }

  if (!context.scope || context.scope.status !== 'design-only') {
    errors.push(`${packId}: source limited runtime scope must remain design-only`);
  }
  if (context.scope && context.scope.runtimeEnabled !== false) {
    errors.push(`${packId}: source limited runtime scope runtimeEnabled must be false`);
  }

  if (!context.draft || context.draft.dataPackId !== pack.sourceDraftDataPackId) {
    errors.push(`${packId}: source draft data-pack is missing or mismatched`);
  }
  if (context.draft && pack.sourceDraftRecordsChecksum
      && context.draft.recordsChecksum
      && pack.sourceDraftRecordsChecksum.value !== context.draft.recordsChecksum.value) {
    errors.push(`${packId}: sourceDraftRecordsChecksum must match source draft recordsChecksum`);
  }

  if (!Array.isArray(pack.records)) {
    errors.push(`${packId}: records must be an array`);
    return 0;
  }
  if (pack.records.length !== 365) {
    errors.push(`${packId}: records length must be 365`);
  }
  if (pack.records[0] && pack.records[0].solarDate !== '2023-01-01') {
    errors.push(`${packId}: first record solarDate must be 2023-01-01`);
  }
  if (pack.records[pack.records.length - 1]
      && pack.records[pack.records.length - 1].solarDate !== '2023-12-31') {
    errors.push(`${packId}: last record solarDate must be 2023-12-31`);
  }

  const solarDates = new Set();
  pack.records.forEach((record, index) => {
    ['caseId', 'lunarYear', 'lunarMonth', 'lunarDay', 'isLeapMonth', 'solarDate', 'sourceNote'].forEach((field) => {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push(`${packId}.records[${index}]: missing ${field}`);
      }
    });
    if (solarDates.has(record.solarDate)) errors.push(`${packId}.records[${index}]: duplicate solarDate ${record.solarDate}`);
    solarDates.add(record.solarDate);
  });

  if (!pack.recordsChecksum || pack.recordsChecksum.algorithm !== 'sha256') {
    errors.push(`${packId}: recordsChecksum.algorithm must be sha256`);
  } else if (pack.recordsChecksum.value !== checksumRecords(pack.records)) {
    errors.push(`${packId}: recordsChecksum does not match records`);
  }
  if (context.draft && context.draft.recordsChecksum && pack.recordsChecksum
      && pack.recordsChecksum.value !== context.draft.recordsChecksum.value) {
    errors.push(`${packId}: candidate recordsChecksum must match source draft recordsChecksum`);
  }

  if (!Array.isArray(pack.reviewLedger)
      || !pack.reviewLedger.some((entry) => entry.reviewStatus === 'candidate-not-approved-for-runtime')) {
    errors.push(`${packId}: reviewLedger must keep candidate-not-approved-for-runtime`);
  }

  if (!fileName.startsWith(pack.dataPackId)) {
    errors.push(`${fileName}: file name must start with dataPackId ${pack.dataPackId}`);
  }

  return pack.records.length;
}

function validateLunarLimitedRuntimeCandidateRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const lunarDir = path.join(rootDir, 'code', 'data-packs', 'lunar');
  const candidateDir = path.join(lunarDir, 'candidates');
  const errors = [];
  const manifest = readJson(path.join(lunarDir, 'manifest.json'), errors) || { packs: [] };
  const scope = readJson(path.join(lunarDir, 'reviews', 'lunar-limited-runtime-scope-2023-hko.json'), errors);
  const draft = readJson(path.join(lunarDir, 'drafts', 'lunar-conversions-2023-full-draft.json'), errors);
  const context = {
    manifestPackIds: new Set((manifest.packs || []).map((pack) => pack.dataPackId)),
    scope,
    draft
  };

  if (!fs.existsSync(candidateDir)) {
    errors.push('lunar candidates directory is required');
    return {
      errors,
      summary: {
        candidatePackCount: 0,
        recordCount: 0
      }
    };
  }

  const jsonFiles = fs.readdirSync(candidateDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
  let recordCount = 0;
  let firstSolarDate = '';
  let lastSolarDate = '';
  let runtimeEnabled;
  let manifestRegistered;
  let completeLunarCalendar;

  jsonFiles.forEach((fileName) => {
    const jsonPath = path.join(candidateDir, fileName);
    const jsPath = path.join(candidateDir, fileName.replace(/\.json$/, '.js'));
    const jsonPack = readJson(jsonPath, errors);
    if (!fs.existsSync(jsPath)) {
      errors.push(`${fileName}: missing .js mirror`);
    } else {
      const jsPack = readJson(jsPath, errors);
      if (jsonPack && jsPack && canonicalText(jsonPack) !== canonicalText(jsPack)) {
        errors.push(`${fileName}: .json/.js mirror mismatch`);
      }
    }

    recordCount += validateCandidatePack(jsonPack, context, fileName, errors);
    if (jsonPack) {
      runtimeEnabled = jsonPack.runtimeEnabled;
      manifestRegistered = jsonPack.manifestRegistered;
      completeLunarCalendar = jsonPack.completeLunarCalendar;
      if (Array.isArray(jsonPack.records) && jsonPack.records.length > 0) {
        firstSolarDate = jsonPack.records[0].solarDate || '';
        lastSolarDate = jsonPack.records[jsonPack.records.length - 1].solarDate || '';
      }
    }
  });

  return {
    errors,
    summary: {
      candidatePackCount: jsonFiles.length,
      recordCount,
      firstSolarDate,
      lastSolarDate,
      runtimeEnabled,
      manifestRegistered,
      completeLunarCalendar
    }
  };
}

function run() {
  const result = validateLunarLimitedRuntimeCandidateRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('PASS lunar limited runtime candidate validation');
  console.log(`  candidate packs: ${result.summary.candidatePackCount}`);
  console.log(`  records: ${result.summary.recordCount}`);
  console.log(`  coverage: ${result.summary.firstSolarDate}..${result.summary.lastSolarDate}`);
  console.log(`  runtimeEnabled: ${result.summary.runtimeEnabled}`);
  console.log(`  manifestRegistered: ${result.summary.manifestRegistered}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarLimitedRuntimeCandidateRepository
};
