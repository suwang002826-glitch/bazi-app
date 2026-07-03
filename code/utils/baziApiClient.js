const { createBaziPlate } = require('./baziPlate');

const DEFAULT_BAZI_API_CONFIG = {
  enabled: false,
  baseUrl: '',
  calculatePath: '/bazi/calculate',
  healthPath: '/health',
  coveragePath: '/bazi/calendar/coverage',
  timeout: 15000,
  provider: 'local'
};

function normalizeTimeText(value) {
  const text = String(value || '00:00').trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) return text;
  if (/^\d{2}:\d{2}$/.test(text)) return `${text}:00`;
  return '00:00:00';
}

function buildBirthTime(input = {}) {
  const dateText = String(input.birthDate || '').trim() || `${input.lunarYear || '2000'}-${String(input.lunarMonth || '01').padStart(2, '0')}-${String(input.lunarDay || '01').padStart(2, '0')}`;
  return `${dateText} ${normalizeTimeText(input.birthTime)}`;
}

function toFiniteNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function buildBirthPlace(input = {}) {
  const region = Array.isArray(input.region) ? input.region : [];
  return {
    province: input.province || region[0] || '',
    city: input.city || region[1] || '',
    district: input.district || region[2] || '',
    town: input.town || '',
    address: input.address || '',
    lng: toFiniteNumber(input.lng !== undefined ? input.lng : input.longitude, 116.4),
    lat: toFiniteNumber(input.lat !== undefined ? input.lat : input.latitude, 39.9),
    coordType: input.coordType || 'GCJ02'
  };
}

function buildBaziCalculateRequest(input = {}, options = {}) {
  const calendarType = input.calendarType === 'lunar' ? 'lunar' : 'solar';
  const request = {
    name: input.name || '未命名',
    gender: input.gender || '未填',
    calendarType,
    birthTime: buildBirthTime(input),
    birthPlace: buildBirthPlace(input),
    timeMode: input.useTrueSolarTime ? 'trueSolarTime' : 'beijingTime',
    options: {
      saveCase: Boolean(options.saveCase),
      group: input.group || options.group || '练习',
      requireSolarTermContext: true,
      requireTimeCalibration: true,
      requirePlaceCoordinate: true
    },
    clientMeta: {
      source: 'wechat-miniprogram',
      schemaVersion: 'bazi-request@1.0.0',
      coordType: input.coordType || 'GCJ02'
    }
  };

  if (calendarType === 'lunar') {
    request.lunarDate = {
      year: Number(input.lunarYear),
      month: Number(input.lunarMonth),
      day: Number(input.lunarDay),
      isLeapMonth: Boolean(input.isLeapMonth)
    };
  }

  return request;
}

function normalizeResultShape(result = {}) {
  return {
    ...result,
    pillars: Array.isArray(result.pillars) ? result.pillars : [],
    professional: {
      spirits: [],
      growthStages: [],
      ...(result.professional || {})
    },
    detailProfile: {
      pillarExtras: [],
      ...(result.detailProfile || {})
    }
  };
}

function normalizeBaziApiResponse(payload = {}) {
  const reading = payload.reading || payload;
  if (!reading || !reading.result) {
    const error = new Error('排盘接口返回缺少 result');
    error.code = 'BAZI_API_INVALID_RESPONSE';
    throw error;
  }

  const result = normalizeResultShape(reading.result);
  return {
    result,
    baziPlate: reading.baziPlate || createBaziPlate(result)
  };
}

function shouldUseRemoteBaziApi(config = {}) {
  return Boolean(config.enabled && String(config.baseUrl || '').trim());
}

function isBaziLunarRangeReady(coverage = {}, options = {}) {
  const expectedStartYear = Number(options.startYear || 1901);
  const expectedEndYear = Number(options.endYear || 2100);
  const rangePack = coverage
    && coverage.lunar
    && coverage.lunar.backendRangePack;
  const range = rangePack
    && rangePack.coverage
    && rangePack.coverage.gregorianYears;
  const usagePolicy = rangePack && rangePack.usagePolicy;

  return Boolean(
    rangePack
      && rangePack.dataPackId === 'hko-lunar-conversions-1901-2100'
      && Array.isArray(range)
      && Number(range[0]) <= expectedStartYear
      && Number(range[1]) >= expectedEndYear
      && usagePolicy
      && usagePolicy.calculateEndpointUse === 'enabled-for-backend-runtime-preview'
  );
}

function joinUrl(baseUrl, path) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const route = String(path || DEFAULT_BAZI_API_CONFIG.calculatePath).replace(/^\/?/, '/');
  return `${base}${route}`;
}

function createHttpError(response = {}) {
  const data = response.data || {};
  const error = new Error(data.message || `排盘接口请求失败：${response.statusCode || 'unknown'}`);
  error.code = data.code || 'BAZI_API_HTTP_ERROR';
  error.statusCode = response.statusCode;
  return error;
}

function requestBaziCalculation({ wxApi, config = {}, input = {}, saveCase = false }) {
  const runtimeConfig = {
    ...DEFAULT_BAZI_API_CONFIG,
    ...config
  };
  if (!shouldUseRemoteBaziApi(runtimeConfig)) {
    const error = new Error('排盘接口未启用或缺少 baseUrl');
    error.code = 'BAZI_API_DISABLED';
    return Promise.reject(error);
  }

  const requestData = buildBaziCalculateRequest(input, { saveCase });
  return new Promise((resolve, reject) => {
    wxApi.request({
      url: joinUrl(runtimeConfig.baseUrl, runtimeConfig.calculatePath),
      method: 'POST',
      data: requestData,
      timeout: runtimeConfig.timeout,
      success(response) {
        if (!response || response.statusCode < 200 || response.statusCode >= 300) {
          reject(createHttpError(response));
          return;
        }
        try {
          resolve(normalizeBaziApiResponse(response.data));
        } catch (error) {
          reject(error);
        }
      },
      fail(error = {}) {
        const wrapped = new Error(error.errMsg || '排盘接口连接失败');
        wrapped.code = 'BAZI_API_NETWORK_ERROR';
        reject(wrapped);
      }
    });
  });
}

function requestBaziHealth({ wxApi, config = {} }) {
  const runtimeConfig = {
    ...DEFAULT_BAZI_API_CONFIG,
    ...config
  };
  if (!shouldUseRemoteBaziApi(runtimeConfig)) {
    const error = new Error('后端排盘服务未配置，请先启动后端服务');
    error.code = 'BAZI_API_DISABLED';
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    wxApi.request({
      url: joinUrl(runtimeConfig.baseUrl, runtimeConfig.healthPath),
      method: 'GET',
      timeout: runtimeConfig.timeout,
      success(response) {
        if (!response || response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error('后端连接失败，请确认服务已启动');
          error.code = 'BAZI_API_HEALTH_ERROR';
          error.statusCode = response && response.statusCode;
          reject(error);
          return;
        }
        resolve(response.data || {});
      },
      fail() {
        const error = new Error('后端连接失败，请确认服务已启动');
        error.code = 'BAZI_API_HEALTH_ERROR';
        reject(error);
      }
    });
  });
}

function requestBaziCoverage({ wxApi, config = {} }) {
  const runtimeConfig = {
    ...DEFAULT_BAZI_API_CONFIG,
    ...config
  };
  if (!shouldUseRemoteBaziApi(runtimeConfig)) {
    const error = new Error('后端排盘服务未配置，请先启动后端服务');
    error.code = 'BAZI_API_DISABLED';
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    wxApi.request({
      url: joinUrl(runtimeConfig.baseUrl, runtimeConfig.coveragePath),
      method: 'GET',
      timeout: runtimeConfig.timeout,
      success(response) {
        if (!response || response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error('后端农历覆盖范围检查失败，请确认服务已更新');
          error.code = 'BAZI_API_COVERAGE_ERROR';
          error.statusCode = response && response.statusCode;
          reject(error);
          return;
        }
        resolve(response.data || {});
      },
      fail() {
        const error = new Error('后端农历覆盖范围检查失败，请确认服务已启动');
        error.code = 'BAZI_API_COVERAGE_ERROR';
        reject(error);
      }
    });
  });
}

module.exports = {
  DEFAULT_BAZI_API_CONFIG,
  buildBaziCalculateRequest,
  isBaziLunarRangeReady,
  normalizeBaziApiResponse,
  requestBaziCalculation,
  requestBaziCoverage,
  requestBaziHealth,
  shouldUseRemoteBaziApi
};
