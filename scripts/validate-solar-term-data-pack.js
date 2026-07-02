const fs = require('fs');
const path = require('path');

const TERM_KEYS = [
  'xiaohan',
  'dahan',
  'lichun',
  'yushui',
  'jingzhe',
  'chunfen',
  'qingming',
  'guyu',
  'lixia',
  'xiaoman',
  'mangzhong',
  'xiazhi',
  'xiaoshu',
  'dashu',
  'liqiu',
  'chushu',
  'bailu',
  'qiufen',
  'hanlu',
  'shuangjiang',
  'lidong',
  'xiaoxue',
  'daxue',
  'dongzhi'
];

function readJson(filePath, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`missing file: ${path.relative(process.cwd(), filePath)}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`invalid json ${path.relative(process.cwd(), filePath)}: ${error.message}`);
    return null;
  }
}

function assertCondition(errors, condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function compareArrays(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function minutesSinceEpoch(localMinute) {
  const match = String(localMinute).match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) {
    return Number.NaN;
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) / 60000;
}

function secondTimestampToMinuteValue(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    return Number.NaN;
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second) / 60000;
}

function collectUserScreenshotMatchedYears(rootDir, pack, errors) {
  const reviewPath = path.join(
    rootDir,
    'code',
    'data-packs',
    'solar-terms',
    'reviews',
    'user-submitted-solar-terms-2024-2026-cross-check.json'
  );
  const review = readJson(reviewPath, errors);
  const matchedYears = [];

  if (!review || !review.years) {
    return matchedYears;
  }

  for (const year of ['2024', '2026']) {
    const reviewTerms = review.years[year]?.terms;
    const packTerms = pack.years?.[year];
    if (!Array.isArray(reviewTerms) || !Array.isArray(packTerms) || reviewTerms.length !== packTerms.length) {
      continue;
    }

    const allMatch = reviewTerms.every((term, index) => {
      const reviewMinute = secondTimestampToMinuteValue(term.datetime);
      const packMinute = minutesSinceEpoch(packTerms[index].local);
      return Number.isFinite(reviewMinute) && Number.isFinite(packMinute) && Math.abs(reviewMinute - packMinute) <= 1;
    });

    if (allMatch) {
      matchedYears.push(Number(year));
    }
  }

  return matchedYears;
}

function validatePack(rootDir, manifest, packEntry, errors) {
  const packPath = path.join(rootDir, 'code', 'data-packs', 'solar-terms', packEntry.path);
  const pack = readJson(packPath, errors);
  if (!pack) {
    return { pack: null, years: [], termCount: 0 };
  }

  assertCondition(errors, pack.id === packEntry.id, `pack id mismatch for ${packEntry.id}`);
  assertCondition(errors, pack.status === 'approved-for-runtime', `${pack.id} must be approved for limited runtime preview`);
  assertCondition(errors, pack.runtimeApproval?.status === 'approved-for-runtime', `${pack.id} must record runtime approval`);
  assertCondition(errors, pack.runtimeApproval?.scope === 'gregorian-years-2024-2026-runtime-preview', `${pack.id} must limit runtime approval scope`);
  assertCondition(errors, pack.authority?.institution === 'Hong Kong Observatory', `${pack.id} must use HKO as authority`);
  assertCondition(errors, pack.authority?.sourceId === manifest.primarySourceId, `${pack.id} must match manifest source id`);
  assertCondition(errors, pack.authority?.officialPageUrl === 'https://www.hko.gov.hk/sc/gts/astronomy/Solar_Term.htm', `${pack.id} must keep official HKO page URL`);
  assertCondition(errors, /24SolarTerms_\{year\}\.xml$/.test(pack.authority?.sourceFileUrlTemplate || ''), `${pack.id} must keep HKO XML URL template`);
  assertCondition(errors, pack.timezone?.sourceName === 'Asia/Hong_Kong', `${pack.id} must preserve source timezone`);
  assertCondition(errors, pack.timezone?.utcOffset === '+08:00', `${pack.id} must preserve HKO UTC offset`);
  assertCondition(errors, pack.timezone?.normalizedForBazi === 'Asia/Shanghai', `${pack.id} must define bazi normalization timezone`);
  assertCondition(errors, pack.precision === 'minute', `${pack.id} must record minute precision`);
  assertCondition(errors, compareArrays((pack.termOrder || []).map((term) => term.key), TERM_KEYS), `${pack.id} must keep standard 24-term order`);

  const years = Object.keys(pack.years || {}).map(Number).sort((left, right) => left - right);
  let termCount = 0;

  for (const year of years) {
    const yearKey = String(year);
    const terms = pack.years[yearKey];
    assertCondition(errors, Array.isArray(terms), `${pack.id} ${yearKey} must contain an array`);
    assertCondition(errors, terms.length === TERM_KEYS.length, `${pack.id} ${yearKey} must contain 24 terms`);
    assertCondition(errors, compareArrays(terms.map((term) => term.key), TERM_KEYS), `${pack.id} ${yearKey} must keep standard term order`);

    let previousMinute = -Infinity;
    for (const term of terms) {
      assertCondition(errors, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(term.local), `${pack.id} ${yearKey} ${term.key} must use minute timestamp`);
      assertCondition(errors, term.local.startsWith(`${yearKey}-`), `${pack.id} ${yearKey} ${term.key} must stay inside its Gregorian year`);
      assertCondition(errors, term.sourceFile === `24SolarTerms_${yearKey}.xml`, `${pack.id} ${yearKey} ${term.key} must cite the correct HKO XML file`);

      const currentMinute = minutesSinceEpoch(term.local);
      assertCondition(errors, currentMinute > previousMinute, `${pack.id} ${yearKey} terms must be chronologically increasing`);
      previousMinute = currentMinute;
    }

    termCount += terms.length;
  }

  assertCondition(errors, compareArrays(years, packEntry.coveredYears), `${pack.id} covered years must match manifest`);
  assertCondition(errors, termCount === packEntry.termCount, `${pack.id} term count must match manifest`);

  return { pack, years, termCount };
}

function validateSolarTermDataPackRepository({ rootDir }) {
  const errors = [];
  const manifestPath = path.join(rootDir, 'code', 'data-packs', 'solar-terms', 'manifest.json');
  const manifest = readJson(manifestPath, errors);
  const summary = {
    calendarDataVersion: manifest?.calendarDataVersion,
    status: manifest?.status,
    primaryAuthority: manifest?.primaryAuthority,
    packCount: 0,
    coveredYears: [],
    termCount: 0,
    runtimeEnabledPackIds: manifest?.runtimeEnabledPackIds || [],
    blockers: manifest?.blockers || [],
    crossCheck: {
      userScreenshotMatchedYears: [],
      comparisonRule: 'within-one-minute',
      toleranceMinutes: 1
    }
  };

  if (!manifest) {
    return { errors, summary };
  }

  assertCondition(errors, manifest.calendarDataVersion === 'hko-solar-term-data-pack@2026.07.03-runtime-preview.1', 'manifest must use HKO runtime-preview calendar version');
  assertCondition(errors, manifest.status === 'hko-runtime-preview', 'manifest must stay HKO runtime preview');
  assertCondition(errors, manifest.runtimeEnabled === true, 'manifest must enable limited runtime loading');
  assertCondition(errors, manifest.primaryAuthority === 'Hong Kong Observatory', 'manifest must use HKO as primary authority');
  assertCondition(errors, manifest.primarySourceId === 'HKO-SOLAR-TERMS-OFFICIAL-XML', 'manifest must use HKO official XML source id');
  assertCondition(errors, compareArrays(manifest.runtimeEnabledPackIds, ['hko-solar-terms-2024-2026-candidate']), 'manifest must enable only the HKO 2024-2026 pack');
  assertCondition(errors, compareArrays(manifest.blockers, []), 'manifest must not keep stale approval blockers');
  assertCondition(errors, Array.isArray(manifest.warnings) && manifest.warnings.some((warning) => warning.includes('2024, 2025, and 2026')), 'manifest must warn about limited runtime years');
  assertCondition(errors, Array.isArray(manifest.packs) && manifest.packs.length === 1, 'manifest must register exactly one runtime preview pack');

  for (const packEntry of manifest.packs || []) {
    const result = validatePack(rootDir, manifest, packEntry, errors);
    summary.packCount += result.pack ? 1 : 0;
    summary.termCount += result.termCount;
    summary.coveredYears = Array.from(new Set([...summary.coveredYears, ...result.years])).sort((left, right) => left - right);

    if (result.pack) {
      summary.crossCheck.userScreenshotMatchedYears = collectUserScreenshotMatchedYears(rootDir, result.pack, errors);
    }
  }

  return { errors, summary };
}

module.exports = {
  validateSolarTermDataPackRepository
};
