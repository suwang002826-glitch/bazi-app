const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const fixturePath = path.join(
  root,
  'code',
  'data-packs',
  'solar-terms',
  'reviews',
  'user-submitted-solar-terms-2024-2026-cross-check.json'
);

const expectedTerms = [
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '惊蛰',
  '春分',
  '清明',
  '谷雨',
  '立夏',
  '小满',
  '芒种',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '处暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至'
];

assert.ok(fs.existsSync(fixturePath), 'user-submitted solar-term cross-check fixture must exist');

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

assert.strictEqual(
  fixture.status,
  'cross_check_only_not_runtime_approved',
  'user-submitted screenshots must not be marked runtime-approved'
);

assert.strictEqual(
  fixture.source.type,
  'user_submitted_screenshot',
  'fixture must preserve that the source is screenshot evidence'
);

assert.ok(
  Array.isArray(fixture.source.imageRefs) && fixture.source.imageRefs.length >= 4,
  'fixture must retain source image references for traceability'
);

for (const year of ['2024', '2026']) {
  const yearRecord = fixture.years[year];
  assert.ok(yearRecord, `${year} solar-term record must exist`);
  assert.strictEqual(yearRecord.timezone, 'Asia/Shanghai', `${year} record must use Beijing time`);
  assert.strictEqual(yearRecord.terms.length, 24, `${year} must contain all 24 solar terms`);
  assert.deepStrictEqual(
    yearRecord.terms.map((term) => term.name),
    expectedTerms,
    `${year} terms must keep standard 24-term order`
  );

  const seen = new Set();
  for (const term of yearRecord.terms) {
    assert.ok(!seen.has(term.name), `${year} term ${term.name} must not repeat`);
    seen.add(term.name);
    assert.match(
      term.datetime,
      new RegExp(`^${year}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$`),
      `${year} ${term.name} must preserve second-level time`
    );
  }
}

const byName = (year, name) => fixture.years[String(year)].terms.find((term) => term.name === name);

assert.strictEqual(byName(2024, '立春').datetime, '2024-02-04 16:26:53');
assert.strictEqual(byName(2024, '冬至').datetime, '2024-12-21 17:20:20');
assert.strictEqual(byName(2026, '立春').datetime, '2026-02-04 04:01:51');
assert.strictEqual(byName(2026, '冬至').datetime, '2026-12-22 04:49:55');

console.log('PASS user-submitted solar-term cross-check fixture');
