const { buildQimenChart } = require('../../utils/mock');

const app = getApp();

const pad = (value) => String(value).padStart(2, '0');

const formatDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const qimenOptionConfig = [
  {
    label: '排盘方式',
    key: 'panMethod',
    options: ['转盘', '飞盘']
  },
  {
    label: '寄宫方式',
    key: 'palaceMethod',
    options: ['坤宫', '阳艮阴坤']
  },
  {
    label: '起局方式',
    key: 'startMethod',
    options: ['拆补', '茅山', '置闰', '自选局数']
  },
  {
    label: '暗干起法',
    key: 'hiddenStemMethod',
    options: ['值使门起', '门地盘起']
  },
  {
    label: '时间类型',
    key: 'timeType',
    options: ['北京时间', '真太阳时']
  }
];

function createDefaultForm() {
  const now = new Date();
  return {
    question: '',
    date: formatDate(now),
    time: formatTime(now),
    category: '事业',
    panMethod: '转盘',
    palaceMethod: '坤宫',
    startMethod: '拆补',
    hiddenStemMethod: '值使门起',
    timeType: '北京时间'
  };
}

Page({
  data: {
    categoryOptions: ['事业', '财务', '感情', '健康', '出行', '其他'],
    categoryIndex: 0,
    form: createDefaultForm(),
    qimenRows: [],
    disclaimer: app.globalData.disclaimer
  },

  onLoad() {
    this.refreshQimenRows();
  },

  onShow() {
    const restore = app.globalData.restoreQimenReading;
    if (!restore) {
      this.refreshQimenRows();
      return;
    }
    app.globalData.restoreQimenReading = null;
    if (restore.result) {
      app.globalData.currentQimenReading = restore;
      wx.setStorageSync('currentQimenReading', restore);
      wx.navigateTo({ url: '/pages/qimen-result/qimen-result' });
      return;
    }
    const form = {
      ...createDefaultForm(),
      ...(restore.form || {})
    };
    this.setData({
      form,
      categoryIndex: Number.isInteger(restore.categoryIndex) ? restore.categoryIndex : 0,
      qimenRows: this.buildQimenRows(form)
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
    this.setData({
      'form.date': formatDate(now),
      'form.time': formatTime(now)
    });
  },

  onQimenOptionTap(event) {
    const key = event.currentTarget.dataset.key;
    const value = event.currentTarget.dataset.value;
    if (!key || !value) return;
    const form = {
      ...this.data.form,
      [key]: value
    };
    this.setData({
      form,
      qimenRows: this.buildQimenRows(form)
    });
  },

  refreshQimenRows() {
    this.setData({
      qimenRows: this.buildQimenRows(this.data.form)
    });
  },

  buildQimenRows(form) {
    return qimenOptionConfig.map((row) => ({
      ...row,
      options: row.options.map((option) => ({
        value: option,
        active: form[row.key] === option
      }))
    }));
  },

  generateChart() {
    const form = {
      ...this.data.form,
      question: this.data.form.question.trim() || '未命名事项'
    };
    const result = buildQimenChart(form);
    const selectedPalace = result.cells.find((item) => item.number === result.focus.palace) || result.cells[0];
    const reading = {
      form,
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
