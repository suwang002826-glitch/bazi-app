module.exports = {
  "dataPackId": "lunar-conversions-2023",
  "calendarDataVersion": "lunar-data-pack@2026.07.02-preview",
  "source": "data-pack:lunar-conversions-2023",
  "status": "acceptance-seed",
  "coverage": {
    "years": [
      2023
    ],
    "scope": "acceptance samples only",
    "completeLunarCalendar": false
  },
  "authoritySource": "project-acceptance-samples",
  "sourceLedger": [
    {
      "sourceName": "Project acceptance samples",
      "sourceVersion": "BZI-005/BZI-006 seed",
      "retrievedAt": "2026-07-01T00:00:00+08:00",
      "note": "Seed records are verified by project acceptance tests only; this is not a complete authoritative lunar calendar."
    }
  ],
  "generatedAt": "2026-07-01T00:00:00+08:00",
  "generatedBy": "manual-seed",
  "recordsChecksum": {
    "algorithm": "sha256",
    "value": "bd054fffeed88f82ed8248140f5d0e44d7b79f0386ed4ac1a87af0c4d2231ea7"
  },
  "records": [
    {
      "caseId": "BZI-005",
      "lunarYear": 2023,
      "lunarMonth": 8,
      "lunarDay": 15,
      "isLeapMonth": false,
      "solarDate": "2023-09-29",
      "sourceNote": "Acceptance sample: lunar 2023-08-15"
    },
    {
      "caseId": "BZI-006",
      "lunarYear": 2023,
      "lunarMonth": 2,
      "lunarDay": 10,
      "isLeapMonth": true,
      "solarDate": "2023-03-31",
      "sourceNote": "Acceptance sample: leap lunar 2023-02-10"
    }
  ]
};
