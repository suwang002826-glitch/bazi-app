const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REQUIRED_PACK_FIELDS = [
  'dataPackId',
  'calendarDataVersion',
  'source',
  'status',
  'coverage',
  'authoritySource',
  'sourceLedger',
  'generatedAt',
  'generatedBy',
  'recordsChecksum',
  'records'
];

const REQUIRED_RECORD_FIELDS = [
  'caseId',
  'lunarYear',
  'lunarMonth',
  'lunarDay',
  'isLeapMonth',
  'solarDate',
  'sourceNote'
];

function readJson(filePath, errors) {
  try {
    if (path.extname(filePath) === '.js') {
      const resolvedPath = require.resolve(filePath);
      delete require.cache[resolvedPath];
      return require(resolvedPath);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid data-pack module (${error.message})`);
    return null;
  }
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isIsoDateTime(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(text)) {
    return false;
  }
  return !Number.isNaN(new Date(text).getTime());
}

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

function canonicalText(value) {
  return JSON.stringify(canonicalize(value));
}

function checksumRecords(records) {
  return crypto
    .createHash('sha256')
    .update(canonicalText(records))
    .digest('hex');
}

function replaceExtension(filePath, extension) {
  return path.join(path.dirname(filePath), `${path.basename(filePath, path.extname(filePath))}${extension}`);
}

function formatLunarPath(lunarDir, filePath) {
  return path.relative(lunarDir, filePath).replace(/\\/g, '/');
}

function validateMirroredData(left, right, label, errors) {
  if (left && right && canonicalText(left) !== canonicalText(right)) {
    errors.push(label);
  }
}

function validateManifestMirror(lunarDir, manifest, errors) {
  const manifestJsPath = path.join(lunarDir, 'manifest.js');
  if (!fs.existsSync(manifestJsPath)) {
    errors.push('manifest: missing runtime mirror manifest.js');
    return;
  }

  const runtimeManifest = readJson(manifestJsPath, errors);
  validateMirroredData(
    manifest,
    runtimeManifest,
    'manifest mirror mismatch between manifest.json and manifest.js',
    errors
  );
}

function validatePackMirror(lunarDir, packPath, pack, dataPackId, errors) {
  const extension = path.extname(packPath);
  const mirrorExtension = extension === '.js' ? '.json' : '.js';
  const mirrorPath = replaceExtension(packPath, mirrorExtension);
  const activePathLabel = formatLunarPath(lunarDir, packPath);
  const mirrorPathLabel = formatLunarPath(lunarDir, mirrorPath);

  if (!fs.existsSync(mirrorPath)) {
    if (extension === '.js') {
      errors.push(`${dataPackId}: missing source mirror ${mirrorPathLabel}`);
    }
    return;
  }

  const mirrorPack = readJson(mirrorPath, errors);
  const sourceLabel = extension === '.js' ? mirrorPathLabel : activePathLabel;
  const runtimeLabel = extension === '.js' ? activePathLabel : mirrorPathLabel;
  validateMirroredData(
    extension === '.js' ? mirrorPack : pack,
    extension === '.js' ? pack : mirrorPack,
    `${dataPackId}: source/runtime mirror mismatch between ${sourceLabel} and ${runtimeLabel}`,
    errors
  );
}

function recordKey(record) {
  return [
    record.lunarYear,
    record.lunarMonth,
    record.lunarDay,
    record.isLeapMonth ? 'leap' : 'normal'
  ].join('-');
}

function normalizeYears(years) {
  if (!Array.isArray(years)) return [];
  return [...years].filter((year) => Number.isInteger(year)).sort((a, b) => a - b);
}

function formatYears(years) {
  return `[${normalizeYears(years).join(', ')}]`;
}

function yearsAreIntegers(years) {
  return Array.isArray(years) && years.every((year) => Number.isInteger(year));
}

function validateYearsArray(label, years, errors) {
  if (!Array.isArray(years)) {
    errors.push(`${label}: years must be an array`);
    return false;
  }

  if (!yearsAreIntegers(years)) {
    errors.push(`${label}: years must contain only integers`);
    return false;
  }

  return true;
}

function sameYears(left, right) {
  const normalizedLeft = normalizeYears(left);
  const normalizedRight = normalizeYears(right);
  return normalizedLeft.length === normalizedRight.length
    && normalizedLeft.every((year, index) => year === normalizedRight[index]);
}

function hasValidLunarDate(record) {
  return Number.isInteger(record.lunarYear)
    && record.lunarYear > 0
    && Number.isInteger(record.lunarMonth)
    && record.lunarMonth > 0
    && Number.isInteger(record.lunarDay)
    && record.lunarDay > 0
    && typeof record.isLeapMonth === 'boolean';
}

function validateManifest(manifest, errors) {
  if (!manifest) return;
  if (!manifest.calendarDataVersion) errors.push('manifest: missing calendarDataVersion');
  if (!manifest.status) errors.push('manifest: missing status');
  if (!Array.isArray(manifest.packs)) errors.push('manifest: packs must be an array');
  if (!Array.isArray(manifest.warnings)) errors.push('manifest: warnings must be an array');
}

function isDraftStatus(status) {
  return String(status || '').toLowerCase() === 'draft';
}

function validateRecord(record, pack, index, seen, repositoryState, errors) {
  REQUIRED_RECORD_FIELDS.forEach((field) => {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`${pack.dataPackId}.records[${index}]: missing ${field}`);
    }
  });

  ['lunarYear', 'lunarMonth', 'lunarDay'].forEach((field) => {
    if (!Number.isInteger(record[field]) || record[field] <= 0) {
      errors.push(`${pack.dataPackId}.records[${index}]: ${field} must be a positive integer`);
    }
  });

  if (typeof record.isLeapMonth !== 'boolean') {
    errors.push(`${pack.dataPackId}.records[${index}]: isLeapMonth must be boolean`);
  }

  if (!isIsoDate(record.solarDate)) {
    errors.push(`${pack.dataPackId}.records[${index}]: solarDate must be YYYY-MM-DD`);
  }

  const coverageYears = pack.coverage && Array.isArray(pack.coverage.years)
    ? normalizeYears(pack.coverage.years)
    : [];
  if (Number.isInteger(record.lunarYear) && coverageYears.length > 0 && !coverageYears.includes(record.lunarYear)) {
    errors.push(`${pack.dataPackId}.records[${index}]: lunarYear ${record.lunarYear} outside coverage years ${coverageYears.join(', ')}`);
  }

  if (record.caseId) {
    if (repositoryState.caseIds.has(record.caseId)) {
      errors.push(`${pack.dataPackId}.records[${index}]: duplicate caseId across packs ${record.caseId}`);
    }
    repositoryState.caseIds.add(record.caseId);
  }

  if (hasValidLunarDate(record)) {
    const key = recordKey(record);
    if (seen.has(key)) {
      errors.push(`${pack.dataPackId}.records[${index}]: duplicate lunar date ${key}`);
    }
    seen.add(key);

    if (repositoryState.lunarDates.has(key)) {
      errors.push(`${pack.dataPackId}.records[${index}]: duplicate lunar date across packs ${key}`);
    }
    repositoryState.lunarDates.add(key);
  }
}

function validateSourceLedger(pack, errors) {
  if (!pack.authoritySource) {
    errors.push(`${pack.dataPackId}: missing authoritySource`);
  }

  if (!Array.isArray(pack.sourceLedger) || pack.sourceLedger.length === 0) {
    errors.push(`${pack.dataPackId}: sourceLedger must be a non-empty array`);
  } else {
    pack.sourceLedger.forEach((source, index) => {
      ['sourceName', 'sourceVersion', 'retrievedAt', 'note'].forEach((field) => {
        if (!source[field]) {
          errors.push(`${pack.dataPackId}.sourceLedger[${index}]: missing ${field}`);
        }
      });

      if (source.retrievedAt && !isIsoDateTime(source.retrievedAt)) {
        errors.push(`${pack.dataPackId}.sourceLedger[${index}]: retrievedAt must be ISO datetime`);
      }
    });
  }

  if (!pack.generatedAt || !isIsoDateTime(pack.generatedAt)) {
    errors.push(`${pack.dataPackId}: generatedAt must be ISO datetime`);
  }

  if (!pack.generatedBy) {
    errors.push(`${pack.dataPackId}: missing generatedBy`);
  }
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

function validateCompleteLunarCalendarSourceControls(pack, errors) {
  const sourceLedger = Array.isArray(pack.sourceLedger) ? pack.sourceLedger : [];
  if (sourceLedger.length < 2) {
    errors.push(`${pack.dataPackId}: complete lunar calendar packs require at least 2 sourceLedger entries`);
  }

  sourceLedger.forEach((source, index) => {
    const label = `${pack.dataPackId}.sourceLedger[${index}]`;
    if (!source.sourceUrl) {
      errors.push(`${label}: missing sourceUrl`);
    }
    validateSha256ChecksumObject(`${label}: rawSourceChecksum`, source.rawSourceChecksum, errors);
  });

  if (!pack.generator || typeof pack.generator !== 'object') {
    errors.push(`${pack.dataPackId}: generator must be an object`);
  } else {
    ['name', 'version'].forEach((field) => {
      if (!pack.generator[field]) {
        errors.push(`${pack.dataPackId}.generator: missing ${field}`);
      }
    });
    validateSha256ChecksumObject(`${pack.dataPackId}.generator: inputChecksum`, pack.generator.inputChecksum, errors);
  }

  if (!Array.isArray(pack.reviewLedger) || pack.reviewLedger.length === 0) {
    errors.push(`${pack.dataPackId}: reviewLedger must be a non-empty array`);
  } else {
    pack.reviewLedger.forEach((review, index) => {
      const label = `${pack.dataPackId}.reviewLedger[${index}]`;
      ['reviewedBy', 'scope', 'note'].forEach((field) => {
        if (!review[field]) {
          errors.push(`${label}: missing ${field}`);
        }
      });
      if (!review.reviewedAt || !isIsoDateTime(review.reviewedAt)) {
        errors.push(`${label}: reviewedAt must be ISO datetime`);
      }
    });
  }
}

function validateRuntimeExposure(pack, manifestEntry, errors) {
  if (isDraftStatus(pack.status) && manifestEntry.runtimeEnabled !== false) {
    errors.push(`${pack.dataPackId}: draft data-packs must set manifest runtimeEnabled false`);
  }
}

function validateRecordsChecksum(pack, errors) {
  if (!pack.recordsChecksum || typeof pack.recordsChecksum !== 'object') {
    errors.push(`${pack.dataPackId}: recordsChecksum must be an object`);
    return;
  }

  if (pack.recordsChecksum.algorithm !== 'sha256') {
    errors.push(`${pack.dataPackId}: recordsChecksum.algorithm must be sha256`);
  }

  if (!/^[0-9a-f]{64}$/.test(String(pack.recordsChecksum.value || ''))) {
    errors.push(`${pack.dataPackId}: recordsChecksum.value must be a sha256 hex digest`);
    return;
  }

  if (Array.isArray(pack.records) && pack.recordsChecksum.value !== checksumRecords(pack.records)) {
    errors.push(`${pack.dataPackId}: recordsChecksum does not match records`);
  }
}

function validatePack(pack, manifest, manifestEntry, repositoryState, errors) {
  REQUIRED_PACK_FIELDS.forEach((field) => {
    if (pack[field] === undefined || pack[field] === null || pack[field] === '') {
      errors.push(`${manifestEntry.dataPackId}: missing ${field}`);
    }
  });

  if (pack.dataPackId !== manifestEntry.dataPackId) {
    errors.push(`${manifestEntry.path}: dataPackId does not match manifest`);
  }

  if (pack.calendarDataVersion !== manifest.calendarDataVersion) {
    errors.push(`${pack.dataPackId}: calendarDataVersion does not match manifest`);
  }

  const coverageYearsValid = Boolean(pack.coverage)
    && validateYearsArray(`${pack.dataPackId}: coverage.years`, pack.coverage.years, errors);

  if (pack.coverage && typeof pack.coverage.completeLunarCalendar !== 'boolean') {
    errors.push(`${pack.dataPackId}: coverage.completeLunarCalendar must be boolean`);
  }

  if (coverageYearsValid && yearsAreIntegers(manifestEntry.years)
    && !sameYears(pack.coverage.years, manifestEntry.years)) {
    errors.push(`${pack.dataPackId}: coverage.years ${formatYears(pack.coverage.years)} does not match manifest years ${formatYears(manifestEntry.years)}`);
  }

  if (pack.coverage && typeof pack.coverage.completeLunarCalendar === 'boolean'
    && typeof manifestEntry.completeLunarCalendar === 'boolean'
    && pack.coverage.completeLunarCalendar !== manifestEntry.completeLunarCalendar) {
    errors.push(`${pack.dataPackId}: coverage.completeLunarCalendar ${pack.coverage.completeLunarCalendar} does not match manifest ${manifestEntry.completeLunarCalendar}`);
  }

  validateRuntimeExposure(pack, manifestEntry, errors);

  if (!Array.isArray(pack.records)) {
    errors.push(`${pack.dataPackId}: records must be an array`);
    return 0;
  }

  validateSourceLedger(pack, errors);
  if (pack.coverage && pack.coverage.completeLunarCalendar === true) {
    validateCompleteLunarCalendarSourceControls(pack, errors);
  }
  validateRecordsChecksum(pack, errors);

  const seen = new Set();
  pack.records.forEach((record, index) => validateRecord(record, pack, index, seen, repositoryState, errors));
  return pack.records.length;
}

function validateLunarDataPackRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const lunarDir = path.join(rootDir, 'code', 'data-packs', 'lunar');
  const errors = [];
  const manifestPath = path.join(lunarDir, 'manifest.json');
  const manifest = readJson(manifestPath, errors);

  validateManifest(manifest, errors);
  if (manifest) validateManifestMirror(lunarDir, manifest, errors);

  const packIds = [];
  const manifestPackIds = new Set();
  const repositoryState = {
    lunarDates: new Set(),
    caseIds: new Set()
  };
  let recordCount = 0;

  if (manifest && Array.isArray(manifest.packs)) {
    manifest.packs.forEach((entry, index) => {
      if (!entry.dataPackId) errors.push(`manifest.packs[${index}]: missing dataPackId`);
      if (!entry.path) errors.push(`manifest.packs[${index}]: missing path`);
      validateYearsArray(`manifest.packs[${index}]`, entry.years, errors);
      if (typeof entry.completeLunarCalendar !== 'boolean') {
        errors.push(`manifest.packs[${index}]: completeLunarCalendar must be boolean`);
      }
      if (entry.runtimeEnabled !== undefined && typeof entry.runtimeEnabled !== 'boolean') {
        errors.push(`manifest.packs[${index}]: runtimeEnabled must be boolean when present`);
      }
      if (entry.dataPackId && manifestPackIds.has(entry.dataPackId)) {
        errors.push(`manifest.packs[${index}]: duplicate dataPackId ${entry.dataPackId}`);
      }
      if (entry.dataPackId) manifestPackIds.add(entry.dataPackId);
      packIds.push(entry.dataPackId);

      const packPath = path.join(lunarDir, entry.path || '');
      if (!fs.existsSync(packPath)) {
        errors.push(`${entry.dataPackId || `manifest.packs[${index}`}: file not found`);
        return;
      }

      const pack = readJson(packPath, errors);
      if (pack) {
        validatePackMirror(lunarDir, packPath, pack, entry.dataPackId, errors);
        recordCount += validatePack(pack, manifest, entry, repositoryState, errors);
      }
    });
  }

  return {
    errors,
    summary: {
      calendarDataVersion: manifest ? manifest.calendarDataVersion : '',
      status: manifest ? manifest.status : '',
      packCount: packIds.filter(Boolean).length,
      recordCount,
      packIds: packIds.filter(Boolean)
    }
  };
}

function run() {
  const result = validateLunarDataPackRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar data-pack schema ${result.summary.calendarDataVersion}`);
  console.log(`  packs: ${result.summary.packCount}`);
  console.log(`  records: ${result.summary.recordCount}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarDataPackRepository
};
