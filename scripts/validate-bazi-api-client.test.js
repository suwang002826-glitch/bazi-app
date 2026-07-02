const assert = require('assert');
const {
  buildBaziCalculateRequest,
  normalizeBaziApiResponse,
  requestBaziCalculation,
  shouldUseRemoteBaziApi
} = require('../code/utils/baziApiClient');
const {
  buildBaziHealthUrl,
  buildBaziCoverageUrl,
  getBaziApiConnectionAdvice,
  isLoopbackBaziApiUrl
} = require('../code/utils/bazi/apiConfig');

const solarInput = {
  name: '张三',
  gender: '男',
  calendarType: 'solar',
  birthDate: '2000-01-01',
  birthTime: '08:00',
  region: ['北京市', '北京市', '东城区'],
  birthPlace: '北京市 北京市 东城区',
  longitude: '116.40',
  latitude: '39.90',
  useTrueSolarTime: true,
  group: '练习'
};

{
  const request = buildBaziCalculateRequest(solarInput, { saveCase: true });
  assert.strictEqual(request.name, '张三');
  assert.strictEqual(request.gender, '男');
  assert.strictEqual(request.calendarType, 'solar');
  assert.strictEqual(request.birthTime, '2000-01-01 08:00:00');
  assert.deepStrictEqual(request.birthPlace, {
    province: '北京市',
    city: '北京市',
    district: '东城区',
    town: '',
    address: '',
    lng: 116.4,
    lat: 39.9,
    coordType: 'GCJ02'
  });
  assert.strictEqual(request.timeMode, 'trueSolarTime');
  assert.strictEqual(request.options.saveCase, true);
  assert.strictEqual(request.options.group, '练习');
  assert.strictEqual(request.clientMeta.schemaVersion, 'bazi-request@1.0.0');
}

{
  const request = buildBaziCalculateRequest({
    ...solarInput,
    calendarType: 'lunar',
    lunarYear: 2023,
    lunarMonth: 8,
    lunarDay: 15,
    isLeapMonth: false,
    useTrueSolarTime: false
  }, { saveCase: false });
  assert.strictEqual(request.calendarType, 'lunar');
  assert.deepStrictEqual(request.lunarDate, {
    year: 2023,
    month: 8,
    day: 15,
    isLeapMonth: false
  });
  assert.strictEqual(request.timeMode, 'beijingTime');
  assert.strictEqual(request.options.saveCase, false);
}

{
  assert.strictEqual(shouldUseRemoteBaziApi({ enabled: false, baseUrl: 'https://api.example.com' }), false);
  assert.strictEqual(shouldUseRemoteBaziApi({ enabled: true, baseUrl: 'https://api.example.com' }), true);
  assert.strictEqual(shouldUseRemoteBaziApi({ enabled: true, baseUrl: '' }), false);
}

{
  const phoneConfig = {
    enabled: true,
    baseUrl: 'http://127.0.0.1:8787/',
    healthPath: '/health',
    coveragePath: '/bazi/calendar/coverage'
  };
  assert.strictEqual(buildBaziHealthUrl(phoneConfig), 'http://127.0.0.1:8787/health');
  assert.strictEqual(buildBaziCoverageUrl(phoneConfig), 'http://127.0.0.1:8787/bazi/calendar/coverage');
  assert.strictEqual(isLoopbackBaziApiUrl('http://127.0.0.1:8787'), true);
  assert.strictEqual(isLoopbackBaziApiUrl('http://localhost:8787'), true);
  assert.strictEqual(isLoopbackBaziApiUrl('http://192.168.1.23:8787'), false);

  const realDeviceAdvice = getBaziApiConnectionAdvice(phoneConfig, { platform: 'real-device' });
  assert.strictEqual(realDeviceAdvice.code, 'BAZI_API_LOOPBACK_ON_REAL_DEVICE');
  assert.strictEqual(realDeviceAdvice.ok, false);

  const lanAdvice = getBaziApiConnectionAdvice({
    ...phoneConfig,
    baseUrl: 'http://192.168.1.23:8787'
  }, { platform: 'real-device' });
  assert.strictEqual(lanAdvice.code, 'BAZI_API_READY');
  assert.strictEqual(lanAdvice.ok, true);
}

{
  const reading = normalizeBaziApiResponse({
    reading: {
      result: {
        title: '测试命盘',
        pillars: [
          { label: '年柱', value: '庚午', stem: '庚', branch: '午', element: '金/火' },
          { label: '月柱', value: '壬午', stem: '壬', branch: '午', element: '水/火' },
          { label: '日柱', value: '辛亥', stem: '辛', branch: '亥', element: '金/水' },
          { label: '时柱', value: '癸巳', stem: '癸', branch: '巳', element: '水/火' }
        ],
        professional: { spirits: [], growthStages: [] },
        detailProfile: { pillarExtras: [], voidText: '子丑' }
      }
    }
  });
  assert.strictEqual(reading.result.title, '测试命盘');
  assert.ok(reading.baziPlate);
  assert.strictEqual(reading.baziPlate.columns.length, 4);
}

async function testRequest() {
  const requests = [];
  const wxApi = {
    request(options) {
      requests.push(options);
      options.success({
        statusCode: 200,
        data: {
          result: {
            title: '远程命盘',
            pillars: [],
            professional: {},
            detailProfile: {}
          },
          baziPlate: { columns: [], rows: [] }
        }
      });
    }
  };
  const reading = await requestBaziCalculation({
    wxApi,
    config: {
      enabled: true,
      baseUrl: 'https://api.example.com/',
      calculatePath: '/bazi/calculate',
      timeout: 15000
    },
    input: solarInput,
    saveCase: true
  });
  assert.strictEqual(reading.result.title, '远程命盘');
  assert.strictEqual(requests.length, 1);
  assert.strictEqual(requests[0].url, 'https://api.example.com/bazi/calculate');
  assert.strictEqual(requests[0].method, 'POST');
  assert.strictEqual(requests[0].timeout, 15000);
  assert.strictEqual(requests[0].data.birthTime, '2000-01-01 08:00:00');
}

testRequest()
  .then(() => console.log('PASS bazi API client contract'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
