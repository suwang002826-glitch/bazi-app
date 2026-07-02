const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const path = require('path');

const startYear = Number(process.argv[2] || 1901);
const endYear = Number(process.argv[3] || 2100);
const outDir = process.argv[4] || path.join('data-packs', 'lunar', 'backend');
const hkoTextBase = 'https://www.hko.gov.hk/en/gts/time/calendar/text/files';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNameToNumber = {
  '1st': 1,
  '2nd': 2,
  '3rd': 3,
  '4th': 4,
  '5th': 5,
  '6th': 6,
  '7th': 7,
  '8th': 8,
  '9th': 9,
  '10th': 10,
  '11th': 11,
  '12th': 12
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function downloadOnce(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        response.resume();
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    request.setTimeout(25000, () => {
      request.destroy(new Error(`Request timeout: ${url}`));
    });
    request.on('error', reject);
  });
}

async function download(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await downloadOnce(url);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(600 * attempt);
      }
    }
  }
  throw lastError;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function normalizeSolarDate(value) {
  const match = String(value || '').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return '';
  return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
}

function getDayOfYear(dateText) {
  const date = new Date(`${dateText}T00:00:00Z`);
  const start = new Date(`${dateText.slice(0, 4)}-01-01T00:00:00Z`);
  return Math.floor((date - start) / 86400000) + 1;
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function getWeekdayAbbr(dateText) {
  const date = new Date(`${dateText}T00:00:00Z`);
  return weekdays[date.getUTCDay()].slice(0, 3);
}

function parseLine(line) {
  const text = line.replace(/\r/g, '').trimEnd();
  const dateMatch = text.match(/^(\d{4}\/\d{1,2}\/\d{1,2})\s+/);
  if (!dateMatch) return null;
  const dateToken = dateMatch[1];
  const rest = text.slice(dateMatch[0].length);
  const weekdayMatch = rest.match(new RegExp(`\\s+(${weekdays.join('|')})\\s*`));
  if (!weekdayMatch) return null;
  const lunarText = rest.slice(0, weekdayMatch.index).trim();
  const weekday = weekdayMatch[1];
  const solarTerm = rest.slice(weekdayMatch.index + weekdayMatch[0].length).trim();
  return {
    solarDate: normalizeSolarDate(dateToken),
    lunarText,
    weekday,
    solarTerm: solarTerm || ''
  };
}

function parseLunarMonthStart(lunarText) {
  const match = lunarText.match(/^(\d{1,2})(st|nd|rd|th)\s+Lunar\s+month$/i);
  if (!match) return null;
  return monthNameToNumber[`${match[1]}${match[2].toLowerCase()}`] || Number(match[1]);
}

function parseHkoYear(year, text) {
  const parsedLines = text.split(/\n/).map(parseLine).filter(Boolean);
  const firstMonthStart = parsedLines
    .map((line) => parseLunarMonthStart(line.lunarText))
    .find((month) => month);
  const records = [];
  let currentLunarYear = year - 1;
  let currentMonth = firstMonthStart
    ? (firstMonthStart === 1 ? 12 : firstMonthStart - 1)
    : 12;
  const monthSeen = {};

  parsedLines.forEach((parsed) => {
    const monthStart = parseLunarMonthStart(parsed.lunarText);
    let lunarDay;
    let isLeapMonth = false;

    if (monthStart) {
      if (monthStart === 1) {
        currentLunarYear = year;
        monthSeen[currentLunarYear] = {};
      }
      currentMonth = monthStart;
      monthSeen[currentLunarYear] = monthSeen[currentLunarYear] || {};
      isLeapMonth = Boolean(monthSeen[currentLunarYear][currentMonth]);
      monthSeen[currentLunarYear][currentMonth] = true;
      lunarDay = 1;
    } else {
      lunarDay = Number(parsed.lunarText);
      if (!currentMonth || !Number.isFinite(lunarDay)) {
        throw new Error(`Cannot parse lunar day for ${parsed.solarDate}: ${parsed.lunarText}`);
      }
      if (records.length) {
        isLeapMonth = Boolean(records[records.length - 1].le);
      }
    }

    if (monthStart && isLeapMonth) {
      monthSeen[currentLunarYear][currentMonth] = 'leap';
    }

    records.push({
      s: parsed.solarDate,
      ly: currentLunarYear,
      lm: currentMonth,
      ld: lunarDay,
      le: isLeapMonth ? 1 : 0,
      w: parsed.weekday.slice(0, 3),
      st: parsed.solarTerm
    });
  });

  return fillMissingSolarGaps(records);
}

function fillMissingSolarGaps(records) {
  const filled = [];
  records.forEach((record, index) => {
    if (index > 0) {
      const previous = filled[filled.length - 1];
      const expectedNext = addDays(previous.s, 1);
      if (record.s !== expectedNext) {
        const gapDays = getDayOfYear(record.s) - getDayOfYear(previous.s);
        if (gapDays === 2
          && previous.ly === record.ly
          && previous.lm === record.lm
          && previous.le === record.le
          && previous.ld + 2 === record.ld) {
          filled.push({
            s: expectedNext,
            ly: previous.ly,
            lm: previous.lm,
            ld: previous.ld + 1,
            le: previous.le,
            w: getWeekdayAbbr(expectedNext),
            st: '',
            q: 'inferred-from-hko-adjacent-gap'
          });
        }
      }
    }
    filled.push(record);
  });
  return filled;
}

function validateYear(year, records) {
  const expected = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1 ? 366 : 365;
  const errors = [];
  if (records.length !== expected) {
    errors.push(`Expected ${expected} records, got ${records.length}`);
  }
  const seen = new Set();
  records.forEach((record) => {
    if (seen.has(record.s)) errors.push(`Duplicate solar date ${record.s}`);
    seen.add(record.s);
    if (Number(record.s.slice(0, 4)) !== year) errors.push(`Out-of-year record ${record.s}`);
    if (getDayOfYear(record.s) !== seen.size) errors.push(`Date sequence mismatch at ${record.s}`);
    if (record.ld < 1 || record.ld > 30) errors.push(`Invalid lunar day ${record.s}: ${record.ld}`);
    if (record.lm < 1 || record.lm > 12) errors.push(`Invalid lunar month ${record.s}: ${record.lm}`);
  });
  return errors;
}

async function buildRangePack() {
  const yearly = {};
  const sources = [];
  const validation = [];
  const allRecords = [];
  const sourceCacheDir = path.join(outDir, 'sources');
  fs.mkdirSync(sourceCacheDir, { recursive: true });

  for (let year = startYear; year <= endYear; year += 1) {
    const url = `${hkoTextBase}/T${year}e.txt`;
    const cachePath = path.join(sourceCacheDir, `T${year}e.txt`);
    const raw = fs.existsSync(cachePath)
      ? fs.readFileSync(cachePath, 'utf8')
      : await download(url);
    if (!fs.existsSync(cachePath)) {
      fs.writeFileSync(cachePath, raw, 'utf8');
    }
    const sha256 = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
    const records = parseHkoYear(year, raw);
    const errors = validateYear(year, records);
    yearly[year] = records;
    allRecords.push(...records);
    sources.push({
      year,
      provider: 'Hong Kong Observatory',
      sourceUrl: url,
      sha256,
      byteLength: Buffer.byteLength(raw, 'utf8')
    });
    validation.push({
      year,
      records: records.length,
      firstSolarDate: records[0] && records[0].s,
      lastSolarDate: records[records.length - 1] && records[records.length - 1].s,
      leapMonthCount: records.filter((item, index, list) => item.le && (index === 0 || list[index - 1].lm !== item.lm || !list[index - 1].le)).length,
      solarTermCount: records.filter((item) => item.st).length,
      inferredRecordCount: records.filter((item) => item.q).length,
      inferredRecords: records.filter((item) => item.q).map((item) => ({ solarDate: item.s, reason: item.q })),
      status: errors.length ? 'fail' : 'pass',
      errors
    });
    if (errors.length) {
      throw new Error(`HKO ${year} validation failed: ${errors.join('; ')}`);
    }
    await sleep(80);
    console.log(`Parsed HKO ${year}: ${records.length} records${records.some((item) => item.q) ? ' (with inferred gap)' : ''}`);
  }

  const compactPayload = JSON.stringify(yearly);
  const dataPack = {
    dataPackId: `hko-lunar-conversions-${startYear}-${endYear}`,
    calendarDataVersion: `hko-lunar-text-pack@${startYear}-${endYear}.runtime-preview.1`,
    source: `HKO_TEXT_TABLE_${startYear}_${endYear}`,
    status: 'backend-runtime-preview',
    coverage: {
      gregorianYears: [startYear, endYear],
      completeGregorianCalendar: true,
      completeLunarCalendar: false,
      records: allRecords.length,
      scope: `HKO Gregorian-Lunar calendar text tables for Gregorian years ${startYear}-${endYear}`
    },
    authoritySource: 'Hong Kong Observatory Gregorian-Lunar Calendar Conversion Table text files',
    sourceLedger: sources,
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/build-hko-lunar-range-pack.js',
    recordsChecksum: {
      algorithm: 'sha256',
      value: crypto.createHash('sha256').update(compactPayload, 'utf8').digest('hex')
    },
    schema: {
      s: 'Gregorian date YYYY-MM-DD',
      ly: 'lunar year number',
      lm: 'lunar month number',
      ld: 'lunar day number',
      le: '1 when leap/intercalary lunar month, otherwise 0',
      w: 'weekday abbreviation',
      st: 'HKO solar term name on Gregorian date, if present'
    },
    years: yearly
  };

  fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, `hko-lunar-${startYear}-${endYear}`);
  fs.writeFileSync(`${base}.compact.json`, JSON.stringify(dataPack), 'utf8');
  fs.writeFileSync(`${base}.manifest.json`, JSON.stringify({
    ...dataPack,
    years: undefined,
    sourceLedger: sources.map((item) => ({
      year: item.year,
      sourceUrl: item.sourceUrl,
      sha256: item.sha256,
      byteLength: item.byteLength
    }))
  }, null, 2), 'utf8');
  fs.writeFileSync(`${base}.validation.json`, JSON.stringify({
    dataPackId: dataPack.dataPackId,
    status: validation.every((item) => item.status === 'pass') ? 'pass' : 'fail',
    totalRecords: allRecords.length,
    validation
  }, null, 2), 'utf8');
  console.log(`Generated ${dataPack.dataPackId}: ${allRecords.length} records`);
  console.log(`Checksum ${dataPack.recordsChecksum.value}`);
}

buildRangePack().catch((error) => {
  console.error(error);
  process.exit(1);
});
