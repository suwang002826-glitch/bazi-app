const { buildBaziProfile } = require('../../utils/mock');
const { createBaziPlate } = require('../../utils/baziPlate');

const app = getApp();

Page({
  data: {
    genderOptions: ['男', '女'],
    calendarModes: ['公历', '农历', '四柱'],
    activeCalendarMode: '公历',
    saveCase: true,
    form: {
      name: '',
      gender: '男',
      birthDate: '2000-01-01',
      birthTime: '08:00',
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
    this.setData({ activeCalendarMode: mode });
    if (mode !== '公历') {
      wx.showToast({ title: '测试版先按公历排盘', icon: 'none' });
    }
  },

  onDateChange(event) {
    this.setData({ 'form.birthDate': event.detail.value });
  },

  onTimeChange(event) {
    this.setData({ 'form.birthTime': event.detail.value });
  },

  onBirthPlaceInput(event) {
    this.setData({ 'form.birthPlace': event.detail.value });
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

  generateReading() {
    if (!this.data.form.name.trim()) {
      wx.showToast({ title: '请先填写姓名', icon: 'none' });
      return;
    }
    const longitude = Number(this.data.form.longitude);
    if (!Number.isFinite(longitude) || longitude < 73 || longitude > 135) {
      wx.showToast({ title: '经度请填 73-135 之间', icon: 'none' });
      return;
    }

    const result = buildBaziProfile(this.data.form);
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
    wx.navigateTo({ url: '/pages/bazi-result/bazi-result' });
  }
});
