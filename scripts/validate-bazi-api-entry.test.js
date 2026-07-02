const assert = require('assert');
const path = require('path');

const appPath = path.join(__dirname, '..', 'code', 'app.js');
const pagePath = path.join(__dirname, '..', 'code', 'pages', 'bazi', 'bazi.js');

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

function loadAppDefinition() {
  delete require.cache[require.resolve(appPath)];
  let appDefinition;
  global.App = (definition) => {
    appDefinition = definition;
  };
  global.wx = {
    getStorageSync() {
      return [];
    },
    setStorageSync() {}
  };
  require(appPath);
  return appDefinition;
}

function loadBaziPage(app, wxApi) {
  delete require.cache[require.resolve(pagePath)];
  global.getApp = () => app;
  global.wx = wxApi;
  global.Page = (definition) => {
    const page = {
      ...definition,
      data: clone(definition.data),
      setData(patch) {
        applyDataPatch(this.data, patch);
      }
    };
    global.__baziApiPage = page;
  };
  require(pagePath);
  return global.__baziApiPage;
}

{
  const appDefinition = loadAppDefinition();
  assert.deepStrictEqual(appDefinition.globalData.baziApi, {
    enabled: false,
    baseUrl: '',
    calculatePath: '/bazi/calculate',
    timeout: 15000,
    provider: 'local'
  });
}

async function testRemoteEntry() {
  const calls = {
    requests: [],
    storage: [],
    history: [],
    cases: [],
    navigations: [],
    toasts: []
  };
  const app = {
    globalData: {
      disclaimer: '测试免责声明',
      currentBaziReading: null,
      engineVersion: 'local-rules-2026.06.29',
      baziApi: {
        enabled: true,
        baseUrl: 'https://api.example.com',
        calculatePath: '/bazi/calculate',
        timeout: 15000,
        provider: 'backend'
      }
    },
    addHistory(record) {
      calls.history.push(record);
    },
    addCase(record) {
      calls.cases.push(record);
    },
    formatDateTime(date) {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    }
  };
  const wxApi = {
    request(options) {
      calls.requests.push(options);
      options.success({
        statusCode: 200,
        data: {
          result: {
            title: '远程八字排盘',
            displayName: '张三',
            gender: '男',
            solarTime: '2000-01-01 08:00',
            adjustedSolarTime: '2000-01-01 07:45',
            birthPlace: '北京市 北京市 东城区',
            longitude: '116.40',
            timeMode: 'trueSolarTime',
            pillars: [
              { label: '年柱', value: '庚午', stem: '庚', branch: '午', element: '金/火' },
              { label: '月柱', value: '壬午', stem: '壬', branch: '午', element: '水/火' },
              { label: '日柱', value: '辛亥', stem: '辛', branch: '亥', element: '金/水' },
              { label: '时柱', value: '癸巳', stem: '癸', branch: '巳', element: '水/火' }
            ],
            professional: {
              chartSummary: { oneLine: '远程摘要' },
              spirits: [],
              growthStages: []
            },
            detailProfile: { pillarExtras: [], voidText: '子丑' },
            flowTriggerSummary: { summary: '远程触发' }
          }
        }
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

  const page = loadBaziPage(app, wxApi);
  page.setData({
    'form.name': '张三',
    'form.useTrueSolarTime': true
  });
  await page.generateReading();

  assert.strictEqual(calls.requests.length, 1);
  assert.strictEqual(calls.requests[0].url, 'https://api.example.com/bazi/calculate');
  assert.strictEqual(calls.requests[0].data.name, '张三');
  assert.strictEqual(calls.requests[0].data.timeMode, 'trueSolarTime');
  assert.strictEqual(calls.navigations.length, 1);
  assert.strictEqual(calls.history.length, 1);
  assert.strictEqual(calls.cases.length, 1);
  assert.strictEqual(app.globalData.currentBaziReading.result.title, '远程八字排盘');
  assert.ok(app.globalData.currentBaziReading.baziPlate);
  assert.strictEqual(app.globalData.currentBaziReading.baziPlate.columns.length, 4);
  assert.strictEqual(page.data.isGenerating, false);
}

testRemoteEntry()
  .then(() => console.log('PASS bazi API page entry'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
