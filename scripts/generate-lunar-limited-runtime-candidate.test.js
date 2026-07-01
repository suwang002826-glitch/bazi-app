const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  createLimitedRuntimeCandidateFromDraft
} = require('./generate-lunar-limited-runtime-candidate');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const rootDir = path.join(__dirname, '..');
const draft = readJson(path.join(
  rootDir,
  'code',
  'data-packs',
  'lunar',
  'drafts',
  'lunar-conversions-2023-full-draft.json'
));
const scope = readJson(path.join(
  rootDir,
  'code',
  'data-packs',
  'lunar',
  'reviews',
  'lunar-limited-runtime-scope-2023-hko.json'
));

const candidate = createLimitedRuntimeCandidateFromDraft(draft, scope, {
  generatedAt: '2026-07-01T00:00:00+08:00'
});

assert.strictEqual(candidate.dataPackId, 'lunar-conversions-2023-hko-limited-candidate');
assert.strictEqual(candidate.status, 'candidate');
assert.strictEqual(candidate.scopeId, 'lunar-limited-runtime-scope-2023-hko');
assert.strictEqual(candidate.runtimeEnabled, false);
assert.strictEqual(candidate.manifestRegistered, false);
assert.strictEqual(candidate.completeLunarCalendar, false);
assert.strictEqual(candidate.records.length, 365);
assert.strictEqual(candidate.records[0].solarDate, '2023-01-01');
assert.strictEqual(candidate.records[candidate.records.length - 1].solarDate, '2023-12-31');
assert.deepStrictEqual(candidate.recordsChecksum, draft.recordsChecksum);
assert.deepStrictEqual(candidate.sourceDraftRecordsChecksum, draft.recordsChecksum);

assert.throws(
  () => createLimitedRuntimeCandidateFromDraft(
    { ...draft, runtimeEnabled: true },
    scope,
    { generatedAt: '2026-07-01T00:00:00+08:00' }
  ),
  /source draft runtimeEnabled must be false/
);

console.log('PASS limited lunar runtime candidate generation');
