const { buildReadingFromForm } = require('../../utils/bazi/pageAdapter');
const { buildBaziInputSnapshot } = require('../../utils/bazi/historyStore');
const preciseSolarTerms = require('../../data-packs/solar-terms/solarTerms-precise-1900-2100');
const { createBaziPlate } = require('../../utils/baziPlate');
const cityLocations = require('../../data-packs/city-locations');
const lunarConversions = require('../../data-packs/lunar/lunar-conversions-1901-2100');
const {
  getCityPickerNames,
  resolveCityPickerSelection
} = require('../../utils/bazi/citySelector');

const app = getApp();

const DEFAULT_DISCLAIMER = '排盘结果仅供参考，不作为投资、医疗、法律等高风险决策依据。';
const DEFAULT_REGION = ['北京市', '北京市', '东城区'];
const CITY_PICKER_NAMES = getCityPickerNames();
const DEFAULT_LUNAR_SELECTION = {
  lunarYear: 2000,
  lunarMonth: 1,
  lunarDay: 1,
  isLeapMonth: false
};
const LUNAR_MONTH_NAMES = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_DAY_NAMES = [
  '',
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

function normalizeLocationToken(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .replace(/(省|市|自治州|特别行政区|区|县)$/g, '')
    .toLowerCase();
}

function buildLocationKey(parts) {
  return parts
    .filter(Boolean)
    .map((item) => normalizeLocationToken(item))
    .filter(Boolean)
    .join('|');
}

function ensureCoordinateValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return numeric.toFixed(2);
}

function buildLocationMap(entries) {
  const map = new Map();
  (entries || []).forEach((entry) => {
    if (!entry || !Number.isFinite(Number(entry.longitude))) return;
    const location = {
      name: entry.name || `${entry.city || ''}${entry.district || ''}`.trim() || entry.province || '未知地区',
      longitude: ensureCoordinateValue(entry.longitude),
      latitude: ensureCoordinateValue(entry.latitude),
      source: '系统内置位置点'
    };

    const candidates = [];
    const candidateGroups = [
      [entry.province, entry.city, entry.district],
      [entry.province, entry.city],
      [entry.city, entry.district],
      [entry.city],
      [entry.province],
      [entry.name]
    ];

    if (Array.isArray(entry.aliases)) {
      entry.aliases.forEach((alias) => {
        candidates.push(Array.isArray(alias) ? alias : [alias]);
      });
    }

    candidateGroups.forEach((candidate) => candidates.push(candidate));

    candidates.forEach((candidate) => {
      const key = buildLocationKey(candidate);
      if (!key) return;
      if (!map.has(key)) map.set(key, location);
    });
  });

  return map;
}

const LOCATION_MAP = buildLocationMap((cityLocations && cityLocations.entries) || []);

function findLocationByRegion(region) {
  if (!Array.isArray(region)) return null;
  const normalized = region.filter(Boolean);
  if (!normalized.length) return null;

  const lookupKeys = [
    buildLocationKey(normalized.slice(0, 3)),
    buildLocationKey(normalized.slice(0, 2)),
    buildLocationKey(normalized.slice(0, 1)),
    buildLocationKey(normalized.slice(-1))
  ];

  for (let i = 0; i < lookupKeys.length; i += 1) {
    const key = lookupKeys[i];
    if (!key) continue;
    const matched = LOCATION_MAP.get(key);
    if (matched) return matched;
  }

  return null;
}

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function buildLunarIndex(records = []) {
  const byYear = {};
  const years = [];

  records.forEach((record) => {
    if (!record || !isPositiveInt(record.lunarYear)) return;
    if (!byYear[record.lunarYear]) {
      byYear[record.lunarYear] = {
        months: [],
        byMonthKey: {}
      };
      years.push(record.lunarYear);
    }

    const yearEntry = byYear[record.lunarYear];
    const key = `${record.lunarMonth}-${record.isLeapMonth ? 'leap' : 'normal'}`;
    if (!yearEntry.byMonthKey[key]) {
      yearEntry.byMonthKey[key] = {
        lunarMonth: record.lunarMonth,
        isLeapMonth: Boolean(record.isLeapMonth),
        days: []
      };
      yearEntry.months.push(yearEntry.byMonthKey[key]);
    }

    yearEntry.byMonthKey[key].days.push(record.lunarDay);
  });

  years.sort((a, b) => a - b);
  years.forEach((year) => {
    byYear[year].months.sort((a, b) => {
      if (a.lunarMonth !== b.lunarMonth) return a.lunarMonth - b.lunarMonth;
      if (a.isLeapMonth === b.isLeapMonth) return 0;
      return a.isLeapMonth ? 1 : -1;
    });
    byYear[year].months.forEach((month) => {
      month.days = Array.from(new Set(month.days)).sort((a, b) => a - b);
    });
  });

  return { years, byYear };
}

const LUNAR_INDEX = buildLunarIndex(lunarConversions.records || []);
const LUNAR_COVERAGE_TEXT = LUNAR_INDEX.years.length
  ? `已覆盖${LUNAR_INDEX.years[0]}-${LUNAR_INDEX.years[LUNAR_INDEX.years.length - 1]}年`
  : '农历数据未加载';

function formatLunarMonth(month, isLeapMonth) {
  return `${isLeapMonth ? '闰' : ''}${LUNAR_MONTH_NAMES[month] || `${month}月`}`;
}

function formatLunarDay(day) {
  return LUNAR_DAY_NAMES[day] || `${day}日`;
}

function formatLunarText(year, month, day, isLeapMonth) {
  return `${year}年 ${formatLunarMonth(month, isLeapMonth)} ${formatLunarDay(day)}`;
}

function getLunarMonths(year) {
  const yearEntry = LUNAR_INDEX.byYear[year];
  return yearEntry ? yearEntry.months : [];
}

function buildLunarPickerState(selection = DEFAULT_LUNAR_SELECTION) {
  const years = LUNAR_INDEX.years;
  const fallbackYearIndex = Math.max(0, years.indexOf(DEFAULT_LUNAR_SELECTION.lunarYear));
  let yearIndex = years.indexOf(Number(selection.lunarYear));
  if (yearIndex < 0) yearIndex = fallbackYearIndex;

  const year = years[yearIndex] || DEFAULT_LUNAR_SELECTION.lunarYear;
  const months = getLunarMonths(year);
  let monthIndex = months.findIndex((item) => (
    item.lunarMonth === Number(selection.lunarMonth)
    && item.isLeapMonth === Boolean(selection.isLeapMonth)
  ));
  if (monthIndex < 0) {
    monthIndex = months.findIndex((item) => item.lunarMonth === Number(selection.lunarMonth));
  }
  if (monthIndex < 0) monthIndex = 0;

  const month = months[monthIndex] || {
    lunarMonth: DEFAULT_LUNAR_SELECTION.lunarMonth,
    isLeapMonth: false,
    days: [DEFAULT_LUNAR_SELECTION.lunarDay]
  };
  let dayIndex = month.days.indexOf(Number(selection.lunarDay));
  if (dayIndex < 0) dayIndex = Math.min(month.days.length - 1, Math.max(0, Number(selection.lunarDay) - 1));
  if (dayIndex < 0) dayIndex = 0;

  const day = month.days[dayIndex] || DEFAULT_LUNAR_SELECTION.lunarDay;

  return {
    year,
    lunarMonth: month.lunarMonth,
    lunarDay: day,
    isLeapMonth: month.isLeapMonth,
    range: [
      years.map((item) => `${item}年`),
      months.map((item) => formatLunarMonth(item.lunarMonth, item.isLeapMonth)),
      month.days.map((item) => formatLunarDay(item))
    ],
    value: [yearIndex, monthIndex, dayIndex],
    text: formatLunarText(year, month.lunarMonth, day, month.isLeapMonth)
  };
}

const DEFAULT_LUNAR_PICKER = buildLunarPickerState(DEFAULT_LUNAR_SELECTION);

Page({
  data: {
    genderOptions: ['男', '女'],
    calendarModes: ['公历', '农历'],
    cityPickerNames: CITY_PICKER_NAMES,
    cityPickerValue: 0,
    selectedCityPickerText: CITY_PICKER_NAMES[0] || '请选择城市',
    activeCalendarMode: '公历',
    lunarCoverageText: LUNAR_COVERAGE_TEXT,
    lunarPickerRange: DEFAULT_LUNAR_PICKER.range,
    lunarPickerValue: DEFAULT_LUNAR_PICKER.value,
    saveCase: true,
    isGenerating: false,
    form: {
      name: '',
      gender: '男',
      birthDate: '2000-01-01',
      birthTime: '08:00',
      region: DEFAULT_REGION,
      regionText: DEFAULT_REGION.join(' '),
      birthPlace: DEFAULT_REGION.join(' '),
      longitude: '116.40',
      latitude: '39.90',
      locationSource: '系统自动匹配',
      locationMatched: true,
      useTrueSolarTime: false,
      isLunar: false,
      isLeapMonth: false,
      calendarType: 'solar',
      lunarYear: DEFAULT_LUNAR_PICKER.year,
      lunarMonth: DEFAULT_LUNAR_PICKER.lunarMonth,
      lunarDay: DEFAULT_LUNAR_PICKER.lunarDay,
      lunarYearMonthDayText: DEFAULT_LUNAR_PICKER.text,
      useEarlyLateZi: false
    },
    disclaimer: app.globalData.disclaimer || DEFAULT_DISCLAIMER
  },

  onLoad() {
    const resolved = findLocationByRegion(this.data.form.region);
    if (resolved) {
      this.setData({
        'form.longitude': resolved.longitude,
        'form.latitude': resolved.latitude,
        'form.locationSource': `${resolved.name} · ${resolved.source}`,
        'form.locationMatched': true
      });
    }
  },

  onNameInput(event) {
    this.setData({ 'form.name': event.detail.value });
  },

  onGenderTap(event) {
    this.setData({ 'form.gender': event.currentTarget.dataset.gender });
  },

  onCalendarModeTap(event) {
    const mode = event.currentTarget.dataset.mode;
    const isLunar = mode === '农历';
    const patch = {
      activeCalendarMode: mode,
      'form.isLunar': isLunar,
      'form.calendarType': isLunar ? 'lunar' : 'solar',
      'form.isLeapMonth': isLunar ? this.data.form.isLeapMonth : false
    };
    if (isLunar) Object.assign(patch, this.buildLunarPickerPatch(this.data.form));
    this.setData(patch);
    if (isLunar) {
      wx.showToast({
        title: '已切换到农历输入',
        icon: 'none',
        duration: 1200
      });
    }
  },

  onDateChange(event) {
    this.setData({ 'form.birthDate': event.detail.value });
  },

  onTimeChange(event) {
    this.setData({ 'form.birthTime': event.detail.value });
  },

  composeBirthPlace(region) {
    return region.filter(Boolean).join(' ');
  },

  composeRegionText(region) {
    return region.filter(Boolean).join(' ');
  },

  onRegionChange(event) {
    const region = event.detail.value;
    const resolved = findLocationByRegion(region);

    this.setData({
      'form.region': region,
      'form.regionText': this.composeRegionText(region),
      'form.birthPlace': this.composeBirthPlace(region),
      'form.locationMatched': Boolean(resolved),
      'form.locationSource': resolved ? `${resolved.name} · ${resolved.source}` : '未匹配到内置城市'
    });

    if (!resolved) {
      wx.showToast({
        title: '当前地区未匹配到内置点位，可手动输入经纬度',
        icon: 'none'
      });
      this.setData({
        'form.longitude': '',
        'form.latitude': '',
        'form.locationMatched': false
      });
      return;
    }

    this.setData({
      'form.longitude': resolved.longitude,
      'form.latitude': resolved.latitude
    });
  },

  onCityPickerChange(event) {
    const cityIndex = Number(event.detail.value);
    const selected = resolveCityPickerSelection(cityIndex);
    if (!selected) {
      wx.showToast({ title: '未找到城市坐标', icon: 'none' });
      return;
    }

    const region = selected.region && selected.region.length ? selected.region : [selected.province, selected.city, selected.district].filter(Boolean);
    this.setData({
      cityPickerValue: cityIndex,
      selectedCityPickerText: selected.label || selected.name,
      'form.region': region,
      'form.regionText': this.composeRegionText(region),
      'form.birthPlace': this.composeBirthPlace(region),
      'form.longitude': selected.longitude,
      'form.latitude': selected.latitude,
      'form.locationSource': `${selected.name} · 快捷城市`,
      'form.locationMatched': true
    });

    wx.showToast({
      title: `已选择${selected.name}`,
      icon: 'none',
      duration: 1200
    });
  },

  onTrueSolarSwitch(event) {
    this.setData({ 'form.useTrueSolarTime': event.detail.value });
  },

  onEarlyLateZiSwitch(event) {
    this.setData({ 'form.useEarlyLateZi': event.detail.value });
  },

  onLunarSwitch(event) {
    const isLunar = Boolean(event.detail.value);
    const patch = {
      'form.isLunar': isLunar,
      'form.calendarType': isLunar ? 'lunar' : 'solar',
      activeCalendarMode: isLunar ? '农历' : '公历',
      'form.isLeapMonth': isLunar ? this.data.form.isLeapMonth : false
    };
    if (isLunar) Object.assign(patch, this.buildLunarPickerPatch(this.data.form));
    this.setData(patch);
  },

  onLeapMonthSwitch(event) {
    this.setData({ 'form.isLeapMonth': event.detail.value });
  },

  buildLunarPickerPatch(selection) {
    const state = buildLunarPickerState(selection);
    return {
      lunarPickerRange: state.range,
      lunarPickerValue: state.value,
      'form.lunarYear': state.year,
      'form.lunarMonth': state.lunarMonth,
      'form.lunarDay': state.lunarDay,
      'form.isLeapMonth': state.isLeapMonth,
      'form.lunarYearMonthDayText': state.text
    };
  },

  onLunarPickerColumnChange(event) {
    const pickerValue = this.data.lunarPickerValue.slice();
    pickerValue[event.detail.column] = event.detail.value;
    const year = LUNAR_INDEX.years[pickerValue[0]] || DEFAULT_LUNAR_SELECTION.lunarYear;
    const months = getLunarMonths(year);
    const month = months[pickerValue[1]] || months[0] || {
      lunarMonth: DEFAULT_LUNAR_SELECTION.lunarMonth,
      isLeapMonth: false,
      days: [DEFAULT_LUNAR_SELECTION.lunarDay]
    };
    const day = month.days[pickerValue[2]] || month.days[0] || DEFAULT_LUNAR_SELECTION.lunarDay;

    this.setData(this.buildLunarPickerPatch({
      lunarYear: year,
      lunarMonth: month.lunarMonth,
      lunarDay: day,
      isLeapMonth: month.isLeapMonth
    }));
  },

  onLunarPickerChange(event) {
    const pickerValue = event.detail.value || this.data.lunarPickerValue;
    const year = LUNAR_INDEX.years[pickerValue[0]] || DEFAULT_LUNAR_SELECTION.lunarYear;
    const months = getLunarMonths(year);
    const month = months[pickerValue[1]] || months[0] || {
      lunarMonth: DEFAULT_LUNAR_SELECTION.lunarMonth,
      isLeapMonth: false,
      days: [DEFAULT_LUNAR_SELECTION.lunarDay]
    };
    const day = month.days[pickerValue[2]] || month.days[0] || DEFAULT_LUNAR_SELECTION.lunarDay;

    this.setData(this.buildLunarPickerPatch({
      lunarYear: year,
      lunarMonth: month.lunarMonth,
      lunarDay: day,
      isLeapMonth: month.isLeapMonth
    }));
  },

  onSaveSwitch(event) {
    this.setData({ saveCase: event.detail.value });
  },

  getPayloadForm() {
    const base = this.data.form;
    const form = { ...base };
    form.calendarType = form.isLunar ? 'lunar' : 'solar';
    if (form.isLunar) {
      const lunarYear = Number(form.lunarYear);
      const lunarMonth = Number(form.lunarMonth);
      const lunarDay = Number(form.lunarDay);

      if (!isPositiveInt(lunarYear) || !isPositiveInt(lunarMonth) || !isPositiveInt(lunarDay)) {
        throw new Error('开启农历时请输入完整的农历年、月、日（必须为正整数）');
      }
      form.lunarYear = lunarYear;
      form.lunarMonth = lunarMonth;
      form.lunarDay = lunarDay;
    } else {
      form.lunarYear = undefined;
      form.lunarMonth = undefined;
      form.lunarDay = undefined;
    }
    return form;
  },

  buildRecordSummary(result) {
    const triggerText = result.flowTriggerSummary && result.flowTriggerSummary.summary
      ? `排盘特征：${result.flowTriggerSummary.summary}`
      : '';
    return [result.professional?.chartSummary?.oneLine, triggerText, result.aiText].filter(Boolean).join(' ');
  },

  generateReading() {
    if (this.data.isGenerating) return;
    if (!this.data.form.name.trim()) {
      wx.showToast({ title: '请先填写姓名', icon: 'none' });
      return;
    }

    if (!this.data.form.locationMatched) {
      wx.showToast({ title: '请先选择可匹配的出生城市', icon: 'none' });
      return;
    }

    const longitude = Number(this.data.form.longitude);
    if (!Number.isFinite(longitude) || longitude < 73 || longitude > 135) {
      wx.showToast({ title: '经度不合法，请确认在73~135范围内', icon: 'none' });
      return;
    }

    this.setData({ isGenerating: true });
    try {
      const form = this.getPayloadForm();
      const result = buildReadingFromForm(form, {
        useTrueSolarTime: Boolean(form.useTrueSolarTime),
        useEarlyLateZi: Boolean(form.useEarlyLateZi),
        termsData: preciseSolarTerms,
        calendarType: form.calendarType
      });
      const baziPlate = createBaziPlate(result);
      const reading = {
        result,
        baziPlate,
        input: buildBaziInputSnapshot(form, result)
      };

      const shareToken = app.saveBaziShareSnapshot(reading);
      reading.shareToken = shareToken;

      app.globalData.currentBaziReading = reading;
      wx.setStorageSync('currentBaziReading', reading);

      if (this.data.saveCase) {
        app.addHistory({
          type: '八字',
          title: result.title,
          summary: this.buildRecordSummary(result),
          payload: reading
        });
      }

      wx.navigateTo({ url: '/pages/bazi-result/bazi-result' });
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : '排盘失败，请稍后重试',
        icon: 'none',
        duration: 2200
      });
      console.error('Bazi generateReading failed:', error);
    } finally {
      this.setData({ isGenerating: false });
    }
  }
});
