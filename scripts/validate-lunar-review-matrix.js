const fs = require('fs');
const path = require('path');

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid JSON (${error.message})`);
    return null;
  }
}

function sameArray(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function validateCoverage(matrix, draft, errors) {
  const matrixCoverage = matrix.coverage || {};
  const draftCoverage = draft.coverage || {};

  [
    'gregorianYears',
    'lunarYears'
  ].forEach((field) => {
    if (!sameArray(matrixCoverage[field], draftCoverage[field])) {
      errors.push(`${matrix.matrixId}: coverage.${field} must match source draft data-pack`);
    }
  });

  [
    'completeGregorianCalendar',
    'completeLunarCalendar'
  ].forEach((field) => {
    if (matrixCoverage[field] !== draftCoverage[field]) {
      errors.push(`${matrix.matrixId}: coverage.${field} must match source draft data-pack`);
    }
  });
}

function validateSample(sample, draftRecordsByCaseId, seenCaseIds, errors) {
  [
    'caseId',
    'category',
    'title',
    'solarDate',
    'lunarYear',
    'lunarMonth',
    'lunarDay',
    'isLeapMonth',
    'reviewFocus'
  ].forEach((field) => {
    if (sample[field] === undefined || sample[field] === null || sample[field] === '') {
      errors.push(`${sample.caseId || 'sample'}: missing ${field}`);
    }
  });

  if (sample.caseId && seenCaseIds.has(sample.caseId)) {
    errors.push(`${sample.caseId}: duplicate review matrix sample caseId`);
  }
  if (sample.caseId) seenCaseIds.add(sample.caseId);

  const draftRecord = draftRecordsByCaseId.get(sample.caseId);
  if (!draftRecord) {
    errors.push(`${sample.caseId}: sample must exist in source draft data-pack`);
    return;
  }

  [
    'solarDate',
    'lunarYear',
    'lunarMonth',
    'lunarDay',
    'isLeapMonth'
  ].forEach((field) => {
    if (sample[field] !== draftRecord[field]) {
      errors.push(`${sample.caseId}: ${field} must match source draft data-pack`);
    }
  });
}

function validateLunarReviewMatrixRepository(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const matrixPath = path.join(
    rootDir,
    'code',
    'data-packs',
    'lunar',
    'reviews',
    'lunar-review-matrix-2023-hko-draft.json'
  );
  const errors = [];
  const matrix = readJson(matrixPath, errors);

  if (!matrix) {
    return {
      errors,
      summary: {
        matrixId: '',
        sourceDraftDataPackId: '',
        sampleCount: 0,
        missingCategories: []
      }
    };
  }

  const draftPath = path.join(
    rootDir,
    'code',
    'data-packs',
    'lunar',
    'drafts',
    `${matrix.sourceDraftDataPackId}.json`
  );
  const draft = readJson(draftPath, errors);
  if (!draft) {
    return {
      errors,
      summary: {
        matrixId: matrix.matrixId || '',
        sourceDraftDataPackId: matrix.sourceDraftDataPackId || '',
        sampleCount: Array.isArray(matrix.samples) ? matrix.samples.length : 0,
        missingCategories: []
      }
    };
  }

  if (matrix.status !== 'pending-review') {
    errors.push(`${matrix.matrixId}: status must be pending-review`);
  }
  if (matrix.runtimeApproval !== false) {
    errors.push(`${matrix.matrixId}: runtimeApproval must be false`);
  }
  if (matrix.sourceDraftDataPackId !== draft.dataPackId) {
    errors.push(`${matrix.matrixId}: sourceDraftDataPackId must match source draft data-pack`);
  }
  if (!matrix.sourceRecordsChecksum
    || matrix.sourceRecordsChecksum.algorithm !== draft.recordsChecksum.algorithm
    || matrix.sourceRecordsChecksum.value !== draft.recordsChecksum.value) {
    errors.push(`${matrix.matrixId}: sourceRecordsChecksum must match source draft data-pack`);
  }

  validateCoverage(matrix, draft, errors);

  const requiredCategories = Array.isArray(matrix.requiredCategories) ? matrix.requiredCategories : [];
  const samples = Array.isArray(matrix.samples) ? matrix.samples : [];
  const categories = new Set(samples.map((sample) => sample.category));
  const missingCategories = requiredCategories.filter((category) => !categories.has(category));
  missingCategories.forEach((category) => {
    errors.push(`${matrix.matrixId}: missing required category ${category}`);
  });

  const draftRecordsByCaseId = new Map((draft.records || []).map((record) => [record.caseId, record]));
  const seenCaseIds = new Set();
  samples.forEach((sample) => validateSample(sample, draftRecordsByCaseId, seenCaseIds, errors));

  return {
    errors,
    summary: {
      matrixId: matrix.matrixId || '',
      sourceDraftDataPackId: matrix.sourceDraftDataPackId || '',
      sampleCount: samples.length,
      missingCategories
    }
  };
}

function run() {
  const result = validateLunarReviewMatrixRepository();
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`FAIL ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`PASS lunar review matrix ${result.summary.matrixId}`);
  console.log(`  source draft: ${result.summary.sourceDraftDataPackId}`);
  console.log(`  samples: ${result.summary.sampleCount}`);
}

if (require.main === module) {
  run();
}

module.exports = {
  validateLunarReviewMatrixRepository
};
