const fs = require('fs');
const path = require('path');

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid authority source intake template (${error.message})`);
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

function validateSourceTiers(template, errors) {
  const templateId = template.templateId || 'unknown-source-intake-template';
  const tiers = Array.isArray(template.sourceTiers) ? template.sourceTiers : [];
  if (tiers.length < 4) {
    errors.push(`${templateId}: sourceTiers must define at least 4 source tiers`);
  }
  if (!tiers.some((tier) => tier.tier === 1 && tier.acceptableAsPrimary === true)) {
    errors.push(`${templateId}: tier 1 must be acceptable as primary`);
  }
  if (!tiers.some((tier) => tier.name === 'ordinary-webpage-or-screenshot' && tier.acceptableAsPrimary === false)) {
    errors.push(`${templateId}: ordinary webpage or screenshot must not be acceptable as primary`);
  }
}

function validateTemplate(template, errors) {
  if (!template) return;

  const templateId = template.templateId || 'unknown-source-intake-template';
  if (template.templateId !== 'lunar-authority-source-intake-template') {
    errors.push(`${templateId}: templateId must be lunar-authority-source-intake-template`);
  }
  if (template.status !== 'template') {
    errors.push(`${templateId}: status must be template`);
  }

  validateSourceTiers(template, errors);

  requireArrayIncludes(templateId, 'preferredFormats', template.preferredFormats, [
    'csv',
    'xlsx',
    'txt',
    'pdf'
  ], errors);
  requireArrayIncludes(templateId, 'minimumRequiredFields', template.minimumRequiredFields, [
    'gregorianDate',
    'lunarYear',
    'lunarMonth',
    'lunarDay',
    'isLeapMonth',
    'sourceName',
    'sourceRowOrPage'
  ], errors);
  requireArrayIncludes(templateId, 'requiredProvenanceFields', template.requiredProvenanceFields, [
    'sourceName',
    'publisherOrProvider',
    'publicationYear',
    'editionOrVersion',
    'retrievedOrPhotographedAt',
    'sourceUrlOrPhysicalLocation',
    'operator'
  ], errors);

  const rejectionRules = template.rejectionRules || {};
  [
    'screenshotOnly',
    'missingProvider',
    'missingDateMapping',
    'ambiguousLeapMonth',
    'cannotStoreSourceTrail'
  ].forEach((rule) => {
    if (rejectionRules[rule] !== true) {
      errors.push(`${templateId}: rejectionRules.${rule} must be true`);
    }
  });

  const importDecision = template.importDecision || {};
  if (importDecision.mayCreateDraftPack !== true) {
    errors.push(`${templateId}: importDecision.mayCreateDraftPack must be true`);
  }
  if (importDecision.mayCreateRuntimeCandidate !== false) {
    errors.push(`${templateId}: importDecision.mayCreateRuntimeCandidate must be false`);
  }
  if (importDecision.mayRegisterRuntimeManifest !== false) {
    errors.push(`${templateId}: importDecision.mayRegisterRuntimeManifest must be false`);
  }
  if (importDecision.requiresIndependentReviewBeforeRuntime !== true) {
    errors.push(`${templateId}: importDecision.requiresIndependentReviewBeforeRuntime must be true`);
  }
}

function validateLunarAuthoritySourceIntakeRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const templatePath = path.join(
    rootDir,
    'code',
    'data-packs',
    'lunar',
    'sources',
    'lunar-authority-source-intake-template.json'
  );
  const errors = [];
  const template = readJson(templatePath, errors);

  validateTemplate(template, errors);

  return {
    errors,
    summary: {
      templateId: template ? template.templateId || '' : '',
      status: template ? template.status || '' : '',
      minimumRequiredFields: template && Array.isArray(template.minimumRequiredFields)
        ? template.minimumRequiredFields
        : [],
      preferredFormats: template && Array.isArray(template.preferredFormats)
        ? template.preferredFormats
        : [],
      rejectsScreenshotOnly: template && template.rejectionRules
        ? template.rejectionRules.screenshotOnly
        : undefined
    }
  };
}

function run() {
  const result = validateLunarAuthoritySourceIntakeRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar authority source intake ${result.summary.templateId}`);
  console.log(`  required fields: ${result.summary.minimumRequiredFields.join(', ')}`);
  console.log(`  preferred formats: ${result.summary.preferredFormats.join(', ')}`);
  console.log(`  rejects screenshot only: ${result.summary.rejectsScreenshotOnly}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarAuthoritySourceIntakeRepository
};
