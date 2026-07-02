const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const path = require('path');

const YEAR = Number(process.argv[2] || new Date().getFullYear());
const OUT_DIR = process.argv[3] || path.join('data-packs', 'lunar');
const SOURCE_URL = `https://data.weather.gov.hk/weatherAPI/hko_data/calendar/nongli_calendar_${YEAR}.csv`;

const monthMap = {
  正月: 1,
  二月: 2,
  三月: 3,
  四月: 4,
  五月: 5,
  六月: 6,
  七月: 7,
  八月: 8,
  九月: 9,
  十月: 10,
  十一月: 11,
  十二月: 12,
  冬月: 11,
  腊月: 12
};

const dayMap = {
  初一: 1,
  初二: 2,
  初三: 3,
  初四: 4,
  初五: 5,
  初六: 6,
  初七: 7,
  初八: 8,
  初九: 9,
  初十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
  十九: 19,
  二十: 20,
  廿一: 21,
  廿二: 22,
  廿三: 23,
  廿四: 24,
  廿五: 25,
  廿六: 26,
  廿七: 27,
  廿八: 28,
  廿九: 29,
  三十: 30
};

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        response.resume();
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeDate(value) {
  const parts = String(value || '').match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!parts) return '';
  return `${parts[1]}-${parts[2].padStart(2, '0')}-${parts[3].padStart(2, '0')}`;
}

function parseLunarText(text) {
  const value = String(text || '').replace(/\s/g, '');
  const yearMatch = value.match(/(\d{4}|[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])年/);
  const monthMatch = value.match(/(闰?(?:正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月))/);
  const dayMatch = value.match(/(初[一二三四五六七八九十]|十[一二三四五六七八九]|二十|廿[一二三四五六七八九]|三十)$/);
  const rawMonth = monthMatch ? monthMatch[1] : '';
  const monthLabel = rawMonth.replace(/^闰/, '');
  return {
    lunarYearLabel: yearMatch ? yearMatch[1] : '',
    lunarMonth: monthMap[monthLabel],
    lunarDay: dayMap[dayMatch ? dayMatch[1] : ''],
    isLeapMonth: rawMonth.startsWith('闰'),
    lunarMonthName: monthLabel,
    lunarDayName: dayMatch ? dayMatch[1] : ''
  };
}

function buildPack(csv) {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1).map(parseCsvLine);
  const records = rows.map((row, index) => {
    const joined = row.join(' ');
    const solarDate = normalizeDate(row[0]);
    const lunar = parseLunarText(joined);
    return {
      caseId: `HKO-${YEAR}-${String(index + 1).padStart(4, '0')}`,
      solarDate,
      lunarYear: Number(lunar.lunarYearLabel) || YEAR,
      lunarMonth: lunar.lunarMonth,
      lunarDay: lunar.lunarDay,
      isLeapMonth: lunar.isLeapMonth,
      lunarMonthLabel: lunar.lunarMonthName,
      lunarDayLabel: lunar.lunarDayName,
      sourceRecord: `HKO CSV row ${index + 2}`,
      sourceNote: `HKO Gregorian-Lunar calendar conversion table ${YEAR}`
    };
  }).filter((record) => record.solarDate && record.lunarMonth && record.lunarDay);

  const checksum = crypto.createHash('sha256').update(JSON.stringify(records), 'utf8').digest('hex');
  return {
    dataPackId: `hko-lunar-conversions-${YEAR}`,
    calendarDataVersion: `hko-lunar-data-pack-${YEAR}@runtime-preview`,
    source: `HKO_OPEN_DATA_NONGLI_${YEAR}`,
    status: 'runtime-preview',
    coverage: {
      gregorianYears: [YEAR],
      scope: `complete Gregorian-year ${YEAR} HKO open-data calendar conversion table`,
      completeGregorianCalendar: records.length >= 365,
      completeLunarCalendar: false,
      records: records.length
    },
    authoritySource: `Hong Kong Observatory open data: Gregorian-Lunar calendar conversion table ${YEAR}`,
    sourceLedger: [{
      sourceName: `HKO Gregorian-Lunar Calendar Conversion Table ${YEAR} CSV`,
      sourceVersion: String(YEAR),
      dataProvider: 'Hong Kong Observatory',
      sourceUrl: SOURCE_URL,
      retrievedAt: new Date().toISOString()
    }],
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/build-hko-lunar-datapack.js',
    recordsChecksum: {
      algorithm: 'sha256',
      value: checksum
    },
    records
  };
}

async function main() {
  const csv = await download(SOURCE_URL);
  const pack = buildPack(csv);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const base = path.join(OUT_DIR, `hko-lunar-conversions-${YEAR}`);
  fs.writeFileSync(`${base}.js`, `module.exports = ${JSON.stringify(pack, null, 2)};\n`, 'utf8');
  fs.writeFileSync(`${base}.json`, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
  console.log(`Generated ${pack.dataPackId}: ${pack.records.length} records`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
