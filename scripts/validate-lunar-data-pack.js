const fs = require('fs');
const path = require('path');

const REQUIRED_PACK_FIELDS = [
  'dataPackId',
  'calendarDataVersion',
  'source',
  'status',
  'coverage',
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
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid JSON (${error.message})`);
    return null;
  }
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function recordKey(record) {
  return [
    record.lunarYear,
    record.lunarMonth,
    record.lunarDay,
    record.isLeapMonth ? 'leap' : 'normal'
  ].join('-');
}

function validateManifest(manifest, errors) {
  if (!manifest) return;
  if (!manifest.calendarDataVersion) errors.push('manifest: missing calendarDataVersion');
  if (!manifest.status) errors.push('manifest: missing status');
  if (!Array.isArray(manifest.packs)) errors.push('manifest: packs must be an array');
  if (!Array.isArray(manifest.warnings)) errors.push('manifest: warnings must be an array');
}

function validateRecord(record, pack, index, seen, errors) {
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

  const key = recordKey(record);
  if (seen.has(key)) {
    errors.push(`${pack.dataPackId}.records[${index}]: duplicate lunar date ${key}`);
  }
  seen.add(key);
}

function validatePack(pack, manifest, manifestEntry, errors) {
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

  if (!pack.coverage || !Array.isArray(pack.coverage.years)) {
    errors.push(`${pack.dataPackId}: coverage.years must be an array`);
  }

  if (!Array.isArray(pack.records)) {
    errors.push(`${pack.dataPackId}: records must be an array`);
    return 0;
  }

  const seen = new Set();
  pack.records.forEach((record, index) => validateRecord(record, pack, index, seen, errors));
  return pack.records.length;
}

function validateLunarDataPackRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const lunarDir = path.join(rootDir, 'code', 'data-packs', 'lunar');
  const errors = [];
  const manifestPath = path.join(lunarDir, 'manifest.json');
  const manifest = readJson(manifestPath, errors);

  validateManifest(manifest, errors);

  const packIds = [];
  let recordCount = 0;

  if (manifest && Array.isArray(manifest.packs)) {
    manifest.packs.forEach((entry, index) => {
      if (!entry.dataPackId) errors.push(`manifest.packs[${index}]: missing dataPackId`);
      if (!entry.path) errors.push(`manifest.packs[${index}]: missing path`);
      packIds.push(entry.dataPackId);

      const packPath = path.join(lunarDir, entry.path || '');
      if (!fs.existsSync(packPath)) {
        errors.push(`${entry.dataPackId || `manifest.packs[${index}`}: file not found`);
        return;
      }

      const pack = readJson(packPath, errors);
      if (pack) recordCount += validatePack(pack, manifest, entry, errors);
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
