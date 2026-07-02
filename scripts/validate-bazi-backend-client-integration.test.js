const assert = require('assert');
const http = require('http');
const { createBaziServer } = require('../backend/server');
const { requestBaziCalculation } = require('../code/utils/baziApiClient');

function requestJson({ port, method = 'GET', path = '/', body }) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: '127.0.0.1',
      port,
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

function createNodeWxApi() {
  return {
    request(options) {
      const url = new URL(options.url);
      requestJson({
        port: Number(url.port),
        method: options.method || 'GET',
        path: url.pathname,
        body: options.data
      }).then((response) => {
        options.success(response);
      }).catch((error) => {
        options.fail({ errMsg: error.message });
      });
    }
  };
}

async function withServer(run) {
  const server = createBaziServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

withServer(async (port) => {
  const health = await requestJson({ port, path: '/health' });
  assert.strictEqual(health.statusCode, 200);
  assert.strictEqual(health.data.ok, true);
  assert.strictEqual(health.data.service, 'bazi-backend');

  const reading = await requestBaziCalculation({
    wxApi: createNodeWxApi(),
    config: {
      enabled: true,
      baseUrl: `http://127.0.0.1:${port}`,
      calculatePath: '/bazi/calculate',
      timeout: 15000,
      provider: 'backend-local'
    },
    input: {
      name: '联调样例',
      gender: '男',
      calendarType: 'solar',
      birthDate: '2000-01-01',
      birthTime: '08:00',
      region: ['北京市', '北京市', '东城区'],
      longitude: '116.40',
      latitude: '39.90',
      coordType: 'GCJ02',
      useTrueSolarTime: true,
      group: '练习'
    },
    saveCase: true
  });

  assert.strictEqual(reading.result.displayName, '联调样例');
  assert.strictEqual(reading.result.pillars.length, 4);
  assert.strictEqual(reading.result.timeMode, 'trueSolarTime');
  assert.strictEqual(reading.baziPlate.columns.length, 4);
  assert.ok(reading.result.timeCalibration.trueSolarTime);
})
  .then(() => console.log('PASS bazi backend-client HTTP integration'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
