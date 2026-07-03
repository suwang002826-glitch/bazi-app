import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { TEST_CASES } = require('./golden-test-cases.cjs')
const { EXTREME_TEST_CASES } = require('./golden-edge-test-cases.cjs')
const { calculateBaZi } = require('../core/engine.js')
const { calculateBaziWithCore, toCoreInput } = await import('../src/lib/baziCoreAdapter.ts')

const pillarKeys = ['year', 'month', 'day', 'hour']
const labelByKey = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  hour: '时柱',
}

function parseSolarTime(solarTime) {
  const [birthDate, timePart] = solarTime.split(' ')
  return {
    birthDate,
    birthTime: timePart.slice(0, 5),
  }
}

function toAppInput(testCase) {
  const { birthDate, birthTime } = parseSolarTime(testCase.input.solar_time)
  return {
    name: `case-${testCase.case_id}`,
    gender: 'male',
    calendarType: 'solar',
    birthDate,
    birthTime,
    birthPlace: '测试地点',
    isLeapMonth: false,
    longitude: String(testCase.input.longitude),
    latitude: String(testCase.input.latitude),
    useDst: Boolean(testCase.input.use_dst),
    useTrueSolarTime: Boolean(testCase.input.use_true_solar),
  }
}

function findPillar(result, key) {
  const label = labelByKey[key]
  const pillar = result.pillars.find((item) => item.label === label)
  assert.ok(pillar, `missing ${label}`)
  return pillar
}

for (const testCase of [...TEST_CASES, ...EXTREME_TEST_CASES]) {
  const appInput = toAppInput(testCase)
  assert.deepEqual(toCoreInput(appInput), testCase.input, `case ${testCase.case_id} input mapping`)

  const direct = calculateBaZi(testCase.input)
  const adapted = calculateBaziWithCore(appInput)

  for (const key of pillarKeys) {
    const pillar = findPillar(adapted, key)
    assert.equal(pillar.pillar, direct[key], `case ${testCase.case_id} ${key} pillar`)
    assert.equal(pillar.pillar, testCase.expect[key], `case ${testCase.case_id} ${key} expected`)
    assert.equal(pillar.gan, direct.pillars[key].stem, `case ${testCase.case_id} ${key} stem`)
    assert.equal(pillar.zhi, direct.pillars[key].branch, `case ${testCase.case_id} ${key} branch`)
    assert.equal(pillar.hiddenStems, direct.hidden_stems[key].join('、'), `case ${testCase.case_id} ${key} hidden stems`)
    assert.equal(pillar.shishenGan, direct.ten_gods.stems[key], `case ${testCase.case_id} ${key} stem ten god`)
    assert.equal(pillar.shishenZhi, direct.ten_gods.hidden[key].join('、'), `case ${testCase.case_id} ${key} hidden ten gods`)
    assert.equal(pillar.nayin, direct.nayin[key], `case ${testCase.case_id} ${key} na yin`)
    assert.equal(pillar.xunkong, direct.kong_wang[key].join('、'), `case ${testCase.case_id} ${key} kong wang`)
  }
}

assert.throws(
  () => calculateBaziWithCore({
    ...toAppInput(TEST_CASES[0]),
    calendarType: 'lunar',
  }),
  /v0\.2\.0 核心对接版先支持公历排盘/,
)

console.log(`Core adapter verified ${TEST_CASES.length + EXTREME_TEST_CASES.length}/${
  TEST_CASES.length + EXTREME_TEST_CASES.length
} cases.`)
