const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  validateLunarDataPackRepository
} = require('./validate-lunar-data-pack');

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, value, 'utf8');
}

function writeModule(filePath, value) {
  writeText(filePath, `module.exports = ${JSON.stringify(value, null, 2)};\n`);
}

function createTempRepository(manifest, packs) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-data-pack-test-'));
  const lunarDir = path.join(rootDir, 'code', 'data-packs', 'lunar');
  fs.mkdirSync(lunarDir, { recursive: true });
  writeJson(path.join(lunarDir, 'manifest.json'), manifest);
  writeModule(path.join(lunarDir, 'manifest.js'), manifest);

  Object.entries(packs).forEach(([fileName, pack]) => {
    writeJson(path.join(lunarDir, fileName), pack);
  });

  return rootDir;
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected schema error containing "${expected}", got:\n${errors.join('\n')}`
  );
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

function checksumRecords(records) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(canonicalize(records)))
    .digest('hex');
}

const result = validateLunarDataPackRepository({
  rootDir: path.join(__dirname, '..')
});

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(result.summary.calendarDataVersion, 'hko-lunar-data-pack@2026.07.02-runtime-preview.1');
assert.strictEqual(result.summary.status, 'hko-runtime-preview');
assert.strictEqual(result.summary.packCount, 3);
assert.strictEqual(result.summary.recordCount, 732);
assert.deepStrictEqual(result.summary.packIds, [
  'hko-lunar-conversions-2023',
  'lunar-conversions-2023',
  'lunar-data-pack-2025-candidate'
]);

const invalidRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-a',
        path: 'pack-a.json',
        years: [2023],
        completeLunarCalendar: false
      },
      {
        dataPackId: 'pack-b',
        path: 'pack-b.json',
        years: [2024],
        completeLunarCalendar: true
      }
    ],
    warnings: []
  },
  {
    'pack-a.json': {
      dataPackId: 'pack-a',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-a',
      status: 'test-fixture',
      coverage: {
        years: [2023],
        scope: 'test',
        completeLunarCalendar: false
      },
      records: [
        {
          caseId: 'BZI-DUP',
          lunarYear: 2023,
          lunarMonth: 1,
          lunarDay: 1,
          isLeapMonth: false,
          solarDate: '2023-01-22',
          sourceNote: 'test seed'
        }
      ]
    },
    'pack-b.json': {
      dataPackId: 'pack-b',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-b',
      status: 'test-fixture',
      coverage: {
        years: [2025],
        scope: 'test',
        completeLunarCalendar: false
      },
      records: [
        {
          caseId: 'BZI-DUP',
          lunarYear: 2023,
          lunarMonth: 1,
          lunarDay: 1,
          isLeapMonth: false,
          solarDate: '2023-01-22',
          sourceNote: 'duplicate lunar date and case id'
        },
        {
          caseId: 'BZI-OUTSIDE-YEAR',
          lunarYear: 2026,
          lunarMonth: 1,
          lunarDay: 2,
          isLeapMonth: false,
          solarDate: '2026-02-19',
          sourceNote: 'outside declared years'
        }
      ]
    }
  }
);

const invalidResult = validateLunarDataPackRepository({ rootDir: invalidRoot });
assertHasError(invalidResult.errors, 'pack-b: coverage.years [2025] does not match manifest years [2024]');
assertHasError(invalidResult.errors, 'pack-b: coverage.completeLunarCalendar false does not match manifest true');
assertHasError(invalidResult.errors, 'pack-b.records[0]: duplicate lunar date across runtime packs 2023-1-1-normal');
assertHasError(invalidResult.errors, 'pack-b.records[0]: duplicate caseId across packs BZI-DUP');
assertHasError(invalidResult.errors, 'pack-b.records[0]: lunarYear 2023 outside coverage years 2025');

const mixedRuntimeRecords = [
  {
    caseId: 'BZI-MIXED-RUNTIME',
    lunarYear: 2023,
    lunarMonth: 8,
    lunarDay: 15,
    isLeapMonth: false,
    solarDate: '2023-09-29',
    sourceNote: 'active runtime fixture'
  }
];
const mixedDisabledRecords = [
  {
    caseId: 'BZI-MIXED-DISABLED',
    lunarYear: 2023,
    lunarMonth: 8,
    lunarDay: 15,
    isLeapMonth: false,
    solarDate: '2023-09-29',
    sourceNote: 'disabled archive fixture with same lunar date'
  }
];
const mixedCandidateRecords = [
  {
    caseId: 'BZI-MIXED-CANDIDATE',
    lunarYear: 2025,
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    solarDate: '2025-01-29',
    sourceNote: 'candidate fixture'
  }
];
const mixedRegistryRoot = createTempRepository(
  {
    calendarDataVersion: 'registry@test',
    status: 'runtime-preview',
    packs: [
      {
        dataPackId: 'pack-runtime',
        path: 'pack-runtime.json',
        years: [2023],
        completeLunarCalendar: false,
        runtimeEnabled: true
      },
      {
        dataPackId: 'pack-disabled-archive',
        path: 'pack-disabled-archive.json',
        years: [2023],
        completeLunarCalendar: false,
        runtimeEnabled: false
      },
      {
        dataPackId: 'pack-candidate',
        path: 'pack-candidate.json',
        years: [2025],
        completeLunarCalendar: false,
        runtimeEnabled: true,
        runtimeApprovalStatus: 'blocked'
      }
    ],
    warnings: []
  },
  {
    'pack-runtime.json': {
      dataPackId: 'pack-runtime',
      calendarDataVersion: 'source-runtime@test',
      source: 'test:pack-runtime',
      status: 'runtime-preview',
      coverage: {
        lunarYears: [2023],
        gregorianYears: [2023],
        scope: 'mixed registry runtime fixture',
        completeLunarCalendar: false
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture runtime',
          sourceVersion: 'v1',
          retrievedAt: '2026-07-02T06:00:09.900Z',
          note: 'runtime source fixture'
        }
      ],
      generatedAt: '2026-07-02T06:00:09.900Z',
      generatedBy: 'validate-lunar-data-pack.test',
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(mixedRuntimeRecords)
      },
      records: mixedRuntimeRecords
    },
    'pack-disabled-archive.json': {
      dataPackId: 'pack-disabled-archive',
      calendarDataVersion: 'source-disabled@test',
      source: 'test:pack-disabled-archive',
      status: 'acceptance-seed',
      coverage: {
        years: [2023],
        scope: 'disabled archive fixture',
        completeLunarCalendar: false
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture disabled',
          sourceVersion: 'v1',
          retrievedAt: '2026-07-02T00:00:00+08:00',
          note: 'disabled source fixture'
        }
      ],
      generatedAt: '2026-07-02T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(mixedDisabledRecords)
      },
      records: mixedDisabledRecords
    },
    'pack-candidate.json': {
      dataPackId: 'pack-candidate',
      calendarDataVersion: 'source-candidate@test',
      source: 'test:pack-candidate',
      status: 'candidate-not-runtime-approved',
      coverage: {
        years: [2025],
        scope: 'candidate fixture',
        completeLunarCalendar: false
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture candidate',
          sourceVersion: 'v1',
          retrievedAt: '2026-07-02T00:00:00+08:00',
          note: 'candidate source fixture'
        }
      ],
      generatedAt: '2026-07-02T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(mixedCandidateRecords)
      },
      records: mixedCandidateRecords
    }
  }
);
assert.deepStrictEqual(validateLunarDataPackRepository({ rootDir: mixedRegistryRoot }).errors, []);

const duplicateActiveRuntimeRoot = createTempRepository(
  {
    calendarDataVersion: 'registry@test',
    status: 'runtime-preview',
    packs: [
      {
        dataPackId: 'pack-runtime-a',
        path: 'pack-runtime-a.json',
        years: [2023],
        completeLunarCalendar: false,
        runtimeEnabled: true
      },
      {
        dataPackId: 'pack-runtime-b',
        path: 'pack-runtime-b.json',
        years: [2023],
        completeLunarCalendar: false,
        runtimeEnabled: true
      }
    ],
    warnings: []
  },
  {
    'pack-runtime-a.json': {
      dataPackId: 'pack-runtime-a',
      calendarDataVersion: 'source-a@test',
      source: 'test:pack-runtime-a',
      status: 'runtime-preview',
      coverage: {
        years: [2023],
        scope: 'active runtime duplicate fixture',
        completeLunarCalendar: false
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture active a',
          sourceVersion: 'v1',
          retrievedAt: '2026-07-02T00:00:00+08:00',
          note: 'active source fixture'
        }
      ],
      generatedAt: '2026-07-02T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(mixedRuntimeRecords)
      },
      records: mixedRuntimeRecords
    },
    'pack-runtime-b.json': {
      dataPackId: 'pack-runtime-b',
      calendarDataVersion: 'source-b@test',
      source: 'test:pack-runtime-b',
      status: 'runtime-preview',
      coverage: {
        years: [2023],
        scope: 'active runtime duplicate fixture',
        completeLunarCalendar: false
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture active b',
          sourceVersion: 'v1',
          retrievedAt: '2026-07-02T00:00:00+08:00',
          note: 'active source fixture'
        }
      ],
      generatedAt: '2026-07-02T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(mixedDisabledRecords)
      },
      records: mixedDisabledRecords
    }
  }
);
assertHasError(
  validateLunarDataPackRepository({ rootDir: duplicateActiveRuntimeRoot }).errors,
  'pack-runtime-b.records[0]: duplicate lunar date across runtime packs 2023-8-15-normal'
);

const invalidTypeRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-c',
        path: 'pack-c.json',
        years: ['2023'],
        completeLunarCalendar: false
      }
    ],
    warnings: []
  },
  {
    'pack-c.json': {
      dataPackId: 'pack-c',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-c',
      status: 'test-fixture',
      coverage: {
        years: ['2023'],
        scope: 'test'
      },
      records: [
        {
          caseId: 'BZI-TYPE',
          lunarYear: 2023,
          lunarMonth: 1,
          lunarDay: 1,
          isLeapMonth: false,
          solarDate: '2023-01-22',
          sourceNote: 'invalid year type fixture'
        }
      ]
    }
  }
);

const invalidTypeResult = validateLunarDataPackRepository({ rootDir: invalidTypeRoot });
assertHasError(invalidTypeResult.errors, 'manifest.packs[0]: years must contain only integers');
assertHasError(invalidTypeResult.errors, 'pack-c: coverage.years: years must contain only integers');
assertHasError(invalidTypeResult.errors, 'pack-c: coverage.completeLunarCalendar must be boolean');

const provenanceRecords = [
  {
    caseId: 'BZI-PROV',
    lunarYear: 2023,
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    solarDate: '2023-01-22',
    sourceNote: 'provenance fixture'
  }
];

const invalidProvenanceRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-provenance',
        path: 'pack-provenance.json',
        years: [2023],
        completeLunarCalendar: false
      }
    ],
    warnings: []
  },
  {
    'pack-provenance.json': {
      dataPackId: 'pack-provenance',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-provenance',
      status: 'test-fixture',
      coverage: {
        years: [2023],
        scope: 'test',
        completeLunarCalendar: false
      },
      authoritySource: '',
      sourceLedger: [
        {
          sourceName: 'fixture',
          sourceVersion: 'v1',
          retrievedAt: 'not-a-date',
          note: ''
        }
      ],
      generatedAt: 'not-a-date',
      generatedBy: '',
      recordsChecksum: {
        algorithm: 'sha256',
        value: '0000000000000000000000000000000000000000000000000000000000000000'
      },
      records: provenanceRecords
    }
  }
);

const invalidProvenanceResult = validateLunarDataPackRepository({ rootDir: invalidProvenanceRoot });
assertHasError(invalidProvenanceResult.errors, 'pack-provenance: missing authoritySource');
assertHasError(invalidProvenanceResult.errors, 'pack-provenance: generatedAt must be ISO datetime');
assertHasError(invalidProvenanceResult.errors, 'pack-provenance: missing generatedBy');
assertHasError(invalidProvenanceResult.errors, 'pack-provenance.sourceLedger[0]: retrievedAt must be ISO datetime');
assertHasError(invalidProvenanceResult.errors, 'pack-provenance.sourceLedger[0]: missing note');
assertHasError(invalidProvenanceResult.errors, 'pack-provenance: recordsChecksum does not match records');

const validProvenanceRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-provenance',
        path: 'pack-provenance.json',
        years: [2023],
        completeLunarCalendar: false
      }
    ],
    warnings: []
  },
  {
    'pack-provenance.json': {
      dataPackId: 'pack-provenance',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-provenance',
      status: 'test-fixture',
      coverage: {
        years: [2023],
        scope: 'test',
        completeLunarCalendar: false
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture',
          sourceVersion: 'v1',
          retrievedAt: '2026-07-01T00:00:00+08:00',
          note: 'provenance validation fixture'
        }
      ],
      generatedAt: '2026-07-01T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(provenanceRecords)
      },
      records: provenanceRecords
    }
  }
);

assert.deepStrictEqual(validateLunarDataPackRepository({ rootDir: validProvenanceRoot }).errors, []);

const fullSourceRecords = [
  {
    caseId: 'BZI-FULL-SOURCE',
    lunarYear: 2023,
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    solarDate: '2023-01-22',
    sourceNote: 'full source control fixture'
  }
];
const missingFullSourceControlsRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-full-source-controls',
        path: 'pack-full-source-controls.json',
        years: [2023],
        completeLunarCalendar: true
      }
    ],
    warnings: []
  },
  {
    'pack-full-source-controls.json': {
      dataPackId: 'pack-full-source-controls',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-full-source-controls',
      status: 'official-full',
      coverage: {
        years: [2023],
        scope: 'full lunar calendar year',
        completeLunarCalendar: true
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture primary',
          sourceVersion: 'v1',
          retrievedAt: '2026-07-01T00:00:00+08:00',
          note: 'primary source without required raw checksum'
        }
      ],
      generatedAt: '2026-07-01T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(fullSourceRecords)
      },
      records: fullSourceRecords
    }
  }
);
const missingFullSourceControlsResult = validateLunarDataPackRepository({ rootDir: missingFullSourceControlsRoot });
assertHasError(
  missingFullSourceControlsResult.errors,
  'pack-full-source-controls: complete lunar calendar packs require at least 2 sourceLedger entries'
);
assertHasError(
  missingFullSourceControlsResult.errors,
  'pack-full-source-controls.sourceLedger[0]: missing sourceUrl'
);
assertHasError(
  missingFullSourceControlsResult.errors,
  'pack-full-source-controls.sourceLedger[0]: rawSourceChecksum must be an object'
);
assertHasError(
  missingFullSourceControlsResult.errors,
  'pack-full-source-controls: generator must be an object'
);
assertHasError(
  missingFullSourceControlsResult.errors,
  'pack-full-source-controls: reviewLedger must be a non-empty array'
);

const validFullSourceControlsRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-full-source-controls-valid',
        path: 'pack-full-source-controls-valid.json',
        years: [2023],
        completeLunarCalendar: true
      }
    ],
    warnings: []
  },
  {
    'pack-full-source-controls-valid.json': {
      dataPackId: 'pack-full-source-controls-valid',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-full-source-controls-valid',
      status: 'official-full',
      coverage: {
        years: [2023],
        scope: 'full lunar calendar year',
        completeLunarCalendar: true
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture primary',
          sourceVersion: 'v1',
          sourceUrl: 'https://example.invalid/primary.pdf',
          rawSourceChecksum: {
            algorithm: 'sha256',
            value: 'a'.repeat(64)
          },
          retrievedAt: '2026-07-01T00:00:00+08:00',
          note: 'primary source fixture'
        },
        {
          sourceName: 'fixture secondary',
          sourceVersion: 'v1',
          sourceUrl: 'https://example.invalid/secondary.pdf',
          rawSourceChecksum: {
            algorithm: 'sha256',
            value: 'b'.repeat(64)
          },
          retrievedAt: '2026-07-01T00:00:00+08:00',
          note: 'secondary source fixture'
        }
      ],
      generatedAt: '2026-07-01T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      generator: {
        name: 'lunar-data-pack-generator',
        version: 'test-v1',
        inputChecksum: {
          algorithm: 'sha256',
          value: 'c'.repeat(64)
        }
      },
      reviewLedger: [
        {
          reviewedBy: 'test-reviewer',
          reviewedAt: '2026-07-01T00:00:00+08:00',
          reviewStatus: 'approved-for-runtime',
          scope: 'fixture full pack source controls',
          note: 'validates source controls for complete lunar packs'
        }
      ],
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(fullSourceRecords)
      },
      records: fullSourceRecords
    }
  }
);
assert.deepStrictEqual(validateLunarDataPackRepository({ rootDir: validFullSourceControlsRoot }).errors, []);

const pendingRuntimeFullRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-full-source-controls-pending',
        path: 'pack-full-source-controls-pending.json',
        years: [2023],
        completeLunarCalendar: true,
        runtimeEnabled: true
      }
    ],
    warnings: []
  },
  {
    'pack-full-source-controls-pending.json': {
      dataPackId: 'pack-full-source-controls-pending',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-full-source-controls-pending',
      status: 'official-full',
      coverage: {
        years: [2023],
        scope: 'full lunar calendar year',
        completeLunarCalendar: true
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture primary',
          sourceVersion: 'v1',
          sourceUrl: 'https://example.invalid/primary.pdf',
          rawSourceChecksum: {
            algorithm: 'sha256',
            value: 'a'.repeat(64)
          },
          retrievedAt: '2026-07-01T00:00:00+08:00',
          note: 'primary source fixture'
        },
        {
          sourceName: 'fixture secondary',
          sourceVersion: 'v1',
          sourceUrl: 'https://example.invalid/secondary.pdf',
          rawSourceChecksum: {
            algorithm: 'sha256',
            value: 'b'.repeat(64)
          },
          retrievedAt: '2026-07-01T00:00:00+08:00',
          note: 'secondary source fixture'
        }
      ],
      generatedAt: '2026-07-01T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      generator: {
        name: 'lunar-data-pack-generator',
        version: 'test-v1',
        inputChecksum: {
          algorithm: 'sha256',
          value: 'c'.repeat(64)
        }
      },
      reviewLedger: [
        {
          reviewedBy: 'test-reviewer',
          reviewedAt: '2026-07-01T00:00:00+08:00',
          reviewStatus: 'pending-independent-review',
          scope: 'fixture full pack source controls',
          note: 'pending review must not unlock runtime'
        }
      ],
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(fullSourceRecords)
      },
      records: fullSourceRecords
    }
  }
);
const pendingRuntimeFullResult = validateLunarDataPackRepository({ rootDir: pendingRuntimeFullRoot });
assertHasError(
  pendingRuntimeFullResult.errors,
  'pack-full-source-controls-pending: runtime complete lunar calendar packs require reviewLedger reviewStatus approved-for-runtime'
);
const draftFullRecords = [
  {
    caseId: 'BZI-DRAFT-FULL',
    lunarYear: 2023,
    lunarMonth: 1,
    lunarDay: 2,
    isLeapMonth: false,
    solarDate: '2023-01-23',
    sourceNote: 'draft full pack runtime gate fixture'
  }
];
const draftFullPack = {
  dataPackId: 'pack-draft-full',
  calendarDataVersion: 'lunar-data-pack@test',
  source: 'test:pack-draft-full',
  status: 'draft',
  coverage: {
    years: [2023],
    scope: 'draft full lunar calendar year',
    completeLunarCalendar: true
  },
  authoritySource: 'test-fixture',
  sourceLedger: [
    {
      sourceName: 'fixture primary',
      sourceVersion: 'v1',
      sourceUrl: 'https://example.invalid/primary.pdf',
      rawSourceChecksum: {
        algorithm: 'sha256',
        value: 'd'.repeat(64)
      },
      retrievedAt: '2026-07-01T00:00:00+08:00',
      note: 'primary draft source fixture'
    },
    {
      sourceName: 'fixture secondary',
      sourceVersion: 'v1',
      sourceUrl: 'https://example.invalid/secondary.pdf',
      rawSourceChecksum: {
        algorithm: 'sha256',
        value: 'e'.repeat(64)
      },
      retrievedAt: '2026-07-01T00:00:00+08:00',
      note: 'secondary draft source fixture'
    }
  ],
  generatedAt: '2026-07-01T00:00:00+08:00',
  generatedBy: 'validate-lunar-data-pack.test',
  generator: {
    name: 'lunar-data-pack-generator',
    version: 'test-v1',
    inputChecksum: {
      algorithm: 'sha256',
      value: 'f'.repeat(64)
    }
  },
  reviewLedger: [
    {
      reviewedBy: 'test-reviewer',
      reviewedAt: '2026-07-01T00:00:00+08:00',
      scope: 'draft runtime exposure gate',
      note: 'draft full pack must not be runtime enabled'
    }
  ],
  recordsChecksum: {
    algorithm: 'sha256',
    value: checksumRecords(draftFullRecords)
  },
  records: draftFullRecords
};
const draftRuntimeEnabledRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-draft-full',
        path: 'pack-draft-full.json',
        years: [2023],
        completeLunarCalendar: true,
        runtimeEnabled: true
      }
    ],
    warnings: []
  },
  {
    'pack-draft-full.json': draftFullPack
  }
);
const draftRuntimeEnabledResult = validateLunarDataPackRepository({ rootDir: draftRuntimeEnabledRoot });
assertHasError(
  draftRuntimeEnabledResult.errors,
  'pack-draft-full: draft data-packs must set manifest runtimeEnabled false'
);

const draftRuntimeDisabledRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-draft-full',
        path: 'pack-draft-full.json',
        years: [2023],
        completeLunarCalendar: true,
        runtimeEnabled: false
      }
    ],
    warnings: []
  },
  {
    'pack-draft-full.json': draftFullPack
  }
);
assert.deepStrictEqual(validateLunarDataPackRepository({ rootDir: draftRuntimeDisabledRoot }).errors, []);



const commonJsRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-commonjs',
        path: 'pack-commonjs.js',
        years: [2023],
        completeLunarCalendar: false
      }
    ],
    warnings: []
  },
  {}
);
const commonJsRecords = [
  {
    caseId: 'BZI-CJS',
    lunarYear: 2023,
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    solarDate: '2023-01-22',
    sourceNote: 'commonjs fixture'
  }
];
const commonJsPack = {
    dataPackId: 'pack-commonjs',
    calendarDataVersion: 'lunar-data-pack@test',
    source: 'test:pack-commonjs',
    status: 'test-fixture',
    coverage: {
      years: [2023],
      scope: 'test',
      completeLunarCalendar: false
    },
    authoritySource: 'test-fixture',
    sourceLedger: [
      {
        sourceName: 'fixture',
        sourceVersion: 'v1',
        retrievedAt: '2026-07-01T00:00:00+08:00',
        note: 'commonjs validation fixture'
      }
    ],
    generatedAt: '2026-07-01T00:00:00+08:00',
    generatedBy: 'validate-lunar-data-pack.test',
    recordsChecksum: {
      algorithm: 'sha256',
      value: checksumRecords(commonJsRecords)
    },
    records: commonJsRecords
};
writeJson(path.join(commonJsRoot, 'code', 'data-packs', 'lunar', 'pack-commonjs.json'), commonJsPack);
writeModule(path.join(commonJsRoot, 'code', 'data-packs', 'lunar', 'pack-commonjs.js'), commonJsPack);
assert.deepStrictEqual(validateLunarDataPackRepository({ rootDir: commonJsRoot }).errors, []);

const missingSourceRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-missing-source',
        path: 'pack-missing-source.js',
        years: [2023],
        completeLunarCalendar: false
      }
    ],
    warnings: []
  },
  {}
);
writeModule(
  path.join(missingSourceRoot, 'code', 'data-packs', 'lunar', 'pack-missing-source.js'),
  {
    ...commonJsPack,
    dataPackId: 'pack-missing-source',
    source: 'test:pack-missing-source'
  }
);
const missingSourceResult = validateLunarDataPackRepository({ rootDir: missingSourceRoot });
assertHasError(
  missingSourceResult.errors,
  'pack-missing-source: missing source mirror pack-missing-source.json'
);

const manifestMirrorRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [],
    warnings: []
  },
  {}
);
writeModule(
  path.join(manifestMirrorRoot, 'code', 'data-packs', 'lunar', 'manifest.js'),
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'runtime-drift',
    packs: [],
    warnings: []
  }
);
const manifestMirrorResult = validateLunarDataPackRepository({ rootDir: manifestMirrorRoot });
assertHasError(manifestMirrorResult.errors, 'manifest mirror mismatch between manifest.json and manifest.js');

const mirrorSourceRecords = [
  {
    caseId: 'BZI-MIRROR',
    lunarYear: 2023,
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    solarDate: '2023-01-22',
    sourceNote: 'source mirror fixture'
  }
];
const mirrorRuntimeRecords = [
  {
    caseId: 'BZI-MIRROR',
    lunarYear: 2023,
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    solarDate: '2023-01-22',
    sourceNote: 'runtime mirror drift'
  }
];
const mirrorRoot = createTempRepository(
  {
    calendarDataVersion: 'lunar-data-pack@test',
    status: 'test-fixture',
    packs: [
      {
        dataPackId: 'pack-mirror',
        path: 'pack-mirror.js',
        years: [2023],
        completeLunarCalendar: false
      }
    ],
    warnings: []
  },
  {
    'pack-mirror.json': {
      dataPackId: 'pack-mirror',
      calendarDataVersion: 'lunar-data-pack@test',
      source: 'test:pack-mirror',
      status: 'test-fixture',
      coverage: {
        years: [2023],
        scope: 'test',
        completeLunarCalendar: false
      },
      authoritySource: 'test-fixture',
      sourceLedger: [
        {
          sourceName: 'fixture',
          sourceVersion: 'v1',
          retrievedAt: '2026-07-01T00:00:00+08:00',
          note: 'source/runtime mirror validation fixture'
        }
      ],
      generatedAt: '2026-07-01T00:00:00+08:00',
      generatedBy: 'validate-lunar-data-pack.test',
      recordsChecksum: {
        algorithm: 'sha256',
        value: checksumRecords(mirrorSourceRecords)
      },
      records: mirrorSourceRecords
    }
  }
);
writeModule(
  path.join(mirrorRoot, 'code', 'data-packs', 'lunar', 'pack-mirror.js'),
  {
    dataPackId: 'pack-mirror',
    calendarDataVersion: 'lunar-data-pack@test',
    source: 'test:pack-mirror',
    status: 'test-fixture',
    coverage: {
      years: [2023],
      scope: 'test',
      completeLunarCalendar: false
    },
    authoritySource: 'test-fixture',
    sourceLedger: [
      {
        sourceName: 'fixture',
        sourceVersion: 'v1',
        retrievedAt: '2026-07-01T00:00:00+08:00',
        note: 'source/runtime mirror validation fixture'
      }
    ],
    generatedAt: '2026-07-01T00:00:00+08:00',
    generatedBy: 'validate-lunar-data-pack.test',
    recordsChecksum: {
      algorithm: 'sha256',
      value: checksumRecords(mirrorRuntimeRecords)
    },
    records: mirrorRuntimeRecords
  }
);
const mirrorResult = validateLunarDataPackRepository({ rootDir: mirrorRoot });
assertHasError(mirrorResult.errors, 'pack-mirror: source/runtime mirror mismatch between pack-mirror.json and pack-mirror.js');

console.log('PASS lunar data-pack schema validation');
