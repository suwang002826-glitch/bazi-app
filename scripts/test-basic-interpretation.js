const assert = require('assert');
const { buildReadingFromForm } = require('../code/utils/bazi/pageAdapter');
const { getBasicInterpretation } = require('../code/utils/bazi/basicInterpretation');

function buildInterpretation(form) {
  return getBasicInterpretation(buildReadingFromForm({
    birthDate: form.birthDate,
    birthTime: form.birthTime,
    gender: form.gender || '男',
    useTrueSolarTime: false,
    useEarlyLateZi: false,
    longitude: 120,
    latitude: 39
  }));
}

function assertElementStatsShape(interpretation) {
  assert(Array.isArray(interpretation.elementStats), 'elementStats should be an array');
  assert.strictEqual(interpretation.elementStats.length, 5, 'elementStats should include five elements');
  interpretation.elementStats.forEach((item) => {
    assert(['金', '木', '水', '火', '土'].includes(item.name), `unexpected element ${item.name}`);
    assert(Number.isFinite(item.count), `${item.name} count should be numeric`);
    assert(Number.isFinite(item.percent), `${item.name} percent should be numeric`);
    assert(/^#[0-9A-Fa-f]{6}$/.test(item.color), `${item.name} color should be hex`);
  });
}

function assertInterpretationShape(interpretation) {
  assert(interpretation, 'basic interpretation should exist');
  assertElementStatsShape(interpretation);
  assert(['身旺', '身弱', '中和'].includes(interpretation.strength.status), 'strength status should be constrained');
  assert(interpretation.strength.score >= 0 && interpretation.strength.score <= 100, 'strength score should be 0-100');
  assert(interpretation.strength.basis.length >= 3, 'strength should expose basis details');
  assert(interpretation.pattern.name.endsWith('格') || interpretation.pattern.name === '正格', 'pattern should expose a pattern name');
  assert(interpretation.pattern.basis.length >= 2, 'pattern should expose basis details');
  assert(interpretation.usefulGod.useful.length > 0, 'usefulGod should not be empty');
  assert(interpretation.usefulGod.avoid.length > 0, 'avoid should not be empty');
  assert(interpretation.usefulGod.basis, 'usefulGod should expose basis');
}

const defaultCase = buildInterpretation({
  birthDate: '1990-01-01',
  birthTime: '12:00'
});
assertInterpretationShape(defaultCase);
assert.strictEqual(defaultCase.strength.status, '中和');
assert.strictEqual(defaultCase.pattern.name, '正官格');
assert.strictEqual(defaultCase.usefulGod.usefulText, '水、木');

const strongCase = buildInterpretation({
  birthDate: '1960-11-06',
  birthTime: '12:00'
});
assertInterpretationShape(strongCase);
assert.strictEqual(strongCase.strength.status, '身旺');
assert(strongCase.usefulGod.basis.includes('身旺'), 'strong case should use strong-day-master rule');

const weakCase = buildInterpretation({
  birthDate: '1990-03-06',
  birthTime: '05:00'
});
assertInterpretationShape(weakCase);
assert.strictEqual(weakCase.strength.status, '身弱');
assert(weakCase.usefulGod.basis.includes('身弱'), 'weak case should use weak-day-master rule');

console.log('basic interpretation tests passed');
