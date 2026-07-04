const app = getApp();
const { createBaziPlate, createProfessionalDetail } = require('../../utils/baziPlate');
const { getBasicInterpretation } = require('../../utils/bazi/basicInterpretation');

const RESULT_TABS = ['本命', '解盘', '大运流年', '关注点'];
const HIDDEN_STEM_LEVELS = ['本气', '中气', '余气'];

function parseCellText(cell) {
  if (!cell) return '';
  if (typeof cell === 'string') return cell;
  if (Array.isArray(cell)) {
    return cell
      .map((item) => (typeof item === 'string' ? item : `${item.stem || ''}${item.tenGod || ''}`))
      .filter(Boolean)
      .join(' / ');
  }
  if (typeof cell.text === 'string' && cell.text) return cell.text;
  if (Array.isArray(cell.lines) && cell.lines.length) return cell.lines.join(' / ');
  if (Array.isArray(cell.richLines) && cell.richLines.length) {
    return cell.richLines
      .map((line) => `${line.stem || ''}${line.tenGod || ''}`)
      .filter(Boolean)
      .join(' / ');
  }
  return '';
}

function ensureDetailProfile(result) {
  const zodiacText = (result && result.pillarsP0 && result.pillarsP0.year && result.pillarsP0.year.zodiac) || '';
  return {
    zodiac: zodiacText,
    voidText: '无',
    voidBranches: [],
    dayVoidText: '无',
    dayVoidBranches: [],
    pillarExtras: [],
    pillarSpirits: [],
    petal: zodiacText,
    fetalOrigin: {
      value: '待补齐',
      nayin: '待补齐',
      basis: '待补齐'
    },
    palaceProfile: {
      life: { value: '待补齐' },
      body: { value: '待补齐' }
    }
  };
}

function getCalendarInfo(result) {
  const conversion = result.calendarConversion || {};
  const inputText = conversion.inputCalendarText || result.solarTime || '';
  const outputText = conversion.outputCalendarText || '';
  const modeText = conversion.modeText || '公历输入';
  const locationText = [
    outputText && outputText !== inputText ? `${outputText}` : '',
    conversion.sourceNote ? conversion.sourceNote : ''
  ].filter(Boolean).join(' / ');
  return {
    mode: modeText,
    inputText,
    outputText: locationText || outputText || inputText || ''
  };
}

function normalizeResult(result) {
  if (!result) return result;

  const title = result.title || '';
  const safeName = result.displayName || result.name || '算命者';
  const destinyLabel = result.destinyLabel || (result.gender === '女' ? '坤造' : '乾造');
  const calendarInfo = getCalendarInfo(result);
  const safeGender = result.gender === '女' ? '女' : '男';
  return {
    ...result,
    displayName: safeName,
    destinyLabel,
    personProfile: {
      name: safeName,
      gender: safeGender,
      destinyLabel,
      title
    },
    detailProfile: {
      ...ensureDetailProfile(result),
      ...(result.detailProfile || {})
    },
    calendarInfo
  };
}

function buildSongPlate(result, baziPlate) {
  if (!result || !baziPlate) return null;

  const rows = baziPlate.rows || [];
  const columns = baziPlate.columns || [];
  const rowMap = {
    star: rows.find((row) => row.label === '十神') || { cells: [] },
    stem: rows.find((row) => row.label === '天干') || { cells: [] },
    branch: rows.find((row) => row.label === '地支') || { cells: [] },
    hidden: rows.find((row) => row.label === '藏干') || { cells: [] },
    subStar: rows.find((row) => row.label === '十星') || { cells: [] },
    stage: rows.find((row) => row.label === '十二长生') || { cells: [] },
    self: rows.find((row) => row.label === '贵神') || { cells: [] },
    void: rows.find((row) => row.label === '空亡') || { cells: [] },
    nayin: rows.find((row) => row.label === '纳音') || { cells: [] },
    spirits: rows.find((row) => row.label === '神煞') || { cells: [] }
  };

  const pillars = columns.map((column, index) => {
    const pillar = result.pillarsP0 ? result.pillarsP0[column.key] : null;
    const hidden = (pillar && pillar.hiddenStems) || [];
    const levelStems = hidden
      .slice(0, 3)
      .map((item, i) => ({
        level: HIDDEN_STEM_LEVELS[i] || `第${i + 1}位`,
        stem: item.stem || '',
        element: item.element || '',
        tenGod: item.tenGod || ''
      }));

    return {
      label: column.label,
      star: parseCellText(rowMap.star.cells[index]),
      stem: parseCellText(rowMap.stem.cells[index]),
      branch: parseCellText(rowMap.branch.cells[index]),
      hidden: parseCellText(rowMap.hidden.cells[index]) || '暂无藏干',
      subStar: parseCellText(rowMap.subStar.cells[index]) || '—',
      stage: parseCellText(rowMap.stage.cells[index]),
      seat: parseCellText(rowMap.self.cells[index]),
      void: parseCellText(rowMap.void.cells[index]) || '无',
      nayin: parseCellText(rowMap.nayin.cells[index]) || '—',
      spirits: parseCellText(rowMap.spirits.cells[index]),
      levelStems
    };
  });

  return {
    pillars,
    metaRows: [
      { label: '藏干', values: pillars.map((item) => item.hidden) },
      { label: '十二长生', values: pillars.map((item) => item.stage) },
      { label: '空亡', values: pillars.map((item) => item.void) },
      { label: '纳音', values: pillars.map((item) => item.nayin) }
    ]
  };
}

Page({
  data: {
    result: null,
    baziPlate: null,
    songPlate: null,
    professionalDetail: null,
    resultTabs: RESULT_TABS,
    activeResultTabIndex: 0,
    selectedLuckIndex: 0,
    selectedYearIndex: 0,
    selectedMonthIndex: 0,
    selectedYearOffset: 0,
    shareToken: ''
  },

  ensureShareToken(reading) {
    if (!reading) return '';
    if (reading.shareToken) return reading.shareToken;
    const shareToken = app.saveBaziShareSnapshot(reading);
    reading.shareToken = shareToken;
    app.globalData.currentBaziReading = reading;
    wx.setStorageSync('currentBaziReading', reading);
    return shareToken;
  },

  readByShareToken(options) {
    const token = options && options.shareToken ? decodeURIComponent(options.shareToken) : '';
    if (!token) return null;
    return app.readBaziShareSnapshot(token);
  },

  onLoad(options = {}) {
    let reading = this.readByShareToken(options);

    if (!reading) {
      reading = app.globalData.currentBaziReading || wx.getStorageSync('currentBaziReading');
    }

    if (!reading || !reading.result || !reading.baziPlate) {
      wx.showToast({
        title: '当前排盘数据缺失，请返回重试',
        icon: 'none'
      });
      return;
    }

    const normalizedShareToken = options.shareToken ? decodeURIComponent(options.shareToken) : '';
    const result = normalizeResult(reading.result);
    const baziPlate = reading.baziPlate || createBaziPlate(result);
    const songPlate = buildSongPlate(result, baziPlate);
    // 使用按大运分组的流年数据创建专业排盘
    const resultForProfessional = {
      ...result,
      flowYears: result.groupedFlowYears || result.flowYears
    };
    const professionalDetail = createProfessionalDetail(resultForProfessional, {
      luckIndex: 0,
      yearIndex: 0,
      monthIndex: 0,
      yearOffset: 0
    });

    const shareToken = reading.shareToken || this.ensureShareToken(reading);
    const basicInterpretation = getBasicInterpretation(result);

    this.setData({
      shareToken,
      result,
      baziPlate,
      songPlate,
      professionalDetail,
      basicInterpretation,
      selectedLuckIndex: professionalDetail.selectedLuckIndex || 0,
      selectedYearIndex: professionalDetail.selectedYearIndex || 0,
      selectedMonthIndex: professionalDetail.selectedMonthIndex || 0,
      selectedYearOffset: professionalDetail.selectedYearOffset || 0
    });
  },

  onShareAppMessage() {
    const token = this.ensureShareToken({
      result: this.data.result,
      baziPlate: this.data.baziPlate,
      shareToken: this.data.shareToken
    });

    return {
      title: `${this.data.result.displayName || '八字'}${this.data.result.destinyLabel || ''}排盘结果`,
      path: `/pages/bazi-result/bazi-result?shareToken=${encodeURIComponent(token)}`
    };
  },

  onResultTabChange(event) {
    this.setData({
      activeResultTabIndex: Number(event.currentTarget.dataset.tabIndex)
    });
  },

  refreshProfessionalDetail(patch = {}) {
    if (!this.data.result) return;
    const options = {
      luckIndex: Number(this.data.selectedLuckIndex),
      yearIndex: Number(this.data.selectedYearIndex),
      monthIndex: Number(this.data.selectedMonthIndex),
      yearOffset: Number(this.data.selectedYearOffset),
      ...patch
    };

    // 使用按大运分组的流年数据
    const resultForProfessional = {
      ...this.data.result,
      flowYears: this.data.result.groupedFlowYears || this.data.result.flowYears
    };
    const professionalDetail = createProfessionalDetail(resultForProfessional, {
      luckIndex: options.luckIndex,
      yearIndex: options.yearIndex,
      monthIndex: options.monthIndex,
      yearOffset: options.yearOffset
    });

    this.setData({
      professionalDetail,
      selectedLuckIndex: professionalDetail.selectedLuckIndex,
      selectedYearIndex: professionalDetail.selectedYearIndex,
      selectedMonthIndex: professionalDetail.selectedMonthIndex,
      selectedYearOffset: professionalDetail.selectedYearOffset
    });
  },

  onLuckTap(event) {
    this.refreshProfessionalDetail({ luckIndex: Number(event.currentTarget.dataset.index) });
  },

  onFlowYearTap(event) {
    this.refreshProfessionalDetail({
      yearIndex: Number(event.currentTarget.dataset.index),
      yearOffset: 0
    });
  },

  onFlowYearItemTap(event) {
    this.refreshProfessionalDetail({
      yearIndex: Number(event.currentTarget.dataset.index),
      yearOffset: Number(event.currentTarget.dataset.offset)
    });
  },

  onFlowMonthTap(event) {
    this.refreshProfessionalDetail({ monthIndex: Number(event.currentTarget.dataset.index) });
  },

  archiveCurrentCase() {
    if (!this.data.result) return;
    const triggerText = this.data.result.flowTriggerSummary && this.data.result.flowTriggerSummary.summary
      ? `当前流信息：${this.data.result.flowTriggerSummary.summary}`
      : '';
    app.addCase({
      type: '八字',
      title: this.data.result.title || this.data.result.displayName || '八字排盘',
      summary: [
        this.data.result.professional?.chartSummary?.oneLine || '',
        triggerText,
        this.data.result.aiText || ''
      ].filter(Boolean).join(' '),
      payload: {
        result: this.data.result,
        baziPlate: this.data.baziPlate,
        professionalDetail: this.data.professionalDetail,
        shareToken: this.data.shareToken
      }
    });
    wx.showToast({ title: '已存入命例', icon: 'success' });
  },

  openGanzhiDiagram() {
    wx.showToast({
      title: '十神演示功能待接入',
      icon: 'none'
    });
  },

  openAiCommand() {
    wx.showToast({
      title: 'AI 助手功能待接入',
      icon: 'none'
    });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/bazi/bazi' });
  }
});
