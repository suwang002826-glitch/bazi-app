const { buildHexagram, buildTimeLines, lineToPreview } = require('../../utils/mock');

const app = getApp();

const manualLineOrder = [
  { label: '上爻', lineIndex: 5 },
  { label: '五爻', lineIndex: 4 },
  { label: '四爻', lineIndex: 3 },
  { label: '三爻', lineIndex: 2 },
  { label: '二爻', lineIndex: 1 },
  { label: '初爻', lineIndex: 0 }
];

const manualYaoOptions = [
  { name: '少阴', value: 8, symbol: '— —', coin: '2背1字' },
  { name: '少阳', value: 7, symbol: '———', coin: '1背2字' },
  { name: '老阴', value: 6, symbol: '— — ×', coin: '0背3字' },
  { name: '老阳', value: 9, symbol: '——— ○', coin: '3背0字' }
];

const emptyManualLines = () => Array.from({ length: 6 }, () => null);

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
    manualLines: emptyManualLines(),
    manualRows: [],
    manualYaoOptions,
    manualOpenIndex: -1,
    manualSelectedCount: 0,
    numberSeed: '',
    currentTimeLabel: '',
    disclaimer: app.globalData.disclaimer
  },

  onLoad() {
    this.resetManualRows();
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
    const manualLines = this.normalizeManualLines(restore.lines || []);
    this.setData({
      question: restore.question || '',
      categoryIndex: Number.isInteger(restore.categoryIndex) ? restore.categoryIndex : 0,
      modeIndex: Number.isInteger(restore.modeIndex) ? restore.modeIndex : 0,
      numberSeed: restore.numberSeed || '',
      lines: restore.lines || [],
      linePreviews: restore.linePreviews || this.buildLinePreviews(restore.lines || []),
      manualLines,
      manualRows: this.buildManualRows(manualLines),
      manualOpenIndex: -1,
      manualSelectedCount: this.countManualLines(manualLines)
    });
  },

  onQuestionInput(event) {
    this.setData({ question: event.detail.value });
  },

  onModeChange(event) {
    this.setData({
      modeIndex: Number(event.currentTarget.dataset.index),
      lines: [],
      linePreviews: [],
      manualLines: emptyManualLines(),
      manualRows: this.buildManualRows(emptyManualLines()),
      manualOpenIndex: -1,
      manualSelectedCount: 0
    });
    this.refreshCurrentTimeLabel();
  },

  onCategoryChange(event) {
    this.setData({ categoryIndex: Number(event.detail.value) });
  },

  onNumberSeedInput(event) {
    this.setData({ numberSeed: event.detail.value });
  },

  toggleManualDropdown(event) {
    const rowIndex = Number(event.currentTarget.dataset.index);
    this.setData({
      manualOpenIndex: this.data.manualOpenIndex === rowIndex ? -1 : rowIndex
    });
  },

  clearManualYao(event) {
    const rowIndex = Number(event.currentTarget.dataset.index);
    const row = manualLineOrder[rowIndex];
    if (!row) return;

    const manualLines = this.data.manualLines.slice();
    manualLines[row.lineIndex] = null;
    const complete = this.isManualComplete(manualLines);
    this.setData({
      manualLines,
      manualRows: this.buildManualRows(manualLines),
      manualOpenIndex: -1,
      manualSelectedCount: this.countManualLines(manualLines),
      lines: complete ? manualLines.slice() : [],
      linePreviews: complete ? this.buildLinePreviews(manualLines) : []
    });
  },

  selectManualYao(event) {
    const rowIndex = Number(event.currentTarget.dataset.rowIndex);
    const value = Number(event.currentTarget.dataset.value);
    const row = manualLineOrder[rowIndex];
    const option = manualYaoOptions.find((item) => item.value === value);
    if (!row || !option) return;

    const manualLines = this.data.manualLines.slice();
    manualLines[row.lineIndex] = option.value;
    const complete = this.isManualComplete(manualLines);
    this.setData({
      manualLines,
      manualRows: this.buildManualRows(manualLines),
      manualOpenIndex: -1,
      manualSelectedCount: this.countManualLines(manualLines),
      lines: complete ? manualLines.slice() : [],
      linePreviews: complete ? this.buildLinePreviews(manualLines) : []
    });
  },

  castManual() {
    if (!this.data.question.trim()) {
      wx.showToast({ title: '请先填写所问事项', icon: 'none' });
      return;
    }

    const manualLines = this.data.manualLines.slice();
    if (!this.isManualComplete(manualLines)) {
      wx.showToast({ title: '请先选满六爻', icon: 'none' });
      return;
    }

    this.setData({
      lines: manualLines,
      linePreviews: this.buildLinePreviews(manualLines)
    });
    this.openResult(manualLines);
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
    const manualLines = emptyManualLines();
    this.setData({
      lines: [],
      linePreviews: [],
      manualLines,
      manualRows: this.buildManualRows(manualLines),
      manualOpenIndex: -1,
      manualSelectedCount: 0
    });
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

  buildManualRows(manualLines) {
    return manualLineOrder.map((row) => {
      const value = manualLines[row.lineIndex];
      const optionIndex = manualYaoOptions.findIndex((item) => item.value === value);
      return {
        label: row.label,
        value,
        selected: optionIndex >= 0,
        display: optionIndex >= 0 ? manualYaoOptions[optionIndex].name : '请选择',
        symbol: optionIndex >= 0 ? manualYaoOptions[optionIndex].symbol : '',
        coin: optionIndex >= 0 ? manualYaoOptions[optionIndex].coin : ''
      };
    });
  },

  resetManualRows() {
    const manualLines = emptyManualLines();
    this.setData({
      manualLines,
      manualRows: this.buildManualRows(manualLines),
      manualOpenIndex: -1,
      manualSelectedCount: 0
    });
  },

  normalizeManualLines(lines) {
    const manualLines = emptyManualLines();
    lines.slice(0, 6).forEach((line, index) => {
      const value = Number(line);
      manualLines[index] = manualYaoOptions.some((item) => item.value === value) ? value : null;
    });
    return manualLines;
  },

  countManualLines(manualLines) {
    return manualLines.filter((line) => manualYaoOptions.some((item) => item.value === Number(line))).length;
  },

  isManualComplete(manualLines) {
    return this.countManualLines(manualLines) === 6;
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
