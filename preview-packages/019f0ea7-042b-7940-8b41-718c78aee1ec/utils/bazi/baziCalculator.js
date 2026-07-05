const { buildBaziProfile } = require('../mock');
const { createBaziPlate } = require('../baziPlate');
const { getBaziApiConfig, buildBaziCalculateUrl } = require('./apiConfig');
const {
  buildBaziRequestPayload,
  buildLocalEngineInput
} = require('./baziPayload');

function requestBazi(url, data, timeout) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      data,
      timeout,
      header: {
        'content-type': 'application/json'
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        reject(new Error(`BAZI_API_HTTP_${response.statusCode}`));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

function normalizeBackendReading(data, requestPayload, localInput) {
  const reading = data && data.reading ? data.reading : data;
  const result = reading && reading.result ? reading.result : reading;
  if (!result || typeof result !== 'object') {
    throw new Error('BAZI_API_INVALID_RESPONSE');
  }

  result.gender = result.gender || requestPayload.gender || '未填';
  result.displayName = result.displayName || requestPayload.name || '未命名';
  result.title = result.title || `${result.displayName}的八字排盘`;
  result.sourceInput = result.sourceInput || localInput;
  result.requestPayload = result.requestPayload || requestPayload;
  result.birthPlaceDetail = result.birthPlaceDetail || requestPayload.birthPlace;
  result.timeMode = result.timeMode || requestPayload.timeMode;
  result.engineSource = result.engineSource || 'backend';
  result.backendMeta = result.backendMeta || {
    provider: 'backend',
    receivedAt: Date.now()
  };

  return {
    result,
    baziPlate: reading.baziPlate || createBaziPlate(result)
  };
}

function buildLocalReading(requestPayload, localInput) {
  const result = buildBaziProfile(localInput);
  result.gender = requestPayload.gender || localInput.gender || '未填';
  result.sourceInput = localInput;
  result.requestPayload = requestPayload;
  result.birthPlaceDetail = requestPayload.birthPlace;
  result.timeMode = requestPayload.timeMode;
  result.timeCalibration = result.timeCalibration || {
    mode: requestPayload.timeMode,
    beijingTime: requestPayload.birthTime,
    trueSolarTime: result.adjustedSolarTime,
    longitude: requestPayload.birthPlace.lng,
    latitude: requestPayload.birthPlace.lat,
    coordType: requestPayload.birthPlace.coordType,
    correctionMinutes: result.calibration && result.calibration.correctionMinutes,
    hourChanged: result.calibration && result.calibration.hourChanged
  };
  result.solarTermContext = result.solarTermContext || {
    provider: result.calendarProviderInfo && result.calendarProviderInfo.solarTerm,
    hints: result.validationHints || []
  };
  result.engineSource = 'local';
  result.backendMeta = {
    provider: 'local',
    note: 'Backend API is not enabled. Local rule engine is used as a preview adapter.'
  };

  return {
    result,
    baziPlate: createBaziPlate(result)
  };
}

function calculateBazi(form = {}) {
  const requestPayload = buildBaziRequestPayload(form);
  const localInput = buildLocalEngineInput(requestPayload, form);
  const config = getBaziApiConfig();
  const url = buildBaziCalculateUrl(config);

  if (!config.enabled || !url) {
    return Promise.resolve(buildLocalReading(requestPayload, localInput));
  }

  return requestBazi(url, requestPayload, config.timeout)
    .then((data) => normalizeBackendReading(data, requestPayload, localInput));
}

module.exports = {
  calculateBazi,
  buildBaziRequestPayload
};
