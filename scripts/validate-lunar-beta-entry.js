const assert = require('assert');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'code', 'pages', 'bazi', 'bazi.js');
const wxmlPath = path.join(__dirname, '..', 'code', 'pages', 'bazi', 'bazi.wxml');
const fs = require('fs');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function applyDataPatch(target, patch) {
  Object.entries(patch).forEach(([key, value]) => {
    const parts = key.split('.');
    let cursor = target;
    parts.slice(0, -1).forEach((part) => {
      if (!cursor[part] || typeof cursor[part] !== 'object') {
        cursor[part] = {};
      }
      cursor = cursor[part];
    });
    cursor[parts[parts.length - 1]] = value;
  });
}

function createRemoteReading() {
  return {
    result: {
      title: '远程农历八字排盘',
      displayName: '张三',
      gender: '男',
      solarTime: '2023-09-29 09:00',
      birthPlace: '北京市 北京市 东城区',
      longitude: '116.40',
      calendarConversion: {
        calendarType: 'lunar',
        solarDate: '2023-09-29',
        dataPackVersion: 'hko-lunar-data-pack@2026.07.02-runtime-preview.1',
        sourceId: 'HKO_OPEN_DATA_NONGLI_2023'
      },
      pillars: [
        { label: '年柱', value: '癸卯', stem: '癸', branch: '卯', element: '水/木' },
        { label: '月柱', value: '辛酉', stem: '辛', branch: '酉', element: '金/金' },
        { label: '日柱', value: '庚寅', stem: '庚', branch: '寅', element: '金/木' },
        { label: '时柱', value: '丙戌', stem: '丙', branch: '戌', element: '火/土' }
      ],
      professional: {
        chartSummary: { oneLine: '远程农历样例' },
        spirits: [],
        growthStages: []
      },
      detailProfile: { pillarExtras: [] }
    }
  };
}

function loadBaziPage(options = {}) {
  delete require.cache[require.resolve(pagePath)];
  const calls = {
    requests: [],
    toasts: [],
    navigations: [],
    storage: [],
    history: [],
    cases: []
  };
  const app = {
    globalData: {
      disclaimer: '测试免责声明',
      currentBaziReading: null,
      baziApi: {
        enabled: true,
        baseUrl: 'https://api.example.test',
        calculatePath: '/bazi/calculate',
        healthPath: '/health',
        coveragePath: '/bazi/calendar/coverage',
        timeout: 15000,
        provider: 'backend-test'
      }
    },
    addHistory(item) {
      calls.history.push(item);
    },
    addCase(item) {
      calls.cases.push(item);
    },
    formatDateTime(date) {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    }
  };

  global.getApp = () => app;
  global.wx = {
    request(requestOptions) {
      calls.requests.push(requestOptions);
      if (typeof options.request === 'function') {
        options.request(requestOptions);
        return;
      }
      if (requestOptions.url === 'https://api.example.test/health') {
        requestOptions.success({
          statusCode: 200,
          data: { ok: true, service: 'bazi-backend' }
        });
        return;
      }
      if (requestOptions.url === 'https://api.example.test/bazi/calendar/coverage') {
        requestOptions.success({
          statusCode: 200,
          data: {
            ok: true,
            lunar: {
              backendRangePack: {
                dataPackId: 'hko-lunar-conversions-1901-2100',
                coverage: { gregorianYears: [1901, 2100] },
                usagePolicy: { calculateEndpointUse: 'enabled-for-backend-runtime-preview' }
              }
            }
          }
        });
        return;
      }
      requestOptions.success({
        statusCode: 200,
        data: createRemoteReading()
      });
    },
    showToast(options) {
      calls.toasts.push(options);
    },
    navigateTo(options) {
      calls.navigations.push(options);
      if (options && typeof options.complete === 'function') {
        options.complete();
      }
    },
    setStorageSync(key, value) {
      calls.storage.push({ key, value });
    }
  };
  global.Page = (definition) => {
    const page = {
      ...definition,
      data: clone(definition.data),
      setData(patch) {
        applyDataPatch(this.data, patch);
      }
    };
    global.__baziPage = page;
  };

  require(pagePath);
  return { page: global.__baziPage, app, calls };
}

function tapCalendarMode(page, mode) {
  page.onCalendarModeTap({
    currentTarget: {
      dataset: { mode }
    }
  });
}

async function run() {
const wxml = fs.readFileSync(wxmlPath, 'utf8');
assert(
  wxml.includes('农历排盘') || wxml.includes('农历择盘'),
  'bazi.wxml should visibly label lunar entry'
);
assert(
  wxml.includes('mode="multiSelector"')
    && wxml.includes('onLunarDateChange')
    && wxml.includes('onLeapMonthSwitch')
    && wxml.includes('lunarBetaError'),
  'bazi.wxml should expose lunar picker, leap-month switch, and beta error message'
);

{
  const { page } = loadBaziPage();
  tapCalendarMode(page, '农历');
  assert.strictEqual(page.data.activeCalendarMode, '农历');
  assert.strictEqual(page.data.form.calendarType, 'lunar');
  assert.strictEqual(page.data.lunarBetaError, '');

  const input = page.buildReadingInput();
  assert.strictEqual(input.calendarType, 'lunar');
  assert.strictEqual(input.lunarYear, 2023);
  assert.strictEqual(input.lunarMonth, 8);
  assert.strictEqual(input.lunarDay, 15);
  assert.strictEqual(input.isLeapMonth, false);
}

{
  const { page, app, calls } = loadBaziPage();
  page.setData({
    'form.name': '张三',
    'form.lunarYear': '2023',
    'form.lunarMonth': '8',
    'form.lunarDay': '15',
    'form.isLeapMonth': false
  });
  tapCalendarMode(page, '农历');
  await page.generateReading();

  assert.strictEqual(calls.requests.length, 3);
  assert.strictEqual(calls.requests[0].url, 'https://api.example.test/health');
  assert.strictEqual(calls.requests[0].method, 'GET');
  assert.strictEqual(calls.requests[1].url, 'https://api.example.test/bazi/calendar/coverage');
  assert.strictEqual(calls.requests[1].method, 'GET');
  assert.strictEqual(calls.requests[2].url, 'https://api.example.test/bazi/calculate');
  assert.strictEqual(calls.requests[2].data.calendarType, 'lunar');
  assert.deepStrictEqual(calls.requests[2].data.lunarDate, {
    year: 2023,
    month: 8,
    day: 15,
    isLeapMonth: false
  });
  assert.strictEqual(calls.navigations.length, 1);
  assert.strictEqual(calls.history.length, 1);
  assert.strictEqual(calls.cases.length, 1);
  assert.strictEqual(calls.cases[0].createdAt.length, 19);
  assert.strictEqual(app.globalData.currentBaziReading.result.calendarConversion.calendarType, 'lunar');
  assert.strictEqual(app.globalData.currentBaziReading.result.calendarConversion.solarDate, '2023-09-29');
  assert.strictEqual(page.data.lunarBetaError, '');
}

{
  const { page, app, calls } = loadBaziPage({
    request(requestOptions) {
      if (requestOptions.url === 'https://api.example.test/health') {
        requestOptions.success({
          statusCode: 200,
          data: { ok: true }
        });
        return;
      }
      if (requestOptions.url === 'https://api.example.test/bazi/calendar/coverage') {
        requestOptions.success({
          statusCode: 200,
          data: {
            ok: true,
            lunar: {
              backendRangePack: {
                dataPackId: 'hko-lunar-conversions-1901-2100',
                coverage: { gregorianYears: [1901, 2100] },
                usagePolicy: { calculateEndpointUse: 'enabled-for-backend-runtime-preview' }
              }
            }
          }
        });
        return;
      }
      requestOptions.success({
        statusCode: 400,
        data: {
          code: 'LUNAR_DATE_OUTSIDE_LIMITED_RUNTIME_SCOPE',
          message: '当前农历日期暂未覆盖'
        }
      });
    }
  });
  page.setData({
    'form.name': '李四',
    'form.lunarYear': '2026',
    'form.lunarMonth': '1',
    'form.lunarDay': '1',
    'form.isLeapMonth': false
  });
  tapCalendarMode(page, '农历');
  await page.generateReading();

  assert.strictEqual(calls.requests.length, 3);
  assert.strictEqual(calls.navigations.length, 0);
  assert.strictEqual(app.globalData.currentBaziReading, null);
  assert.strictEqual(page.data.isGenerating, false);
  assert(page.data.lunarBetaError.includes('暂未覆盖'));
  assert(calls.toasts.some((item) => item.title.includes('暂未覆盖')));
}

console.log('PASS lunar beta entry');
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { run };
