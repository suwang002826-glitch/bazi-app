const { buildBaziProfile } = require('../../utils/mock');
const { createBaziPlate } = require('../../utils/baziPlate');

const app = getApp();

Page({
  data: {
    genderOptions: ['男', '女'],
    calendarModes: ['公历', '农历', '四柱'],
    activeCalendarMode: '公历',
    saveCase: true,
    isGenerating: false,
    lunarBetaError: '',
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
    if (mode === '农历') {
      wx.showToast({ title: '农历排盘测试版已开启', icon: 'none' });
      return;
    }
    if (mode === '四柱') {
      wx.showToast({ title: '四柱直排待开放，先按公历排盘', icon: 'none' });
    }
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

  onLeapMonthSwitch(event) {
    this.setData({ 'form.isLeapMonth': event.detail.value, lunarBetaError: '' });
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
    if (!this.data.form.name.trim()) {
      wx.showToast({ title: '请先填写姓名', icon: 'none' });
      return;
    }
    const longitude = Number(this.data.form.longitude);
    if (!Number.isFinite(longitude) || longitude < 73 || longitude > 135) {
      wx.showToast({ title: '经度请填 73-135 之间', icon: 'none' });
      return;
    }

    this.setData({ isGenerating: true });
    const readingInput = this.buildReadingInput();
    let result;
    try {
      result = buildBaziProfile(readingInput);
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
    if (this.data.saveCase) {
      app.addHistory({
        type: '八字',
        title: result.title,
        summary: [result.professional.chartSummary.oneLine, triggerText, result.aiText].filter(Boolean).join(' '),
        payload: reading
      });
    }
    wx.navigateTo({
      url: '/pages/bazi-result/bazi-result',
      complete: () => this.setData({ isGenerating: false })
    });
  }
});
