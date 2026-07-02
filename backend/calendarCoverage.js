const { getLunarDataPackCoverage } = require('../code/utils/bazi/lunarDataPack');
const hkoRangeManifest = require('../code/data-packs/lunar/backend/hko-lunar-1901-2100.manifest.json');
const hkoRangeValidation = require('../code/data-packs/lunar/backend/hko-lunar-1901-2100.validation.json');
const pmoCrossCheck2025 = require('../code/data-packs/lunar/backend/pmo-cross-check-2025.json');

function summarizeInferredRecords(validationReport = {}) {
  const years = Array.isArray(validationReport.validation) ? validationReport.validation : [];
  return years.flatMap((yearReport) => (
    Array.isArray(yearReport.inferredRecords)
      ? yearReport.inferredRecords.map((record) => ({
        year: yearReport.year,
        solarDate: record.solarDate,
        reason: record.reason
      }))
      : []
  ));
}

function getCalendarCoverage() {
  const inferredRecords = summarizeInferredRecords(hkoRangeValidation);
  return {
    ok: true,
    service: 'bazi-backend',
    lunar: {
      activeRuntime: getLunarDataPackCoverage(),
      backendRangePack: {
        dataPackId: hkoRangeManifest.dataPackId,
        provider: 'Hong Kong Observatory',
        source: hkoRangeManifest.source,
        authoritySource: hkoRangeManifest.authoritySource,
        calendarDataVersion: hkoRangeManifest.calendarDataVersion,
        status: hkoRangeManifest.status,
        coverage: hkoRangeManifest.coverage,
        sourceLedger: {
          years: Array.isArray(hkoRangeManifest.sourceLedger) ? hkoRangeManifest.sourceLedger.length : 0,
          firstYear: hkoRangeManifest.coverage && hkoRangeManifest.coverage.gregorianYears
            ? hkoRangeManifest.coverage.gregorianYears[0]
            : undefined,
          lastYear: hkoRangeManifest.coverage && hkoRangeManifest.coverage.gregorianYears
            ? hkoRangeManifest.coverage.gregorianYears[1]
            : undefined
        },
        validation: {
          status: hkoRangeValidation.status,
          totalRecords: hkoRangeValidation.totalRecords,
          inferredRecords
        },
        pmoCrossCheck: {
          status: pmoCrossCheck2025.status,
          reportId: pmoCrossCheck2025.reportId,
          comparedRecords: pmoCrossCheck2025.summary && pmoCrossCheck2025.summary.comparedRecords,
          mismatches: pmoCrossCheck2025.summary && pmoCrossCheck2025.summary.mismatches,
          boundaryRecords: pmoCrossCheck2025.summary && pmoCrossCheck2025.summary.boundaryRecords,
          pmoAuthoritySource: pmoCrossCheck2025.pmo && pmoCrossCheck2025.pmo.authoritySource
        },
        usagePolicy: {
          storage: 'backend-or-cdn-only',
          miniprogramMainPackage: 'blocked',
          calculateEndpointUse: 'enabled-for-backend-runtime-preview',
          promotionRequirement: 'keep mini program package blocked; serve through backend calculate endpoint only'
        }
      }
    }
  };
}

module.exports = {
  getCalendarCoverage
};
