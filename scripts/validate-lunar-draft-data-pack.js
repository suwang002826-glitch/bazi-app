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
    errors.push(`${filePath}: invalid draft data-pack (${error.message})`);
    return null;
  }
}

function canonicalText(value) {
  return JSON.stringify(canonicalize(value));
}

function validateDraftPack(pack, manifestPackIds, fileName, errors) {
  if (!pack || typeof pack !== 'object') return 0;

  if (manifestPackIds.has(pack.dataPackId)) {
    errors.push(`${pack.dataPackId}: draft data-pack must not be registered in runtime manifest`);
  }

  if (pack.status !== 'draft') errors.push(`${pack.dataPackId}: status must be draft`);
  if (pack.runtimeEnabled !== false) errors.push(`${pack.dataPackId}: runtimeEnabled must be false`);
  if (pack.targetRuntimeEnabled !== false) errors.push(`${pack.dataPackId}: targetRuntimeEnabled must be false`);

  if (!pack.coverage || typeof pack.coverage !== 'object') {
    errors.push(`${pack.dataPackId}: coverage must be an object`);
  } else {
    if (pack.coverage.completeGregorianCalendar !== true) {
      errors.push(`${pack.dataPackId}: coverage.completeGregorianCalendar must be true`);
    }
    if (pack.coverage.completeLunarCalendar !== false) {
      errors.push(`${pack.dataPackId}: coverage.completeLunarCalendar must be false for Gregorian-year drafts`);
    }
    if (!Array.isArray(pack.coverage.gregorianYears) || pack.coverage.gregorianYears.length === 0) {
      errors.push(`${pack.dataPackId}: coverage.gregorianYears must be a non-empty array`);
    }
    if (!Array.isArray(pack.coverage.lunarYears) || pack.coverage.lunarYears.length === 0) {
      errors.push(`${pack.dataPackId}: coverage.lunarYears must be a non-empty array`);
    }
  }

  if (!Array.isArray(pack.sourceLedger) || pack.sourceLedger.length < 2) {
    errors.push(`${pack.dataPackId}: sourceLedger must contain at least 2 entries`);
  }

  if (!pack.generator || !pack.generator.inputChecksum) {
    errors.push(`${pack.dataPackId}: generator.inputChecksum is required`);
  }

  if (!Array.isArray(pack.reviewLedger) || pack.reviewLedger.length === 0) {
    errors.push(`${pack.dataPackId}: reviewLedger must be a non-empty array`);
  } else if (!pack.reviewLedger.some((entry) => entry.reviewStatus === 'pending-independent-review')) {
    errors.push(`${pack.dataPackId}: reviewLedger must keep pending-independent-review`);
  }

  if (!Array.isArray(pack.records)) {
    errors.push(`${pack.dataPackId}: records must be an array`);
    return 0;
  }

  if (!pack.recordsChecksum || pack.recordsChecksum.algorithm !== 'sha256') {
    errors.push(`${pack.dataPackId}: recordsChecksum.algorithm must be sha256`);
  } else if (pack.recordsChecksum.value !== checksumRecords(pack.records)) {
    errors.push(`${pack.dataPackId}: recordsChecksum does not match records`);
  }

  const solarDates = new Set();
  const caseIds = new Set();
  pack.records.forEach((record, index) => {
    ['caseId', 'lunarYear', 'lunarMonth', 'lunarDay', 'isLeapMonth', 'solarDate', 'sourceNote'].forEach((field) => {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push(`${pack.dataPackId}.records[${index}]: missing ${field}`);
      }
    });
    if (caseIds.has(record.caseId)) errors.push(`${pack.dataPackId}.records[${index}]: duplicate caseId ${record.caseId}`);
    if (solarDates.has(record.solarDate)) errors.push(`${pack.dataPackId}.records[${index}]: duplicate solarDate ${record.solarDate}`);
    caseIds.add(record.caseId);
    solarDates.add(record.solarDate);
  });

  if (!fileName.startsWith(pack.dataPackId)) {
    errors.push(`${fileName}: file name must start with dataPackId ${pack.dataPackId}`);
  }

  return pack.records.length;
}

function validateLunarDraftDataPackRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const lunarDir = path.join(rootDir, 'code', 'data-packs', 'lunar');
  const draftDir = path.join(lunarDir, 'drafts');
  const manifestPath = path.join(lunarDir, 'manifest.json');
  const errors = [];
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath, errors) : { packs: [] };
  const manifestPackIds = new Set((manifest.packs || []).map((pack) => pack.dataPackId));

  if (!fs.existsSync(draftDir)) {
    return {
      errors,
      summary: {
        draftPackCount: 0,
        recordCount: 0
      }
    };
  }

  const jsonFiles = fs.readdirSync(draftDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
  let recordCount = 0;

  jsonFiles.forEach((fileName) => {
    const jsonPath = path.join(draftDir, fileName);
    const jsPath = path.join(draftDir, fileName.replace(/\.json$/, '.js'));
    const jsonPack = readJson(jsonPath, errors);
    if (!fs.existsSync(jsPath)) {
      errors.push(`${fileName}: missing .js mirror`);
    } else {
      const jsPack = readJson(jsPath, errors);
      if (jsonPack && jsPack && canonicalText(jsonPack) !== canonicalText(jsPack)) {
        errors.push(`${fileName}: .json/.js mirror mismatch`);
      }
    }
    recordCount += validateDraftPack(jsonPack, manifestPackIds, fileName, errors);
  });

  return {
    errors,
    summary: {
      draftPackCount: jsonFiles.length,
      recordCount
    }
  };
}

function run() {
  const result = validateLunarDraftDataPackRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('PASS lunar draft data-pack validation');
  console.log(`  draft packs: ${result.summary.draftPackCount}`);
  console.log(`  records: ${result.summary.recordCount}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarDraftDataPackRepository
};
