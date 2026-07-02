const assert = require('assert');
const http = require('http');
const {
  calculateBazi,
  normalizeCalculateRequest
} = require('../backend/baziService');
const { createBaziServer } = require('../backend/server');

const solarRequest = {
  name: '张三',
  gender: '男',
  calendarType: 'solar',
  birthTime: '2000-01-01 08:00:00',
  birthPlace: {
    province: '北京市',
    city: '北京市',
    district: '东城区',
    lng: 116.4,
    lat: 39.9,
    coordType: 'GCJ02'
  },
  timeMode: 'trueSolarTime',
  options: {
    saveCase: true,
    group: '练习'
  },
  clientMeta: {
    source: 'wechat-miniprogram',
    schemaVersion: 'bazi-request@1.0.0'
  }
};

function requestJson(server, method, path, body) {
  const address = server.address();
  const payload = body === undefined ? '' : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: '127.0.0.1',
      port: address.port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          data: raw ? JSON.parse(raw) : null
        });
      });
    });
    request.on('error', reject);
    request.end(payload);
  });
}

async function withServer(run) {
  const server = createBaziServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(server);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

{
  const input = normalizeCalculateRequest(solarRequest);
  assert.strictEqual(input.name, '张三');
  assert.strictEqual(input.calendarType, 'solar');
  assert.strictEqual(input.birthDate, '2000-01-01');
  assert.strictEqual(input.birthTime, '08:00');
  assert.strictEqual(input.birthPlace, '北京市 北京市 东城区');
  assert.strictEqual(input.longitude, '116.40');
  assert.strictEqual(input.useTrueSolarTime, true);
  assert.strictEqual(input.group, '练习');
}

{
  const reading = calculateBazi(solarRequest);
  assert.strictEqual(reading.result.displayName, '张三');
  assert.strictEqual(reading.result.timeMode, 'trueSolarTime');
  assert.strictEqual(reading.result.pillars.length, 4);
  assert.strictEqual(reading.baziPlate.columns.length, 4);
  assert.ok(reading.result.timeCalibration.beijingTime);
  assert.ok(reading.result.timeCalibration.trueSolarTime);
  assert.strictEqual(reading.result.timeCalibration.coordType, 'GCJ02');
  assert.ok(reading.result.solarTermContext.monthBoundary);
  assert.strictEqual(reading.result.calendarProviderInfo.lunar.provider, 'local-preview-data-pack');
  assert.strictEqual(reading.result.calendarProviderInfo.solarTerm.provider, 'local-solar-longitude-search');
}

{
  const reading = calculateBazi({
    ...solarRequest,
    calendarType: 'lunar',
    lunarDate: {
      year: 2023,
      month: 8,
      day: 15,
      isLeapMonth: false
    },
    birthTime: '2023-09-29 20:00:00',
    timeMode: 'beijingTime'
  });
  assert.strictEqual(reading.result.calendarConversion.calendarType, 'lunar');
  assert.strictEqual(reading.result.calendarConversion.solarDate, '2023-09-29');
  assert.strictEqual(reading.result.timeMode, 'beijingTime');
}

{
  assert.throws(
    () => normalizeCalculateRequest({ ...solarRequest, birthTime: 'bad-time' }),
    (error) => {
      assert.strictEqual(error.code, 'INVALID_BIRTH_TIME');
      assert.strictEqual(error.statusCode, 400);
      return true;
    }
  );
}

withServer(async (server) => {
  const response = await requestJson(server, 'POST', '/bazi/calculate', solarRequest);
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.data.result.displayName, '张三');
  assert.strictEqual(response.data.baziPlate.columns.length, 4);

  const missing = await requestJson(server, 'POST', '/unknown', solarRequest);
  assert.strictEqual(missing.statusCode, 404);
  assert.strictEqual(missing.data.code, 'NOT_FOUND');

  const badMethod = await requestJson(server, 'GET', '/bazi/calculate');
  assert.strictEqual(badMethod.statusCode, 405);
  assert.strictEqual(badMethod.data.code, 'METHOD_NOT_ALLOWED');
})
  .then(() => console.log('PASS bazi backend service contract'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
