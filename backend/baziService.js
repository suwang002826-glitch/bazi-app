const { buildBaziProfile } = require('../code/utils/mock');
const { createBaziPlate } = require('../code/utils/baziPlate');

class BaziApiError extends Error {
  constructor(code, message, statusCode = 400, details = {}) {
    super(message);
    this.name = 'BaziApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function parseBirthTime(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new BaziApiError('INVALID_BIRTH_TIME', '出生时间格式不正确', 400);
  }

  const [, year, month, day, hour, minute, second = '00'] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  const isValid = date.getFullYear() === Number(year)
    && date.getMonth() + 1 === Number(month)
    && date.getDate() === Number(day)
    && date.getHours() === Number(hour)
    && date.getMinutes() === Number(minute)
    && date.getSeconds() === Number(second);
  if (!isValid) {
    throw new BaziApiError('INVALID_BIRTH_TIME', '出生时间格式不正确', 400);
  }

  return {
    birthDate: `${year}-${month}-${day}`,
    birthTime: `${hour}:${minute}`,
    beijingTime: `${year}-${month}-${day} ${hour}:${minute}`
  };
}

function finiteNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeBirthPlace(place = {}) {
  const province = place.province || '';
  const city = place.city || '';
  const district = place.district || '';
  const birthPlace = [province, city, district, place.town, place.address]
    .filter(Boolean)
    .join(' ')
    || '未填写出生地';
  const longitude = finiteNumber(place.lng, 116.4);
  const latitude = finiteNumber(place.lat, 39.9);

  return {
    birthPlace,
    region: [province, city, district],
    longitude: longitude.toFixed(2),
    latitude: latitude.toFixed(2),
    coordType: place.coordType || 'GCJ02'
  };
}

function normalizeCalculateRequest(payload = {}) {
  const time = parseBirthTime(payload.birthTime);
  const place = normalizeBirthPlace(payload.birthPlace || {});
  const calendarType = payload.calendarType === 'lunar' ? 'lunar' : 'solar';
  const input = {
    name: payload.name || '未命名',
    gender: payload.gender || '未填',
    calendarType,
    birthDate: time.birthDate,
    birthTime: time.birthTime,
    birthPlace: place.birthPlace,
    region: place.region,
    longitude: place.longitude,
    latitude: place.latitude,
    coordType: place.coordType,
    useTrueSolarTime: payload.timeMode === 'trueSolarTime',
    group: payload.options && payload.options.group || '练习',
    clientMeta: payload.clientMeta || {}
  };

  if (calendarType === 'lunar') {
    const lunarDate = payload.lunarDate || {};
    input.lunarYear = Number(lunarDate.year);
    input.lunarMonth = Number(lunarDate.month);
    input.lunarDay = Number(lunarDate.day);
    input.isLeapMonth = Boolean(lunarDate.isLeapMonth);
  }

  return input;
}

function findHint(result, title) {
  return (result.validationHints || []).find((item) => item.title === title) || {};
}

function attachBackendAccuracyFields(result, input) {
  const trueSolarHint = findHint(result, '真太阳时校验');
  const solarTermHint = findHint(result, '节气边界校验');
  const conversion = result.calendarConversion || {};
  const correctionMinutes = result.calibration && Number.isFinite(result.calibration.correctionMinutes)
    ? result.calibration.correctionMinutes
    : 0;

  return {
    ...result,
    timeMode: input.useTrueSolarTime ? 'trueSolarTime' : 'beijingTime',
    timeCalibration: {
      beijingTime: result.solarTime,
      localMeanSolarTime: result.adjustedSolarTime,
      trueSolarTime: result.adjustedSolarTime,
      longitude: Number(result.longitude),
      latitude: Number(input.latitude),
      coordType: input.coordType || 'GCJ02',
      correctionMinutes,
      note: trueSolarHint.text || ''
    },
    solarTermContext: {
      previous: '',
      previousAt: '',
      next: '',
      nextAt: '',
      monthBoundary: solarTermHint.text || '',
      provider: 'local-solar-longitude-search'
    },
    calendarProviderInfo: {
      lunar: {
        provider: 'local-preview-data-pack',
        calendarDataVersion: conversion.calendarDataVersion || '',
        source: conversion.source || '',
        status: conversion.dataPackStatus || 'local-preview'
      },
      solarTerm: {
        provider: 'local-solar-longitude-search',
        status: 'preview-rule-engine'
      }
    }
  };
}

function calculateBazi(payload = {}) {
  const input = normalizeCalculateRequest(payload);
  const result = attachBackendAccuracyFields(buildBaziProfile(input), input);
  return {
    result,
    baziPlate: createBaziPlate(result)
  };
}

function toErrorBody(error) {
  return {
    code: error.code || 'BAZI_BACKEND_ERROR',
    message: error.message || '排盘服务暂不可用',
    details: error.details || undefined
  };
}

module.exports = {
  BaziApiError,
  calculateBazi,
  normalizeCalculateRequest,
  toErrorBody
};
