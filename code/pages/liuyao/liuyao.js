const { buildHexagram, buildTimeLines, lineToPreview, randomYao } = require('../../utils/mock');

const app = getApp();

Page({
  data: {
    modeOptions: ['手动起卦', '时间起卦', '数字起卦'],
    modeIndex: 0,
    categoryOptions: ['事业', '感情', '财务', '健康', '出行', '其他'],
    categoryIndex: 0,
    question: '',
    ritualItems: [
      '静心一念，先定所问事项',
      '一事一问，不把多个问题混在一卦',
      '短时间不反复占同一事'
    ],
    lines: [],
    linePreviews: [],
    numberSeed: '',
    currentTimeLabel: '',
    disclaimer: app.globalData.disclaimer
  },

  onLoad() {
    this.refreshCurrentTimeLabel();
  },

  onShow() {
    this.refreshCurrentTimeLabel();
    const restore = app.globalData.restoreLiuyaoReading;
    if (!restore) return;
    app.globalData.restoreLiuyaoReading = null;
    if (restore.result) {
      app.globalData.currentLiuyaoReading = restore;
      wx.setStorageSync('currentLiuyaoReading', restore);
      wx.navigateTo({ url: '/pages/liuyao-result/liuyao-result' });
      return;
    }
    this.setData({
      question: restore.question || '',
      categoryIndex: Number.isInteger(restore.categoryIndex) ? restore.categoryIndex : 0,
      modeIndex: Number.isInteger(restore.modeIndex) ? restore.modeIndex : 0,
      numberSeed: restore.numberSeed || '',
      lines: restore.lines || [],
      linePreviews: restore.linePreviews || this.buildLinePreviews(restore.lines || [])
    });
  },

  onQuestionInput(event) {
    this.setData({ question: event.detail.value });
  },

  onModeChange(event) {
    this.setData({
      modeIndex: Number(event.currentTarget.dataset.index),
      lines: [],
      linePreviews: []
    });
    this.refreshCurrentTimeLabel();
  },

  onCategoryChange(event) {
    this.setData({ categoryIndex: Number(event.detail.value) });
  },

  onNumberSeedInput(event) {
    this.setData({ numberSeed: event.detail.value });
  },

  addManualLine() {
    if (!this.data.question.trim()) {
      wx.showToast({ title: '请先填写所问事项', icon: 'none' });
      return;
    }

    if (this.data.lines.length >= 6) {
      this.openResult(this.data.lines);
      return;
    }

    const value = randomYao();
    const lines = [...this.data.lines, value];
    this.setData({
      lines,
      linePreviews: this.buildLinePreviews(lines)
    });
    if (lines.length === 6) {
      this.openResult(lines);
    }
  },

  castByCurrentTime() {
    if (!this.data.question.trim()) {
      wx.showToast({ title: '请先填写所问事项', icon: 'none' });
      return;
    }

    const now = new Date();
    const lines = buildTimeLines(now, this.data.question);
    this.refreshCurrentTimeLabel(now);
    this.setData({ lines, linePreviews: this.buildLinePreviews(lines) });
    this.openResult(lines);
  },

  castByNumber() {
    if (!this.data.question.trim()) {
      wx.showToast({ title: '请先填写所问事项', icon: 'none' });
      return;
    }

    const digits = String(this.data.numberSeed || '').replace(/\D/g, '');
    if (!digits) {
      wx.showToast({ title: '请输入起卦数字', icon: 'none' });
      return;
    }

    const head = Number(digits.slice(0, 2) || 1);
    const tail = Number(digits.slice(-4) || 0);
    const seedDate = new Date(
      2000 + (tail % 60),
      tail % 12,
      (head % 28) + 1,
      tail % 24,
      tail % 60
    );
    const seedText = `${this.data.question}-${this.data.categoryOptions[this.data.categoryIndex]}-${digits}`;
    const lines = buildTimeLines(seedDate, seedText);
    this.setData({ lines, linePreviews: this.buildLinePreviews(lines) });
    this.openResult(lines);
  },

  resetCast() {
    this.setData({ lines: [], linePreviews: [] });
  },

  refreshCurrentTimeLabel(date = new Date()) {
    const pad = (value) => String(value).padStart(2, '0');
    const label = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    this.setData({ currentTimeLabel: label });
  },

  buildLinePreviews(lines) {
    return lines.map((value, index) => ({
      ...lineToPreview(value),
      position: ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][index]
    })).reverse();
  },

  createReading(lines) {
    const category = this.data.categoryOptions[this.data.categoryIndex];
    const method = this.data.modeOptions[this.data.modeIndex];
    const result = buildHexagram(this.data.question, lines, category, method, new Date());
    return {
      question: this.data.question,
      categoryIndex: this.data.categoryIndex,
      modeIndex: this.data.modeIndex,
      numberSeed: this.data.numberSeed,
      lines,
      linePreviews: this.buildLinePreviews(lines),
      result
    };
  },

  openResult(lines) {
    const reading = this.createReading(lines);
    const result = reading.result;
    const priorityText = result.analysis.movingPriority.length
      ? `动爻优先：${result.analysis.movingPriority.map((item) => `${item.rank}.${item.position}${item.level}`).join('、')}`
      : '无动爻，先按静卦观察世应用神。';
    app.globalData.currentLiuyaoReading = reading;
    wx.setStorageSync('currentLiuyaoReading', reading);
    app.addHistory({
      type: '六爻',
      title: `六爻：${result.hexagramName}`,
      summary: `${result.aiText} ${result.analysis.useGodStrength.text} ${priorityText}`,
      payload: reading
    });
    wx.navigateTo({ url: '/pages/liuyao-result/liuyao-result' });
  }
});
