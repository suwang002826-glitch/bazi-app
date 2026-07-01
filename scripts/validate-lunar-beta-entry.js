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

function loadBaziPage() {
  delete require.cache[require.resolve(pagePath)];
  const calls = {
    toasts: [],
    navigations: [],
    storage: [],
    history: [],
    cases: []
  };
  const app = {
    globalData: {
      disclaimer: '测试免责声明',
      currentBaziReading: null
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

const wxml = fs.readFileSync(wxmlPath, 'utf8');
assert(
  wxml.includes('农历排盘测试版'),
  'bazi.wxml should visibly label lunar entry as beta'
);
assert(
  wxml.includes('lunarYear') && wxml.includes('lunarMonth') && wxml.includes('lunarDay'),
  'bazi.wxml should expose lunar year/month/day inputs'
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
  page.generateReading();

  assert.strictEqual(calls.navigations.length, 1);
  assert.strictEqual(calls.history.length, 1);
  assert.strictEqual(calls.cases.length, 1);
  assert.strictEqual(calls.cases[0].createdAt.length, 19);
  assert.strictEqual(app.globalData.currentBaziReading.result.calendarConversion.calendarType, 'lunar');
  assert.strictEqual(app.globalData.currentBaziReading.result.calendarConversion.solarDate, '2023-09-29');
  assert.strictEqual(page.data.lunarBetaError, '');
}

{
  const { page, app, calls } = loadBaziPage();
  page.setData({
    'form.name': '李四',
    'form.lunarYear': '2023',
    'form.lunarMonth': '1',
    'form.lunarDay': '1',
    'form.isLeapMonth': false
  });
  tapCalendarMode(page, '农历');
  page.generateReading();

  assert.strictEqual(calls.navigations.length, 0);
  assert.strictEqual(app.globalData.currentBaziReading, null);
  assert.strictEqual(page.data.isGenerating, false);
  assert(page.data.lunarBetaError.includes('暂未覆盖'));
  assert(calls.toasts.some((item) => item.title.includes('暂未覆盖')));
}

console.log('PASS lunar beta entry');
