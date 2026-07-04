const BAZI_HISTORY_STORAGE_KEY = 'baziCaseHistory';
const MAX_BAZI_HISTORY_ITEMS = 100;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function createHistoryId(now = new Date()) {
  const time = now instanceof Date ? now.getTime() : Date.now();
  return `bh_${time.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeBoolean(value) {
  return Boolean(value);
}

function buildBaziInputSnapshot(input = {}, result = {}) {
  const calendarConversion = result.calendarConversion || {};
  const isLunar = normalizeBoolean(
    input.isLunar
    || input.calendarType === 'lunar'
    || calendarConversion.isLunar
    || calendarConversion.calendarType === 'lunar'
  );

  return {
    calendarType: isLunar ? 'lunar' : 'solar',
    isLunar,
    isLeapMonth: normalizeBoolean(input.isLeapMonth || calendarConversion.isLeapMonth),
    birthDate: input.birthDate || result.solarTime || calendarConversion.outputCalendarText || '',
    birthTime: input.birthTime || '',
    gender: input.gender || result.gender || '',
    name: input.name || result.displayName || '',
    lunarYear: input.lunarYear,
    lunarMonth: input.lunarMonth,
    lunarDay: input.lunarDay,
    lunarText: input.lunarYearMonthDayText || calendarConversion.inputCalendarText || '',
    useTrueSolarTime: normalizeBoolean(input.useTrueSolarTime || calendarConversion.useTrueSolarTime),
    useEarlyLateZi: normalizeBoolean(input.useEarlyLateZi || calendarConversion.useEarlyLateZi),
    longitude: input.longitude !== undefined ? input.longitude : result.longitude,
    latitude: input.latitude !== undefined ? input.latitude : result.latitude,
    birthPlace: input.birthPlace || result.birthPlace || '',
    regionText: input.regionText || input.birthPlace || result.birthPlace || ''
  };
}

function getDefaultBaziHistoryTitle(input = {}, result = {}) {
  const snapshot = buildBaziInputSnapshot(input, result);
  const dateText = snapshot.isLunar
    ? (snapshot.lunarText || `${snapshot.lunarYear || ''}-${snapshot.lunarMonth || ''}-${snapshot.lunarDay || ''}`)
    : snapshot.birthDate;
  const timeText = snapshot.birthTime || '';
  const genderText = snapshot.gender || '';
  return [dateText, timeText, genderText].filter(Boolean).join(' ').trim() || 'Bazi case';
}

function createBaziHistoryRecord(options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const reading = options.reading || {};
  const result = reading.result || options.result || {};
  const input = buildBaziInputSnapshot(options.input || reading.input || {}, result);
  const title = String(options.name || options.title || getDefaultBaziHistoryTitle(input, result)).trim();
  const summary = options.summary
    || (result.professional && result.professional.chartSummary && result.professional.chartSummary.oneLine)
    || result.summary
    || '';

  return {
    id: options.id || createHistoryId(now),
    type: '八字',
    title,
    summary,
    savedAt: formatDateTime(now),
    savedAtMs: now.getTime(),
    engineVersion: options.engineVersion || result.betaLabel || '',
    input,
    payload: reading,
    resultSnapshot: result
  };
}

function readRawHistory(storage) {
  if (!storage || typeof storage.getStorageSync !== 'function') return [];
  return safeArray(storage.getStorageSync(BAZI_HISTORY_STORAGE_KEY));
}

function sortHistory(records) {
  return safeArray(records).slice().sort((a, b) => Number(b.savedAtMs || 0) - Number(a.savedAtMs || 0));
}

function listBaziHistoryRecords(storage) {
  return sortHistory(readRawHistory(storage));
}

function saveBaziHistoryRecord(storage, record) {
  if (!storage || typeof storage.setStorageSync !== 'function') return [];
  const next = [
    record,
    ...readRawHistory(storage).filter((item) => item && item.id !== record.id)
  ]
    .filter(Boolean)
    .slice(0, MAX_BAZI_HISTORY_ITEMS);
  const sorted = sortHistory(next);
  storage.setStorageSync(BAZI_HISTORY_STORAGE_KEY, sorted);
  return sorted;
}

function getBaziHistoryRecord(storage, id) {
  return listBaziHistoryRecords(storage).find((item) => String(item.id) === String(id)) || null;
}

function deleteBaziHistoryRecord(storage, id) {
  if (!storage || typeof storage.setStorageSync !== 'function') return [];
  const next = readRawHistory(storage).filter((item) => item && String(item.id) !== String(id));
  const sorted = sortHistory(next);
  storage.setStorageSync(BAZI_HISTORY_STORAGE_KEY, sorted);
  return sorted;
}

module.exports = {
  BAZI_HISTORY_STORAGE_KEY,
  buildBaziInputSnapshot,
  createBaziHistoryRecord,
  deleteBaziHistoryRecord,
  getBaziHistoryRecord,
  getDefaultBaziHistoryTitle,
  listBaziHistoryRecords,
  saveBaziHistoryRecord
};
