const cityLocations = require('../../data-packs/city-locations.json');

function normalizeLocationToken(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .replace(/(省|市|自治州|特别行政区|区|县)$/g, '')
    .toLowerCase();
}

function buildLocationKey(parts) {
  return (parts || [])
    .filter(Boolean)
    .map((item) => normalizeLocationToken(item))
    .filter(Boolean)
    .join('|');
}

function ensureCoordinateValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return numeric.toFixed(2);
}

function normalizeEntry(entry) {
  if (!entry || !Number.isFinite(Number(entry.longitude)) || !Number.isFinite(Number(entry.latitude))) return null;
  return {
    name: entry.name || entry.city || entry.province || '未知城市',
    province: entry.province || '',
    city: entry.city || entry.name || '',
    district: entry.district || '',
    region: [entry.province || '', entry.city || entry.name || '', entry.district || ''].filter(Boolean),
    longitude: ensureCoordinateValue(entry.longitude),
    latitude: ensureCoordinateValue(entry.latitude),
    source: '系统内置城市'
  };
}

function buildLocationMap(entries = []) {
  const map = new Map();
  entries.forEach((entry) => {
    const location = normalizeEntry(entry);
    if (!location) return;

    const candidates = [
      [entry.province, entry.city, entry.district],
      [entry.province, entry.city],
      [entry.city, entry.district],
      [entry.city],
      [entry.province],
      [entry.name]
    ];

    if (Array.isArray(entry.aliases)) {
      entry.aliases.forEach((alias) => candidates.push(Array.isArray(alias) ? alias : [alias]));
    }

    candidates.forEach((candidate) => {
      const key = buildLocationKey(candidate);
      if (!key || map.has(key)) return;
      map.set(key, location);
    });
  });
  return map;
}

function buildCityPickerOptions(entries = []) {
  const seen = new Set();
  return entries
    .map(normalizeEntry)
    .filter(Boolean)
    .filter((entry) => {
      const key = `${entry.name}|${entry.longitude}|${entry.latitude}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((entry) => ({
      ...entry,
      label: `${entry.name}（东经${entry.longitude} 北纬${entry.latitude}）`
    }));
}

const DEFAULT_ENTRIES = (cityLocations && cityLocations.entries) || [];
const LOCATION_MAP = buildLocationMap(DEFAULT_ENTRIES);
const CITY_PICKER_OPTIONS = buildCityPickerOptions(DEFAULT_ENTRIES);

function findLocationByRegion(region) {
  if (!Array.isArray(region)) return null;
  const normalized = region.filter(Boolean);
  if (!normalized.length) return null;

  const lookupKeys = [
    buildLocationKey(normalized.slice(0, 3)),
    buildLocationKey(normalized.slice(0, 2)),
    buildLocationKey(normalized.slice(0, 1)),
    buildLocationKey(normalized.slice(-1))
  ];

  for (let i = 0; i < lookupKeys.length; i += 1) {
    const key = lookupKeys[i];
    if (!key) continue;
    const matched = LOCATION_MAP.get(key);
    if (matched) return matched;
  }
  return null;
}

function getCityPickerNames(options = CITY_PICKER_OPTIONS) {
  return options.map((item) => item.label);
}

function resolveCityPickerSelection(index, options = CITY_PICKER_OPTIONS) {
  const numericIndex = Number(index);
  if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= options.length) {
    return options[0] || null;
  }
  return options[numericIndex] || null;
}

module.exports = {
  CITY_PICKER_OPTIONS,
  buildCityPickerOptions,
  buildLocationMap,
  findLocationByRegion,
  getCityPickerNames,
  resolveCityPickerSelection
};
