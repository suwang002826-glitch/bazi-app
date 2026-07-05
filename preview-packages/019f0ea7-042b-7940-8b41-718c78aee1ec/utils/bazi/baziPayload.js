const DEFAULT_PLACE = {
  province: '北京市',
  city: '北京市',
  district: '东城区',
  town: '',
  address: '',
  lng: 116.4,
  lat: 39.9,
  coordType: 'GCJ02'
};

function toNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeName(name) {
  const text = String(name || '').trim();
  return text || '未命名';
}

function normalizeRegion(region) {
  return Array.isArray(region) ? region : [];
}

function normalizeBirthPlace(form = {}) {
  const region = normalizeRegion(form.region);
  const place = typeof form.birthPlace === 'object' && form.birthPlace
    ? form.birthPlace
    : {};
  return {
    province: place.province || region[0] || DEFAULT_PLACE.province,
    city: place.city || region[1] || DEFAULT_PLACE.city,
    district: place.district || region[2] || DEFAULT_PLACE.district,
    town: place.town || form.town || '',
    address: place.address || form.address || '',
    lng: toNumber(place.lng || form.lng || form.longitude, DEFAULT_PLACE.lng),
    lat: toNumber(place.lat || form.lat || form.latitude, DEFAULT_PLACE.lat),
    coordType: place.coordType || form.coordType || DEFAULT_PLACE.coordType
  };
}

function formatPlaceText(place) {
  return [place.province, place.city, place.district, place.town, place.address]
    .filter(Boolean)
    .join(' ');
}

function normalizeTimeMode(form = {}) {
  if (form.timeMode) return form.timeMode;
  return form.useTrueSolarTime ? 'trueSolarTime' : 'beijingTime';
}

function buildBirthTime(form = {}) {
  const date = form.birthDate || '2000-01-01';
  const time = form.birthTime || '08:00';
  return `${date} ${time.length === 5 ? `${time}:00` : time}`;
}

function buildBaziRequestPayload(form = {}) {
  const birthPlace = normalizeBirthPlace(form);
  const calendarType = form.calendarType === 'lunar' ? 'lunar' : 'solar';
  const payload = {
    name: normalizeName(form.name),
    gender: form.gender || '未填',
    calendarType,
    birthTime: buildBirthTime(form),
    birthPlace,
    timeMode: normalizeTimeMode(form),
    options: {
      saveCase: Boolean(form.saveCase),
      group: form.group || '练习',
      requireSolarTermContext: true,
      requireTimeCalibration: true,
      requirePlaceCoordinate: true
    },
    clientMeta: {
      source: 'wechat-miniprogram',
      schemaVersion: 'bazi-request@1.0.0',
      coordType: birthPlace.coordType
    }
  };

  if (calendarType === 'lunar') {
    payload.lunarDate = {
      year: Number(form.lunarYear),
      month: Number(form.lunarMonth),
      day: Number(form.lunarDay),
      isLeapMonth: Boolean(form.isLeapMonth)
    };
  }

  return payload;
}

function buildLocalEngineInput(payload = {}, form = {}) {
  const place = payload.birthPlace || normalizeBirthPlace(form);
  const [birthDate, birthClock = '08:00:00'] = String(payload.birthTime || '').split(' ');
  const localInput = {
    ...form,
    name: payload.name,
    gender: payload.gender,
    calendarType: payload.calendarType,
    birthDate: birthDate || form.birthDate,
    birthTime: birthClock.slice(0, 5) || form.birthTime,
    birthPlace: formatPlaceText(place),
    birthPlaceDetail: place,
    longitude: String(place.lng),
    latitude: String(place.lat),
    coordType: place.coordType,
    timeMode: payload.timeMode,
    useTrueSolarTime: payload.timeMode === 'trueSolarTime'
  };

  if (payload.lunarDate) {
    localInput.lunarYear = payload.lunarDate.year;
    localInput.lunarMonth = payload.lunarDate.month;
    localInput.lunarDay = payload.lunarDate.day;
    localInput.isLeapMonth = payload.lunarDate.isLeapMonth;
  }

  return localInput;
}

module.exports = {
  normalizeBirthPlace,
  formatPlaceText,
  buildBaziRequestPayload,
  buildLocalEngineInput
};
