const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  createDryRunSummary,
  validateSourceManifest
} = require('./generate-lunar-data-pack');

function checksum(value) {
  return value.repeat(64);
}

function createSource(overrides = {}) {
  return {
    sourceId: 'fixture-primary',
    sourceRole: 'primary-data',
    sourceType: 'authority-open-data',
    sourceName: 'Fixture Primary Almanac',
    sourceVersion: '2023',
    dataProvider: 'Fixture Observatory',
    datasetName: 'Fixture Gregorian-Lunar Calendar Conversion Table',
    resourceFormat: 'CSV',
    landingPageUrl: 'https://example.invalid/lunar-source-page',
    sourceUrl: 'https://example.invalid/lunar-primary-2023.pdf',
    byteLength: 1234,
    retrievedAt: '2026-07-01T00:00:00+08:00',
    rawSourceChecksum: {
      algorithm: 'sha256',
      value: checksum('a')
    },
    note: 'fixture primary source for source manifest validation',
    ...overrides
  };
}

function createValidManifest(overrides = {}) {
  return {
    sourceManifestVersion: 'lunar-source-manifest@2026.07.01',
    manifestKind: 'source-scaffold',
    targetDataPackId: 'lunar-conversions-2023-full-draft',
    targetCalendarDataVersion: 'lunar-data-pack@2026.07.01-full-draft.1',
    status: 'draft',
    writesPack: false,
    targetRuntimeEnabled: false,
    coverage: {
      years: [2023],
      scope: 'complete lunar year source-control dry run',
      completeLunarCalendar: true
    },
    sources: [
      createSource(),
      createSource({
        sourceId: 'fixture-secondary',
        sourceRole: 'cross-check-text',
        sourceName: 'Fixture Secondary Almanac',
        resourceFormat: 'TXT',
        sourceUrl: 'https://example.invalid/lunar-secondary-2023.pdf',
        byteLength: 2345,
        rawSourceChecksum: {
          algorithm: 'sha256',
          value: checksum('b')
        },
        note: 'fixture secondary source for cross-check validation'
      })
    ],
    generator: {
      name: 'lunar-data-pack-generator',
      version: '0.1.0',
      mode: 'dry-run'
    },
    reviewPolicy: {
      minimumSourceCount: 2,
      requiresManualReview: true,
      runtimeEnabled: false
    },
    outputPolicy: {
      requiresRecordsChecksum: true,
      requiresRuntimeMirrors: true,
      requiresManualReviewBeforeRuntime: true
    },
    sourceReviewBoundary: {
      sourceIndependence: 'same-provider-multi-format',
      independentReviewRequired: true,
      independentReviewStatus: 'pending'
    },
    ...overrides
  };
}

function assertHasError(errors, expected) {
  assert(
    errors.some((error) => error.includes(expected)),
    `Expected source manifest error containing "${expected}", got:\n${errors.join('\n')}`
  );
}

const validResult = validateSourceManifest(createValidManifest());
assert.deepStrictEqual(validResult.errors, []);

const summary = createDryRunSummary(createValidManifest());
assert.deepStrictEqual(summary, {
  targetDataPackId: 'lunar-conversions-2023-full-draft',
  targetCalendarDataVersion: 'lunar-data-pack@2026.07.01-full-draft.1',
  status: 'draft',
  years: [2023],
  completeLunarCalendar: true,
  sourceCount: 2,
  manifestKind: 'source-scaffold',
  writesPack: false,
  runtimeEnabled: false,
  targetRuntimeEnabled: false,
  recordsChecksumRequired: true,
  generatorMode: 'dry-run'
});

const invalidResult = validateSourceManifest(createValidManifest({
  manifestKind: 'runtime-data-pack',
  status: 'official-full',
  writesPack: true,
  targetRuntimeEnabled: true,
  sources: [
    createSource({
      sourceId: '',
      sourceRole: '',
      dataProvider: '',
      datasetName: '',
      resourceFormat: 'XLS',
      landingPageUrl: 'not-a-url',
      sourceUrl: '',
      byteLength: 0,
      rawSourceChecksum: {
        algorithm: 'md5',
        value: 'not-a-sha'
      }
    })
  ],
  coverage: {
    years: ['2023'],
    completeLunarCalendar: false
  },
  reviewPolicy: {
    minimumSourceCount: 2,
    requiresManualReview: false,
    runtimeEnabled: true
  },
  outputPolicy: {
    requiresRecordsChecksum: false,
    requiresRuntimeMirrors: false,
    requiresManualReviewBeforeRuntime: false
  },
  sourceReviewBoundary: {
    sourceIndependence: 'independent-authority-sources',
    independentReviewRequired: false,
    independentReviewStatus: 'approved'
  }
}));
assertHasError(invalidResult.errors, 'manifestKind must be source-scaffold');
assertHasError(invalidResult.errors, 'status must be draft while the generator is dry-run only');
assertHasError(invalidResult.errors, 'writesPack must be false for dry-run source manifests');
assertHasError(invalidResult.errors, 'targetRuntimeEnabled must be false for scaffold source manifests');
assertHasError(invalidResult.errors, 'coverage.years must contain only integers');
assertHasError(invalidResult.errors, 'coverage.completeLunarCalendar must be true');
assertHasError(invalidResult.errors, 'sources must contain at least 2 entries');
assertHasError(invalidResult.errors, 'sources[0]: missing sourceId');
assertHasError(invalidResult.errors, 'sources[0]: missing sourceRole');
assertHasError(invalidResult.errors, 'sources[0]: missing dataProvider');
assertHasError(invalidResult.errors, 'sources[0]: missing datasetName');
assertHasError(invalidResult.errors, 'sources[0]: resourceFormat must be CSV, TXT, PDF, JSON, or HTML');
assertHasError(invalidResult.errors, 'sources[0]: landingPageUrl must be an http(s) URL');
assertHasError(invalidResult.errors, 'sources[0]: missing sourceUrl');
assertHasError(invalidResult.errors, 'sources[0]: byteLength must be a positive integer');
assertHasError(invalidResult.errors, 'sources[0]: rawSourceChecksum.algorithm must be sha256');
assertHasError(invalidResult.errors, 'sources[0]: rawSourceChecksum.value must be a sha256 hex digest');
assertHasError(invalidResult.errors, 'reviewPolicy.requiresManualReview must be true');
assertHasError(invalidResult.errors, 'reviewPolicy.runtimeEnabled must be false');
assertHasError(invalidResult.errors, 'outputPolicy.requiresRecordsChecksum must be true');
assertHasError(invalidResult.errors, 'outputPolicy.requiresRuntimeMirrors must be true');
assertHasError(invalidResult.errors, 'outputPolicy.requiresManualReviewBeforeRuntime must be true');
assertHasError(invalidResult.errors, 'sourceReviewBoundary.sourceIndependence must be same-provider-multi-format');
assertHasError(invalidResult.errors, 'sourceReviewBoundary.independentReviewRequired must be true');
assertHasError(invalidResult.errors, 'sourceReviewBoundary.independentReviewStatus must be pending');

const tooFewPolicySourcesResult = validateSourceManifest(createValidManifest({
  reviewPolicy: {
    minimumSourceCount: 3,
    requiresManualReview: true,
    runtimeEnabled: false
  }
}));
assertHasError(tooFewPolicySourcesResult.errors, 'sources must contain at least reviewPolicy.minimumSourceCount entries');

const samplePath = path.join(
  __dirname,
  '..',
  'code',
  'data-packs',
  'lunar',
  'sources',
  'lunar-2023-full-draft.source-manifest.json'
);
const sampleManifest = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
assert.deepStrictEqual(validateSourceManifest(sampleManifest).errors, []);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lunar-source-manifest-test-'));
const tempManifestPath = path.join(tempDir, 'source-manifest.json');
fs.writeFileSync(tempManifestPath, `${JSON.stringify(createValidManifest(), null, 2)}\n`, 'utf8');
const cliOutput = execFileSync(
  process.execPath,
  [path.join(__dirname, 'generate-lunar-data-pack.js'), '--check', '--source', tempManifestPath],
  { encoding: 'utf8' }
);
assert(cliOutput.includes('PASS lunar source manifest lunar-conversions-2023-full-draft'));
assert(cliOutput.includes('sources: 2'));
assert(cliOutput.includes('writesPack: false'));
assert(cliOutput.includes('runtimeEnabled: false'));
assert(cliOutput.includes('targetRuntimeEnabled: false'));

console.log('PASS lunar data-pack generator source manifest validation');
