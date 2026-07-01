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
assert.strictEqual(result.summary.calendarDataVersion, 'lunar-data-pack@2026.07.01');
assert.strictEqual(result.summary.status, 'acceptance-seed');
assert.strictEqual(result.summary.packCount, 1);
assert.strictEqual(result.summary.recordCount, 2);
assert.deepStrictEqual(result.summary.packIds, ['lunar-conversions-2023']);

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
assertHasError(invalidResult.errors, 'pack-b.records[0]: duplicate lunar date across packs 2023-1-1-normal');
assertHasError(invalidResult.errors, 'pack-b.records[0]: duplicate caseId across packs BZI-DUP');
assertHasError(invalidResult.errors, 'pack-b.records[0]: lunarYear 2023 outside coverage years 2025');

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
