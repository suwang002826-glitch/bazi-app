module.exports = {
  dataPackId: 'lunar-conversions-2023',
  calendarDataVersion: 'lunar-data-pack@2026.07.01',
  source: 'data-pack:lunar-conversions-2023',
  status: 'acceptance-seed',
  coverage: {
    years: [1926, 1984, 1985, 1987, 2023, 2045],
    scope: 'acceptance samples only',
    completeLunarCalendar: false
  },
  authoritySource: 'project-acceptance-samples',
  sourceLedger: [
    {
      sourceName: 'Project acceptance samples',
      sourceVersion: 'BZI seed + verify case seed',
      retrievedAt: '2026-07-03T00:00:00+08:00',
      note: 'Seed records are for acceptance verification only; this is not a complete authoritative lunar calendar.'
    }
  ],
  generatedAt: '2026-07-03T00:00:00+08:00',
  generatedBy: 'codex-verify-seed',
  recordsChecksum: {
    algorithm: 'sha256',
    value: '70e8b0f1552367c89f4a144a62598efe28a32b6ffec6ed193e137b3b11de25db'
  },
  records: [
    {
      caseId: 'BZI-005',
      lunarYear: 2023,
      lunarMonth: 8,
      lunarDay: 15,
      isLeapMonth: false,
      solarDate: '2023-09-29',
      sourceNote: 'Acceptance sample: lunar 2023-08-15'
    },
    {
      caseId: 'BZI-006',
      lunarYear: 2023,
      lunarMonth: 2,
      lunarDay: 10,
      isLeapMonth: true,
      solarDate: '2023-03-31',
      sourceNote: 'Acceptance sample: leap lunar 2023-02-10'
    },
    {
      caseId: 'VERIFY-CASE-04',
      lunarYear: 1987,
      lunarMonth: 11,
      lunarDay: 11,
      isLeapMonth: false,
      solarDate: '1987-12-31',
      sourceNote: 'Verify case 4 lunar input seed generated from lunardate reverse lookup.'
    },
    {
      caseId: 'VERIFY-CASE-08',
      lunarYear: 1926,
      lunarMonth: 1,
      lunarDay: 14,
      isLeapMonth: false,
      solarDate: '1926-02-26',
      sourceNote: 'Verify case 8 lunar input seed generated from lunardate reverse lookup.'
    },
    {
      caseId: 'VERIFY-CASE-10',
      lunarYear: 1985,
      lunarMonth: 11,
      lunarDay: 20,
      isLeapMonth: false,
      solarDate: '1985-12-31',
      sourceNote: 'Verify case 10 lunar input seed generated from lunardate reverse lookup.'
    },
    {
      caseId: 'VERIFY-CASE-15',
      lunarYear: 1984,
      lunarMonth: 1,
      lunarDay: 1,
      isLeapMonth: false,
      solarDate: '1984-02-02',
      sourceNote: 'Verify case 15 lunar input seed generated from lunardate reverse lookup.'
    },
    {
      caseId: 'VERIFY-CASE-07-LEAP-SEED',
      lunarYear: 2045,
      lunarMonth: 12,
      lunarDay: 21,
      isLeapMonth: true,
      solarDate: '2046-01-27',
      sourceNote: 'Verify case 7 leap-month flag coverage seed; project data-pack acceptance mapping, not complete authoritative lunar calendar.'
    }
  ]
};
