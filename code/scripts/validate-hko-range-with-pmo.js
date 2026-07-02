const fs = require('fs');
const path = require('path');

const hkoPackPath = process.argv[2] || path.join('data-packs', 'lunar', 'backend', 'hko-lunar-1901-2100.compact.json');
const pmoPackPath = process.argv[3] || path.join('data-packs', 'lunar', 'lunar-conversions-2025-candidate.js');
const outPath = process.argv[4] || path.join('data-packs', 'lunar', 'backend', 'pmo-cross-check-2025.json');

function key(record) {
  return `${record.lunarYear}-${record.lunarMonth}-${record.lunarDay}-${record.isLeapMonth ? 1 : 0}`;
}

function hkoKey(record) {
  return `${record.ly}-${record.lm}-${record.ld}-${record.le ? 1 : 0}`;
}

const hkoPack = JSON.parse(fs.readFileSync(hkoPackPath, 'utf8'));
const pmoPack = require(path.resolve(pmoPackPath));
const hko2025 = hkoPack.years['2025'] || [];
const hkoBySolar = new Map(hko2025.map((record) => [record.s, record]));
const mismatches = [];
const boundaryMatches = [];

pmoPack.records.forEach((pmoRecord) => {
  const hkoRecord = hkoBySolar.get(pmoRecord.solarDate);
  if (!hkoRecord) {
    mismatches.push({
      solarDate: pmoRecord.solarDate,
      type: 'missing-hko-record',
      pmo: key(pmoRecord)
    });
    return;
  }
  if (hkoKey(hkoRecord) !== key(pmoRecord)) {
    mismatches.push({
      solarDate: pmoRecord.solarDate,
      type: 'lunar-date-mismatch',
      hko: hkoKey(hkoRecord),
      pmo: key(pmoRecord)
    });
  }
  if (pmoRecord.lunarDay === 1 || pmoRecord.isLeapMonth || pmoRecord.lunarMonth === 1) {
    boundaryMatches.push({
      solarDate: pmoRecord.solarDate,
      lunarYear: pmoRecord.lunarYear,
      lunarMonth: pmoRecord.lunarMonth,
      lunarDay: pmoRecord.lunarDay,
      isLeapMonth: pmoRecord.isLeapMonth,
      hkoSolarTerm: hkoRecord.st || '',
      status: hkoKey(hkoRecord) === key(pmoRecord) ? 'match' : 'mismatch'
    });
  }
});

const report = {
  reportId: 'HKO-1901-2100-PMO-2025-CROSS-CHECK',
  status: mismatches.length ? 'fail' : 'pass',
  checkedAt: new Date().toISOString(),
  scope: 'Cross-check HKO backend range pack against PMO 2025 public-calendar extraction candidate bundled in the project.',
  hko: {
    dataPackId: hkoPack.dataPackId,
    calendarDataVersion: hkoPack.calendarDataVersion,
    source: hkoPack.source,
    recordsIn2025: hko2025.length
  },
  pmo: {
    dataPackId: pmoPack.dataPackId,
    calendarDataVersion: pmoPack.calendarDataVersion,
    authoritySource: pmoPack.authoritySource,
    records: pmoPack.records.length
  },
  summary: {
    comparedRecords: pmoPack.records.length,
    mismatches: mismatches.length,
    boundaryRecords: boundaryMatches.length
  },
  mismatches,
  boundaryMatches,
  limitations: [
    'This report validates the HKO 1901-2100 generated pack against the project-bundled PMO 2025 public-calendar extraction candidate.',
    'Additional PMO-extracted years should be added when licensed/verified source material is available.',
    'HKO 2069 text file omits 2069-12-30; the generated pack marks that row as inferred from adjacent HKO records.'
  ]
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`${report.status}: compared ${report.summary.comparedRecords}, mismatches ${report.summary.mismatches}`);
