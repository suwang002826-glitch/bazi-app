const baziApiConfig = {
  enabled: true,
  baseUrl: 'http://127.0.0.1:8787',
  calculatePath: '/bazi/calculate',
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
  const baseUrl = String(config.baseUrl || '').replace(/\/$/, '');
  const path = String(config.calculatePath || '/bazi/calculate');
  if (!baseUrl) return '';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

module.exports = {
  baziApiConfig,
  getBaziApiConfig,
  buildBaziCalculateUrl
};
