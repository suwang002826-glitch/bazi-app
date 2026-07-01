const { buildBaziProfile } = require('../../utils/mock');
const { createBaziPlate } = require('../../utils/baziPlate');

const app = getApp();

const LUNAR_YEAR_OPTIONS = Array.from({ length: 201 }, (_, index) => String(1900 + index));
const LUNAR_MONTH_OPTIONS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_DAY_OPTIONS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

function getLunarPickerValue(year, month, day) {
  const yearIndex = Math.max(0, LUNAR_YEAR_OPTIONS.indexOf(String(year || '2023')));
  const monthIndex = Math.min(Math.max(Number(month || 1) - 1, 0), LUNAR_MONTH_OPTIONS.length - 1);
  const dayIndex = Math.min(Math.max(Number(day || 1) - 1, 0), LUNAR_DAY_OPTIONS.length - 1);
  return [yearIndex, monthIndex, dayIndex];
}

function getLunarDateText(form) {
  const monthLabel = LUNAR_MONTH_OPTIONS[Math.min(Math.max(Number(form.lunarMonth || 1) - 1, 0), 11)] || '正月';
  const dayLabel = LUNAR_DAY_OPTIONS[Math.min(Math.max(Number(form.lunarDay || 1) - 1, 0), 29)] || '初一';
  return `${form.lunarYear}年 ${form.isLeapMonth ? '闰' : ''}${monthLabel} ${dayLabel}`;
}

Page({
  data: {
    genderOptions: ['男', '女'],
    calendarModes: ['公历', '农历'],
    groupOptions: ['练习', '亲友', '客户', '复盘'],
    groupIndex: 0,
    activeCalendarMode: '公历',
    saveCase: true,
    isGenerating: false,
    lunarBetaError: '',
    lunarPickerRange: [LUNAR_YEAR_OPTIONS, LUNAR_MONTH_OPTIONS, LUNAR_DAY_OPTIONS],
    lunarPickerValue: getLunarPickerValue('2023', '8', '15'),
    lunarDateText: '2023年 八月 十五',
    form: {
      name: '',
      gender: '男',
      calendarType: 'solar',
      birthDate: '2000-01-01',
      birthTime: '08:00',
      lunarYear: '2023',
      lunarMonth: '8',
      lunarDay: '15',
      isLeapMonth: false,
      region: ['北京市', '北京市', '东城区'],
      regionText: '北京市 北京市 东城区',
      birthPlace: '北京市 北京市 东城区',
      group: '练习',
      longitude: '116.40',
      useTrueSolarTime: false
    },
    disclaimer: app.globalData.disclaimer
  },

  onNameInput(event) {
    this.setData({ 'form.name': event.detail.value });
  },

  onGenderChange(event) {
    this.setData({ 'form.gender': this.data.genderOptions[Number(event.detail.value)] });
  },

  onGenderTap(event) {
    this.setData({ 'form.gender': event.currentTarget.dataset.gender });
  },

  onCalendarModeTap(event) {
    const mode = event.currentTarget.dataset.mode;
    const patch = {
      activeCalendarMode: mode,
      lunarBetaError: '',
      'form.calendarType': mode === '农历' ? 'lunar' : 'solar'
    };
    this.setData(patch);
  },

  onDateChange(event) {
    this.setData({ 'form.birthDate': event.detail.value });
  },

  onTimeChange(event) {
    this.setData({ 'form.birthTime': event.detail.value });
  },

  onLunarYearInput(event) {
    this.setData({ 'form.lunarYear': event.detail.value, lunarBetaError: '' });
  },

  onLunarMonthInput(event) {
    this.setData({ 'form.lunarMonth': event.detail.value, lunarBetaError: '' });
  },

  onLunarDayInput(event) {
    this.setData({ 'form.lunarDay': event.detail.value, lunarBetaError: '' });
  },

  onLunarDateChange(event) {
    const value = event.detail.value || [0, 0, 0];
    const lunarYear = LUNAR_YEAR_OPTIONS[value[0]] || '2023';
    const lunarMonth = String((Number(value[1]) || 0) + 1);
    const lunarDay = String((Number(value[2]) || 0) + 1);
    const nextForm = {
      ...this.data.form,
      lunarYear,
      lunarMonth,
      lunarDay
    };
    this.setData({
      'form.lunarYear': lunarYear,
      'form.lunarMonth': lunarMonth,
      'form.lunarDay': lunarDay,
      lunarPickerValue: value,
      lunarDateText: getLunarDateText(nextForm),
      lunarBetaError: ''
    });
  },

  onLeapMonthSwitch(event) {
    const nextForm = {
      ...this.data.form,
      isLeapMonth: event.detail.value
    };
    this.setData({
      'form.isLeapMonth': event.detail.value,
      lunarDateText: getLunarDateText(nextForm),
      lunarBetaError: ''
    });
  },

  composeBirthPlace(region) {
    return region.filter(Boolean).join(' ');
  },

  composeRegionText(region) {
    return region.filter(Boolean).join(' ');
  },

  onRegionChange(event) {
    const region = event.detail.value;
    this.setData({
      'form.region': region,
      'form.regionText': this.composeRegionText(region),
      'form.birthPlace': this.composeBirthPlace(region)
    });
  },

  onGroupChange(event) {
    const groupIndex = Number(event.detail.value);
    const group = this.data.groupOptions[groupIndex] || this.data.groupOptions[0];
    this.setData({
      groupIndex,
      'form.group': group
    });
  },

  onLongitudeInput(event) {
    this.setData({ 'form.longitude': event.detail.value });
  },

  onTrueSolarSwitch(event) {
    this.setData({ 'form.useTrueSolarTime': event.detail.value });
  },

  onSaveSwitch(event) {
    this.setData({ saveCase: event.detail.value });
  },

  buildReadingInput() {
    const form = { ...this.data.form };
    if (this.data.activeCalendarMode !== '农历') {
      return {
        ...form,
        calendarType: 'solar'
      };
    }
    return {
      ...form,
      calendarType: 'lunar',
      lunarYear: Number(form.lunarYear),
      lunarMonth: Number(form.lunarMonth),
      lunarDay: Number(form.lunarDay),
      isLeapMonth: Boolean(form.isLeapMonth)
    };
  },

  getLunarBetaError(error) {
    if (error && error.code === 'LUNAR_DATE_OUTSIDE_DATA_PACK_COVERAGE') {
      return '当前农历日期暂未覆盖，请先使用公历生日排盘';
    }
    if (error && /Invalid lunar field/.test(error.message || '')) {
      return '请填写有效农历年月日';
    }
    return '';
  },

  generateReading() {
    if (this.data.isGenerating) return;
    const longitude = Number(this.data.form.longitude);
    if (!Number.isFinite(longitude) || longitude < 73 || longitude > 135) {
      wx.showToast({ title: '经度请填 73-135 之间', icon: 'none' });
      return;
    }

    this.setData({ isGenerating: true });
    const readingInput = {
      ...this.buildReadingInput(),
      name: this.data.form.name.trim() || '未命名'
    };
    let result;
    try {
      result = buildBaziProfile(readingInput);
      result.gender = readingInput.gender || '未填';
    } catch (error) {
      const lunarBetaError = this.getLunarBetaError(error);
      this.setData({
        isGenerating: false,
        lunarBetaError
      });
      if (lunarBetaError) {
        wx.showToast({ title: lunarBetaError, icon: 'none' });
        return;
      }
      throw error;
    }
    const baziPlate = createBaziPlate(result);
    const reading = { result, baziPlate };
    app.globalData.currentBaziReading = reading;
    wx.setStorageSync('currentBaziReading', reading);

    const triggerText = result.flowTriggerSummary && result.flowTriggerSummary.summary
      ? `流运触发：${result.flowTriggerSummary.summary}`
      : '';
    const record = {
      type: '八字',
      title: result.title,
      group: readingInput.group || '练习',
      category: readingInput.group || '练习',
      summary: [result.professional.chartSummary.oneLine, triggerText, result.aiText].filter(Boolean).join(' '),
      payload: reading
    };
    app.addHistory(record);
    if (this.data.saveCase) {
      app.addCase({
        sourceId: Date.now(),
        ...record,
        createdAt: app.formatDateTime(new Date()),
        tag: '命盘',
        status: '待验证',
        verifiedAt: '',
        accurate: '',
        inaccurate: '',
        userFeedback: '',
        note: '自动归档命例，可用于后续复盘与校验。'
      });
    }
    wx.navigateTo({
      url: '/pages/bazi-result/bazi-result',
      complete: () => this.setData({ isGenerating: false })
    });
  }
});
