const fs = require('fs');
const path = require('path');

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid limited preview gate (${error.message})`);
    return null;
  }
}

function requireArrayIncludes(ownerId, label, values, requiredValues, errors) {
  if (!Array.isArray(values)) {
    errors.push(`${ownerId}: ${label} must be an array`);
    return;
  }

  requiredValues.forEach((value) => {
    if (!values.includes(value)) {
      errors.push(`${ownerId}: ${label} must include ${value}`);
    }
  });
}

function requireCopyMentions(ownerId, copy, terms, errors) {
  terms.forEach((term) => {
    if (!String(copy || '').includes(term)) {
      errors.push(`${ownerId}: uiWarning.copy must mention ${term}`);
    }
  });
}

function isBefore(dateValue, boundary) {
  return String(dateValue || '') < boundary;
}

function isAfter(dateValue, boundary) {
  return String(dateValue || '') > boundary;
}

function validateSourceLinks(gate, scope, candidate, errors) {
  const gateId = gate.gateId || 'unknown-preview-gate';
  if (!scope || scope.scopeId !== gate.sourceScopeId) {
    errors.push(`${gateId}: sourceScopeId must match limited runtime scope`);
  }
  if (!candidate || candidate.dataPackId !== gate.sourceCandidateDataPackId) {
    errors.push(`${gateId}: sourceCandidateDataPackId must match limited runtime candidate`);
  }

  if (scope) {
    if (scope.runtimeEnabled !== false) {
      errors.push(`${gateId}: linked scope runtimeEnabled must be false`);
    }
    if (scope.completeLunarCalendar !== false) {
      errors.push(`${gateId}: linked scope completeLunarCalendar must be false`);
    }
  }
  if (candidate) {
    if (candidate.runtimeEnabled !== false) {
      errors.push(`${gateId}: linked candidate runtimeEnabled must be false`);
    }
    if (candidate.manifestRegistered !== false) {
      errors.push(`${gateId}: linked candidate manifestRegistered must be false`);
    }
    if (candidate.completeLunarCalendar !== false) {
      errors.push(`${gateId}: linked candidate completeLunarCalendar must be false`);
    }
  }
}

function validateGate(gate, scope, candidate, errors) {
  if (!gate) return;

  const gateId = gate.gateId || 'unknown-preview-gate';
  if (gate.gateId !== 'lunar-limited-preview-gate-2023-hko') {
    errors.push(`${gateId}: gateId must be lunar-limited-preview-gate-2023-hko`);
  }
  if (gate.status !== 'preflight-required') {
    errors.push(`${gateId}: status must be preflight-required`);
  }
  if (gate.previewEntryAllowed !== false) {
    errors.push(`${gateId}: previewEntryAllowed must remain false`);
  }
  if (gate.manifestRegistrationAllowed !== false) {
    errors.push(`${gateId}: manifestRegistrationAllowed must remain false`);
  }
  if (gate.runtimeEnabled !== false) {
    errors.push(`${gateId}: runtimeEnabled must remain false`);
  }
  if (gate.completeLunarCalendar !== false) {
    errors.push(`${gateId}: completeLunarCalendar must be false`);
  }

  validateSourceLinks(gate, scope, candidate, errors);

  const uiWarning = gate.uiWarning || {};
  if (uiWarning.required !== true) {
    errors.push(`${gateId}: uiWarning.required must be true`);
  }
  requireArrayIncludes(gateId, 'uiWarning.mustMention', uiWarning.mustMention, [
    '2023',
    'HKO',
    '非完整'
  ], errors);
  requireCopyMentions(gateId, uiWarning.copy, uiWarning.mustMention || [], errors);
  requireArrayIncludes(gateId, 'uiWarning.requiredPlacements', uiWarning.requiredPlacements, [
    'lunar-input-panel',
    'before-generate-button',
    'result-conversion-summary'
  ], errors);

  const outOfCoverageError = gate.outOfCoverageError || {};
  if (outOfCoverageError.required !== true) {
    errors.push(`${gateId}: outOfCoverageError.required must be true`);
  }
  if (outOfCoverageError.code !== 'LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE') {
    errors.push(`${gateId}: outOfCoverageError.code must be LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE`);
  }
  requireArrayIncludes(gateId, 'outOfCoverageError.requiredFields', outOfCoverageError.requiredFields, [
    'inputDate',
    'supportedStartDate',
    'supportedEndDate',
    'completeLunarCalendar',
    'calendarDataVersion'
  ], errors);

  const coverage = (candidate && candidate.coverage) || (scope && scope.coverage) || {};
  const expectedStart = coverage.startDate || '2023-01-01';
  const expectedEnd = coverage.endDate || '2023-12-31';
  const expectedVersion = candidate ? candidate.calendarDataVersion : '';
  const examples = Array.isArray(outOfCoverageError.examples) ? outOfCoverageError.examples : [];
  if (examples.length < 2) {
    errors.push(`${gateId}: outOfCoverageError.examples must cover before and after supported range`);
  }

  let hasBeforeRange = false;
  let hasAfterRange = false;
  examples.forEach((example, index) => {
    if (isBefore(example.inputDate, expectedStart)) hasBeforeRange = true;
    if (isAfter(example.inputDate, expectedEnd)) hasAfterRange = true;
    if (example.supportedStartDate !== expectedStart) {
      errors.push(`${gateId}: outOfCoverageError.examples[${index}].supportedStartDate must be ${expectedStart}`);
    }
    if (example.supportedEndDate !== expectedEnd) {
      errors.push(`${gateId}: outOfCoverageError.examples[${index}].supportedEndDate must be ${expectedEnd}`);
    }
    if (example.completeLunarCalendar !== false) {
      errors.push(`${gateId}: outOfCoverageError.examples[${index}].completeLunarCalendar must be false`);
    }
    if (expectedVersion && example.calendarDataVersion !== expectedVersion) {
      errors.push(`${gateId}: outOfCoverageError.examples[${index}].calendarDataVersion must match candidate version`);
    }
  });
  if (!hasBeforeRange) errors.push(`${gateId}: outOfCoverageError.examples must include a before-range inputDate`);
  if (!hasAfterRange) errors.push(`${gateId}: outOfCoverageError.examples must include an after-range inputDate`);

  const releasePreconditions = gate.releasePreconditions || {};
  [
    'uiWarningImplemented',
    'structuredOutOfCoverageErrorImplemented',
    'previewEntryReviewed',
    'manifestRegistrationReviewed'
  ].forEach((field) => {
    if (releasePreconditions[field] !== false) {
      errors.push(`${gateId}: releasePreconditions.${field} must remain false before preview approval`);
    }
  });

  requireArrayIncludes(gateId, 'blocksPreviewUnless', gate.blocksPreviewUnless, [
    'uiWarningImplemented',
    'structuredOutOfCoverageErrorImplemented',
    'previewEntryReviewed'
  ], errors);
  requireArrayIncludes(gateId, 'blocksManifestRegistrationUnless', gate.blocksManifestRegistrationUnless, [
    'uiWarningImplemented',
    'structuredOutOfCoverageErrorImplemented',
    'manifestRegistrationReviewed'
  ], errors);
}

function validateLunarLimitedPreviewGateRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const lunarDir = path.join(rootDir, 'code', 'data-packs', 'lunar');
  const errors = [];
  const scope = readJson(path.join(lunarDir, 'reviews', 'lunar-limited-runtime-scope-2023-hko.json'), errors);
  const candidate = readJson(path.join(lunarDir, 'candidates', 'lunar-conversions-2023-hko-limited-candidate.json'), errors);
  const gate = readJson(path.join(lunarDir, 'previews', 'lunar-limited-preview-gate-2023-hko.json'), errors);

  validateGate(gate, scope, candidate, errors);

  return {
    errors,
    summary: {
      gateId: gate ? gate.gateId || '' : '',
      status: gate ? gate.status || '' : '',
      previewEntryAllowed: gate ? gate.previewEntryAllowed : undefined,
      manifestRegistrationAllowed: gate ? gate.manifestRegistrationAllowed : undefined,
      runtimeEnabled: gate ? gate.runtimeEnabled : undefined,
      uiWarningRequired: gate && gate.uiWarning ? gate.uiWarning.required : undefined,
      outOfCoverageErrorCode: gate && gate.outOfCoverageError ? gate.outOfCoverageError.code || '' : ''
    }
  };
}

function run() {
  const result = validateLunarLimitedPreviewGateRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar limited preview gate ${result.summary.gateId}`);
  console.log(`  status: ${result.summary.status}`);
  console.log(`  previewEntryAllowed: ${result.summary.previewEntryAllowed}`);
  console.log(`  manifestRegistrationAllowed: ${result.summary.manifestRegistrationAllowed}`);
  console.log(`  outOfCoverageError: ${result.summary.outOfCoverageErrorCode}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarLimitedPreviewGateRepository
};
