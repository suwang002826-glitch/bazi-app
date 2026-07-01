const fs = require('fs');
const path = require('path');

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
  console.error('Usage: node scripts/generate-lunar-data-pack.js --check --source <source-manifest.json>');
  console.error('This dry-run command validates source controls only. It does not write runtime data-pack records.');
}

function parseArgs(argv) {
  const args = {
    check: false,
    source: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--check') {
      args.check = true;
    } else if (value === '--source') {
      args.source = argv[index + 1] || '';
      index += 1;
    } else {
      args.unknown = value;
    }
  }

  return args;
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
}

if (require.main === module) {
  runCli();
}

module.exports = {
  createDryRunSummary,
  runCli,
  validateSourceManifest
};
