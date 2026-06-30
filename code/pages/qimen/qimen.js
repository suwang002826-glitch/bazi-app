const { buildQimenChart } = require('../../utils/mock');

const app = getApp();

Page({
  data: {
    categoryOptions: ['事业', '财务', '感情', '健康', '出行', '其他'],
    categoryIndex: 0,
    form: {
      question: '',
      date: '2026-06-29',
      time: '09:30',
      category: '事业'
    },
    disclaimer: app.globalData.disclaimer
  },

  onShow() {
    const restore = app.globalData.restoreQimenReading;
    if (!restore) return;
    app.globalData.restoreQimenReading = null;
    if (restore.result) {
      app.globalData.currentQimenReading = restore;
      wx.setStorageSync('currentQimenReading', restore);
      wx.navigateTo({ url: '/pages/qimen-result/qimen-result' });
      return;
    }
    this.setData({
      form: restore.form || this.data.form,
      categoryIndex: Number.isInteger(restore.categoryIndex) ? restore.categoryIndex : 0
    });
  },

  onQuestionInput(event) {
    this.setData({ 'form.question': event.detail.value });
  },

  onDateChange(event) {
    this.setData({ 'form.date': event.detail.value });
  },

  onTimeChange(event) {
    this.setData({ 'form.time': event.detail.value });
  },

  onCategoryChange(event) {
    const categoryIndex = Number(event.detail.value);
    this.setData({
      categoryIndex,
      'form.category': this.data.categoryOptions[categoryIndex]
    });
  },

  useCurrentTime() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    this.setData({
      'form.date': `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      'form.time': `${pad(now.getHours())}:${pad(now.getMinutes())}`
    });
  },

  generateChart() {
    if (!this.data.form.question.trim()) {
      wx.showToast({ title: '请先填写所问事项', icon: 'none' });
      return;
    }
    const result = buildQimenChart(this.data.form);
    const selectedPalace = result.cells.find((item) => item.number === result.focus.palace) || result.cells[0];
    const reading = {
      form: this.data.form,
      categoryIndex: this.data.categoryIndex,
      result,
      selectedPalace
    };
    app.globalData.currentQimenReading = reading;
    wx.setStorageSync('currentQimenReading', reading);
    app.addHistory({
      type: '奇门',
      title: `奇门：${result.question}`,
      summary: `${result.calendar.ju} ${result.advice.original} ${result.aiText}`,
      payload: reading
    });
    wx.navigateTo({ url: '/pages/qimen-result/qimen-result' });
  }
});
