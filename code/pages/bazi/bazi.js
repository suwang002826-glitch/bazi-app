const { buildReadingFromForm } = require('../../utils/bazi/pageAdapter');
const preciseSolarTerms = require('../../data-packs/solar-terms/solarTerms-precise-2025.json');
const { createBaziPlate } = require('../../utils/baziPlate');
const cityLocations = require('../../data-packs/city-locations.json');

const app = getApp();

const DEFAULT_DISCLAIMER = '排盘结果仅供参考，不作为投资、医疗、法律等高风险决策依据。';
const DEFAULT_REGION = ['北京市', '北京市', '东城区'];

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

Page({
  data: {
    genderOptions: ['男', '女'],
    calendarModes: ['公历', '农历'],
    activeCalendarMode: '公历',
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
      lunarYear: '',
      lunarMonth: '',
      lunarDay: '',
      lunarYearMonthDayText: '',
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
    this.setData({
      activeCalendarMode: mode,
      'form.isLunar': isLunar,
      'form.calendarType': isLunar ? 'lunar' : 'solar',
      'form.isLeapMonth': isLunar ? this.data.form.isLeapMonth : false
    });
    if (isLunar) {
      wx.showToast({
        title: '已切换到农历输入，请补充农历年月日',
        icon: 'none',
        duration: 1600
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

  onTrueSolarSwitch(event) {
    this.setData({ 'form.useTrueSolarTime': event.detail.value });
  },

  onEarlyLateZiSwitch(event) {
    this.setData({ 'form.useEarlyLateZi': event.detail.value });
  },

  onLunarSwitch(event) {
    const isLunar = Boolean(event.detail.value);
    this.setData({
      'form.isLunar': isLunar,
      'form.calendarType': isLunar ? 'lunar' : 'solar',
      activeCalendarMode: isLunar ? '农历' : '公历',
      'form.isLeapMonth': isLunar ? this.data.form.isLeapMonth : false
    });
  },

  onLeapMonthSwitch(event) {
    this.setData({ 'form.isLeapMonth': event.detail.value });
  },

  onLunarYearInput(event) {
    this.setData({ 'form.lunarYear': event.detail.value });
  },

  onLunarMonthInput(event) {
    this.setData({ 'form.lunarMonth': event.detail.value });
  },

  onLunarDayInput(event) {
    this.setData({ 'form.lunarDay': event.detail.value });
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
        baziPlate
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
