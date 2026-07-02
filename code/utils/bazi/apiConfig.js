const baziApiConfig = {
  enabled: true,
  baseUrl: 'http://127.0.0.1:8787',
  calculatePath: '/bazi/calculate',
  healthPath: '/health',
  coveragePath: '/bazi/calendar/coverage',
  timeout: 15000,
  provider: 'backend-local'
};

function getBaziApiConfig() {
  const app = typeof getApp === 'function' ? getApp({ allowDefault: true }) : null;
  const runtimeConfig = app && app.globalData && app.globalData.baziApi;
  return {
    ...baziApiConfig,
    ...(runtimeConfig || {})
  };
}

function buildBaziCalculateUrl(config) {
  return buildBaziApiUrl(config, config.calculatePath || '/bazi/calculate');
}

function buildBaziHealthUrl(config) {
  return buildBaziApiUrl(config, config.healthPath || '/health');
}

function buildBaziCoverageUrl(config) {
  return buildBaziApiUrl(config, config.coveragePath || '/bazi/calendar/coverage');
}

function buildBaziApiUrl(config, pathValue) {
  const baseUrl = String(config.baseUrl || '').replace(/\/$/, '');
  const path = String(pathValue || '');
  if (!baseUrl) return '';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function isLoopbackBaziApiUrl(baseUrl) {
  try {
    const url = new URL(String(baseUrl || ''));
    const hostname = url.hostname.toLowerCase();
    return hostname === 'localhost'
      || hostname === '::1'
      || hostname === '[::1]'
      || hostname === '0.0.0.0'
      || hostname.startsWith('127.');
  } catch (error) {
    return false;
  }
}

function isRealDevicePlatform(platform) {
  const text = String(platform || '').toLowerCase();
  return text === 'real-device' || text === 'device' || text === 'phone';
}

function detectBaziRuntimePlatform(wxApi) {
  const api = wxApi || (typeof wx !== 'undefined' ? wx : null);
  let info = null;
  if (api && typeof api.getDeviceInfo === 'function') {
    info = api.getDeviceInfo();
  } else if (api && typeof api.getSystemInfoSync === 'function') {
    info = api.getSystemInfoSync();
  }

  const platform = String((info && info.platform) || '').toLowerCase();
  if (platform === 'devtools') return 'devtools';
  if (platform === 'ios' || platform === 'android' || platform === 'harmony') return 'real-device';
  return platform;
}

function getBaziApiConnectionAdvice(config = {}, runtime = {}) {
  if (!config.enabled) {
    return {
      ok: false,
      code: 'BAZI_API_DISABLED',
      level: 'info',
      message: 'Remote bazi API is disabled.'
    };
  }

  if (!String(config.baseUrl || '').trim()) {
    return {
      ok: false,
      code: 'BAZI_API_MISSING_BASE_URL',
      level: 'error',
      message: 'Remote bazi API baseUrl is empty.'
    };
  }

  if (isRealDevicePlatform(runtime.platform) && isLoopbackBaziApiUrl(config.baseUrl)) {
    return {
      ok: false,
      code: 'BAZI_API_LOOPBACK_ON_REAL_DEVICE',
      level: 'warning',
      message: 'Real devices cannot reach a backend baseUrl on localhost or 127.0.0.1. Use the computer LAN IP or a deployed HTTPS domain.'
    };
  }

  return {
    ok: true,
    code: 'BAZI_API_READY',
    level: 'ok',
    message: 'Remote bazi API is configured.'
  };
}

module.exports = {
  baziApiConfig,
  getBaziApiConfig,
  buildBaziCalculateUrl,
  buildBaziHealthUrl,
  buildBaziCoverageUrl,
  isLoopbackBaziApiUrl,
  detectBaziRuntimePlatform,
  getBaziApiConnectionAdvice
};
