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
    disclaimer: app.globalData.disclaimer
  },

  onShow() {
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
      lines: restore.lines || [],
      linePreviews: restore.linePreviews || this.buildLinePreviews(restore.lines || [])
    });
  },

  onQuestionInput(event) {
    this.setData({ question: event.detail.value });
  },

  onModeChange(event) {
    this.setData({ modeIndex: Number(event.currentTarget.dataset.index) });
  },

  onCategoryChange(event) {
    this.setData({ categoryIndex: Number(event.detail.value) });
  },

  addManualLine(event) {
    if (!this.data.question.trim()) {
      wx.showToast({ title: '请先填写所问事项', icon: 'none' });
      return;
    }

    if (this.data.lines.length >= 6) {
      wx.showToast({ title: '六爻已成卦', icon: 'none' });
      return;
    }

    const value = Number(event.currentTarget.dataset.value);
    const lines = [...this.data.lines, value];
    this.setData({
      lines,
      linePreviews: this.buildLinePreviews(lines)
    });
    if (lines.length === 6) {
      this.openResult(lines);
    }
  },

  autoCast() {
    if (!this.data.question.trim()) {
      wx.showToast({ title: '请先填写所问事项', icon: 'none' });
      return;
    }

    let lines = Array.from({ length: 6 }, () => randomYao());
    if (this.data.modeIndex === 1) {
      lines = buildTimeLines(new Date(), this.data.question);
    }
    if (this.data.modeIndex === 2) {
      const seedDate = new Date(2000, this.data.question.length % 12, (this.data.question.length % 27) + 1, this.data.categoryIndex * 2, 0);
      lines = buildTimeLines(seedDate, `${this.data.question}-${this.data.categoryIndex}`);
    }
    this.setData({ lines, linePreviews: this.buildLinePreviews(lines) });
    this.openResult(lines);
  },

  resetCast() {
    this.setData({ lines: [], linePreviews: [] });
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
