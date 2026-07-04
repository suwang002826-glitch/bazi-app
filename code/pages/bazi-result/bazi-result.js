const app = getApp();
const { createBaziPlate, createProfessionalDetail } = require('../../utils/baziPlate');
const {
  buildBaziInputSnapshot,
  getDefaultBaziHistoryTitle
} = require('../../utils/bazi/historyStore');
const { getBaziExplanation } = require('../../utils/bazi/explanations');
const {
  getDefaultResultSectionState,
  toggleResultSection,
  findCurrentFlowYear
} = require('../../utils/bazi/resultSections');

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

function formatShortDate(dateText) {
  if (!dateText) return '';
  const raw = String(dateText).replace('T', ' ');
  return raw.length > 10 ? raw.slice(0, 10) : raw;
}

function formatRange(startDate, endDate) {
  if (!startDate && !endDate) return '';
  if (!startDate) return formatShortDate(endDate);
  if (!endDate) return formatShortDate(startDate);
  return `${formatShortDate(startDate)} ~ ${formatShortDate(endDate)}`;
}

function toInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeFlowMonth(month) {
  if (!month) return null;
  const termName = month.termName || month.term || '';
  const startDate = month.startDate || '';
  const endDate = month.endDate || '';
  const dateRange = formatRange(startDate, endDate) || formatShortDate(termName) || month.dateShort || '';
  return {
    ...month,
    monthTitle: month.monthTitle || termName || '',
    dateText: dateRange,
    termNameText: termName,
    startDateText: formatShortDate(startDate),
    endDateText: formatShortDate(endDate),
    naYinText: month.naYin || '',
    displayLabel: month.monthTitle || termName || month.termTime || ''
  };
}

function normalizeFlowYears(flowYearsRaw) {
  if (!Array.isArray(flowYearsRaw) || !flowYearsRaw.length) return [];
  return flowYearsRaw
    .map((item) => item || {})
    .map((item) => {
      const year = toInt(item.year, NaN);
      const age = toInt(item.age, NaN);
      return {
        ...item,
        year,
        age,
        ageText: Number.isFinite(age) ? `${age}岁` : '',
        yearText: Number.isFinite(year) ? `${year}年` : '—',
        dateRangeText: formatRange(item.startDate, item.endDate),
        naYinText: item.naYin || '',
        tenGodText: item.tenGod || '',
        lichunDateText: formatShortDate(item.lichunDate || ''),
        months: Array.isArray(item.months) ? item.months.map(normalizeFlowMonth).filter(Boolean) : []
      };
    })
    .sort((a, b) => {
      const aYear = Number.isFinite(a.year) ? a.year : Number.MIN_SAFE_INTEGER;
      const bYear = Number.isFinite(b.year) ? b.year : Number.MIN_SAFE_INTEGER;
      if (aYear !== bYear) return aYear - bYear;
      const aAge = Number.isFinite(a.age) ? a.age : 0;
      const bAge = Number.isFinite(b.age) ? b.age : 0;
      return aAge - bAge;
    });
}

function getDefaultTimelineYears(flowYears, cycles, luckIndex) {
  if (!Array.isArray(flowYears) || !flowYears.length) return [];

  const sortedYears = normalizeFlowYears(flowYears);
  if (!sortedYears.length) return [];

  const cycle = Array.isArray(cycles) && cycles[luckIndex] ? cycles[luckIndex] : null;
  if (cycle && cycle.startYear != null && cycle.endYear != null) {
    const startYear = toInt(cycle.startYear, Number.NaN);
    const endYear = toInt(cycle.endYear, Number.NaN);
    const inCycle = sortedYears.filter((item) => Number.isFinite(item.year) && item.year >= startYear && item.year <= endYear);
    if (inCycle.length > 0) return inCycle;
  }

  const currentYear = new Date().getFullYear();
  let nearestIndex = sortedYears.findIndex((item) => item.year === currentYear);
  if (nearestIndex < 0) {
    nearestIndex = sortedYears.findIndex((item) => item.year > currentYear);
    if (nearestIndex < 0) nearestIndex = sortedYears.length - 1;
  }
  let blockStart = Math.floor(Math.max(0, nearestIndex) / 10) * 10;
  if (blockStart + 9 >= sortedYears.length) blockStart = Math.max(0, sortedYears.length - 10);
  return sortedYears.slice(blockStart, blockStart + 10);
}

function buildFlowTimelineState(result, options = {}) {
  const sourceYears = Array.isArray(result.flowYears) ? result.flowYears : [];
  const flowYears = normalizeFlowYears(sourceYears);
  const cycles = result.luck && Array.isArray(result.luck.cycles) ? result.luck.cycles : [];
  const currentLuckIndex = Number.isFinite(toInt(options.luckIndex, NaN)) ? toInt(options.luckIndex, 0) : 0;

  const timelineYears = getDefaultTimelineYears(flowYears, cycles, currentLuckIndex);
  if (!timelineYears.length) {
    return {
      flowTimelineYears: [],
      flowTimelineMonths: [],
      selectedFlowYearIndex: -1,
      selectedFlowMonthIndex: -1,
      selectedFlowYear: null,
      selectedFlowMonth: null,
      selectedFlowLuckIndex: currentLuckIndex
    };
  }

  let targetYear = options.selectedFlowYear;
  if (targetYear == null && options.selectedFlowYearValue != null) targetYear = options.selectedFlowYearValue;
  let selectedFlowYearIndex = Number.isFinite(toInt(options.selectedFlowYearIndex, NaN)) ? toInt(options.selectedFlowYearIndex, 0) : 0;
  if (targetYear != null) {
    const matched = timelineYears.findIndex((item) => toInt(item.year, NaN) === toInt(targetYear, NaN));
    if (matched >= 0) selectedFlowYearIndex = matched;
  }
  if (selectedFlowYearIndex < 0) selectedFlowYearIndex = 0;
  if (selectedFlowYearIndex >= timelineYears.length) selectedFlowYearIndex = timelineYears.length - 1;

  const selectedFlowYear = timelineYears[selectedFlowYearIndex] || timelineYears[0];
  const timelineMonths = selectedFlowYear && Array.isArray(selectedFlowYear.months)
    ? selectedFlowYear.months
    : [];
  let selectedFlowMonthIndex = Number.isFinite(toInt(options.selectedFlowMonthIndex, NaN)) ? toInt(options.selectedFlowMonthIndex, 0) : 0;
  if (selectedFlowMonthIndex < 0) selectedFlowMonthIndex = 0;
  if (selectedFlowMonthIndex >= timelineMonths.length) selectedFlowMonthIndex = timelineMonths.length > 0 ? timelineMonths.length - 1 : 0;

  const selectedFlowMonth = timelineMonths[selectedFlowMonthIndex] || timelineMonths[0] || null;

  return {
    flowTimelineYears: timelineYears,
    flowTimelineMonths: timelineMonths,
    selectedFlowYearIndex,
    selectedFlowMonthIndex,
    selectedFlowYear,
    selectedFlowMonth,
    selectedFlowLuckIndex: currentLuckIndex
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
    flowTimelineYears: [],
    flowTimelineMonths: [],
    selectedFlowYearIndex: 0,
    selectedFlowMonthIndex: 0,
    selectedFlowYear: null,
    selectedFlowMonth: null,
    selectedFlowLuckIndex: 0,
    currentFlowYear: null,
    sectionExpanded: getDefaultResultSectionState(),
    readingInput: null,
    shareToken: ''
  },

  ensureShareToken(reading) {
    if (!reading) return '';
    if (reading.shareToken) return reading.shareToken;
    if (reading.result && !reading.input) {
      reading.input = buildBaziInputSnapshot({}, reading.result);
    }
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

  readByHistoryId(options) {
    const historyId = options && options.historyId ? decodeURIComponent(options.historyId) : '';
    if (!historyId || !app.getBaziHistory) return null;
    const record = app.getBaziHistory(historyId);
    return record && record.payload ? record.payload : null;
  },

  onLoad(options = {}) {
    let reading = this.readByHistoryId(options) || this.readByShareToken(options);

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
    const readingInput = reading.input || buildBaziInputSnapshot({}, result);
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
    const flowTimelineState = buildFlowTimelineState(result, {
      luckIndex: professionalDetail.selectedLuckIndex || 0
    });

    const shareToken = reading.shareToken || this.ensureShareToken(reading);

    this.setData({
      shareToken,
      result,
      baziPlate,
      songPlate,
      professionalDetail,
      readingInput,
      selectedLuckIndex: professionalDetail.selectedLuckIndex || 0,
      selectedYearIndex: professionalDetail.selectedYearIndex || 0,
      selectedMonthIndex: professionalDetail.selectedMonthIndex || 0,
      selectedYearOffset: professionalDetail.selectedYearOffset || 0,
      currentFlowYear: findCurrentFlowYear(result.flowYears),
      sectionExpanded: getDefaultResultSectionState(),
      ...flowTimelineState
    });
  },

  refreshFlowTimeline(patch = {}) {
    if (!this.data.result) return;
    const flowTimelineState = buildFlowTimelineState(this.data.result, {
      luckIndex: Number.isFinite(patch.luckIndex) ? patch.luckIndex : this.data.selectedFlowLuckIndex,
      selectedFlowYearIndex: Number.isFinite(patch.selectedFlowYearIndex) ? patch.selectedFlowYearIndex : this.data.selectedFlowYearIndex,
      selectedFlowMonthIndex: Number.isFinite(patch.selectedFlowMonthIndex) ? patch.selectedFlowMonthIndex : this.data.selectedFlowMonthIndex,
      selectedFlowYear: patch.selectedFlowYear,
      selectedFlowYearValue: patch.selectedFlowYearValue
    });
    this.setData(flowTimelineState);
  },

  buildCurrentReadingSnapshot() {
    return {
      result: this.data.result,
      baziPlate: this.data.baziPlate,
      shareToken: this.data.shareToken,
      input: this.data.readingInput || buildBaziInputSnapshot({}, this.data.result || {})
    };
  },

  onShareAppMessage() {
    const token = this.ensureShareToken(this.buildCurrentReadingSnapshot());

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

  onToggleResultSection(event) {
    const key = event && event.currentTarget && event.currentTarget.dataset
      ? event.currentTarget.dataset.sectionKey
      : '';
    this.setData({
      sectionExpanded: toggleResultSection(this.data.sectionExpanded, key)
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
    const luckIndex = Number(event.currentTarget.dataset.index);
    this.refreshProfessionalDetail({ luckIndex });
    this.refreshFlowTimeline({
      luckIndex,
      selectedFlowYearIndex: 0,
      selectedFlowMonthIndex: 0
    });
  },

  onFlowYearTap(event) {
    const selectedFlowYearIndex = Number(event.currentTarget.dataset.index);
    this.refreshFlowTimeline({
      selectedFlowYearIndex,
      selectedFlowMonthIndex: 0
    });
    this.setData({
      sectionExpanded: {
        ...this.data.sectionExpanded,
        flowMonths: true
      }
    });
  },

  onFlowYearItemTap(event) {
    this.onFlowYearTap(event);
  },

  onFlowMonthTap(event) {
    this.refreshFlowTimeline({
      selectedFlowMonthIndex: Number(event.currentTarget.dataset.index)
    });
  },

  openBaziExplanation(event) {
    const dataset = (event && event.currentTarget && event.currentTarget.dataset) || {};
    const explanation = getBaziExplanation(dataset.topic, dataset.value || '');
    wx.showModal({
      title: explanation.title,
      content: `${explanation.content}\n\n口径：${explanation.basis}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  archiveCurrentCaseDeprecated() {
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

  archiveCurrentCase() {
    this.openSaveCaseModal();
  },

  openSaveCaseModal() {
    if (!this.data.result) return;
    const reading = this.buildCurrentReadingSnapshot();
    const defaultName = getDefaultBaziHistoryTitle(reading.input, reading.result);
    wx.showModal({
      title: '保存命例',
      content: '可修改命例名称，保存后可从首页历史命例恢复。',
      editable: true,
      placeholderText: defaultName,
      success: (res) => {
        if (!res.confirm) return;
        const name = String(res.content || '').trim() || defaultName;
        const saved = app.saveBaziHistory(reading, reading.input, name);
        wx.showToast({
          title: saved ? '已保存命例' : '保存失败',
          icon: saved ? 'success' : 'none'
        });
      }
    });
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
