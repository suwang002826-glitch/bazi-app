const HISTORY_TIME_FILTERS = [
  { key: 'all', label: '全部' },
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' }
];

const HISTORY_SORT_OPTIONS = [
  { key: 'saved_desc', label: '最近保存' },
  { key: 'saved_asc', label: '最早保存' },
  { key: 'birth_desc', label: '出生晚到早' },
  { key: 'birth_asc', label: '出生早到晚' }
];

function normalizeText(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function toTime(value) {
  if (value == null || value === '') return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function getSavedAtMs(record) {
  if (!record) return 0;
  const direct = Number(record.savedAtMs);
  if (Number.isFinite(direct) && direct > 0) return direct;
  return toTime(record.savedAt) || 0;
}

function getBirthDateMs(record) {
  const input = (record && record.input) || {};
  return toTime(input.birthDate || input.solarTime || input.lunarText);
}

function getSearchText(record) {
  const input = (record && record.input) || {};
  const result = (record && (record.resultSnapshot || (record.payload && record.payload.result))) || {};
  return [
    record && record.title,
    record && record.summary,
    record && record.savedAt,
    input.name,
    input.gender,
    input.birthDate,
    input.birthTime,
    input.birthPlace,
    input.regionText,
    input.lunarText,
    input.calendarType,
    result.displayName,
    result.destinyLabel,
    result.solarTime,
    result.birthPlace
  ].map(normalizeText).filter(Boolean).join(' ');
}

function isInsideTimeFilter(record, timeFilter, now) {
  if (!timeFilter || timeFilter === 'all') return true;
  const savedAtMs = getSavedAtMs(record);
  if (!savedAtMs) return false;
  const nowMs = toTime(now) || Date.now();
  const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 0;
  if (!days) return true;
  return savedAtMs >= nowMs - days * 24 * 60 * 60 * 1000;
}

function compareNullableTime(a, b, direction) {
  const aMissing = a == null;
  const bMissing = b == null;
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === 'asc' ? a - b : b - a;
}

function sortRecords(records, sortMode) {
  const mode = sortMode || 'saved_desc';
  return records.slice().sort((a, b) => {
    if (mode === 'saved_asc') return getSavedAtMs(a) - getSavedAtMs(b);
    if (mode === 'birth_asc') return compareNullableTime(getBirthDateMs(a), getBirthDateMs(b), 'asc');
    if (mode === 'birth_desc') return compareNullableTime(getBirthDateMs(a), getBirthDateMs(b), 'desc');
    return getSavedAtMs(b) - getSavedAtMs(a);
  });
}

function filterBaziHistoryRecords(records, options = {}) {
  const keyword = normalizeText(options.keyword);
  const timeFilter = options.timeFilter || 'all';
  const filtered = Array.isArray(records)
    ? records.filter((record) => {
      if (!record) return false;
      if (!isInsideTimeFilter(record, timeFilter, options.now)) return false;
      if (!keyword) return true;
      return getSearchText(record).includes(keyword);
    })
    : [];

  return sortRecords(filtered, options.sortMode || 'saved_desc');
}

function findOptionLabel(options, key, fallback = '') {
  const item = Array.isArray(options) ? options.find((option) => option.key === key) : null;
  return item ? item.label : fallback;
}

module.exports = {
  HISTORY_SORT_OPTIONS,
  HISTORY_TIME_FILTERS,
  filterBaziHistoryRecords,
  findOptionLabel
};
