const app = getApp();
const { createProfessionalDetail } = require('../../utils/baziPlate');

function normalizeResult(result) {
  if (!result) return result;
  const title = result.title || '';
  const displayName = result.displayName || title.replace(/的八字排盘$/, '') || '未命名';
  return {
    ...result,
    displayName
  };
}

function cellToText(cell) {
  if (!cell) return '';
  if (cell.text) return cell.text;
  if (cell.lines && cell.lines.length) return cell.lines.join('、');
  if (cell.richLines && cell.richLines.length) {
    return cell.richLines.map((item) => `${item.stem}${item.tenGod}`).join('、');
  }
  if (cell.hidden1Show) {
    return [
      cell.hidden1Show ? `${cell.hidden1Stem}${cell.hidden1God}` : '',
      cell.hidden2Show ? `${cell.hidden2Stem}${cell.hidden2God}` : '',
      cell.hidden3Show ? `${cell.hidden3Stem}${cell.hidden3God}` : ''
    ].filter(Boolean).join('、');
  }
  return '';
}

function findRow(rows, label) {
  return rows.find((row) => row.label === label) || { cells: [] };
}

function buildSongPlate(baziPlate) {
  if (!baziPlate) return null;
  const rows = baziPlate.rows || [];
  const columns = baziPlate.columns || [];
  const rowMap = {
    star: findRow(rows, '主星'),
    stem: findRow(rows, '天干'),
    branch: findRow(rows, '地支'),
    hidden: findRow(rows, '藏干'),
    subStar: findRow(rows, '副星'),
    stage: findRow(rows, '星运'),
    seat: findRow(rows, '自坐'),
    void: findRow(rows, '空亡'),
    nayin: findRow(rows, '纳音'),
    spirits: findRow(rows, '神煞')
  };

  const pillars = columns.map((column, index) => ({
      label: column.label,
      star: cellToText(rowMap.star.cells[index]),
      stem: cellToText(rowMap.stem.cells[index]),
      branch: cellToText(rowMap.branch.cells[index]),
      hidden: cellToText(rowMap.hidden.cells[index]) || '无',
      subStar: cellToText(rowMap.subStar.cells[index]) || '无',
      stage: cellToText(rowMap.stage.cells[index]),
      seat: cellToText(rowMap.seat.cells[index]),
      void: cellToText(rowMap.void.cells[index]),
      nayin: cellToText(rowMap.nayin.cells[index]),
      spirits: cellToText(rowMap.spirits.cells[index])
    }));

  return {
    pillars,
    metaRows: [
      { label: '藏干', values: pillars.map((item) => item.hidden) },
      { label: '星运', values: pillars.map((item) => item.stage) },
      { label: '自坐', values: pillars.map((item) => item.seat) },
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
    resultTabs: ['基本命盘', '专业细盘', '分析解读'],
    activeResultTab: '基本命盘',
    selectedLuckIndex: 0,
    selectedYearIndex: 0,
    selectedMonthIndex: 0
  },

  onLoad() {
    const reading = app.globalData.currentBaziReading || wx.getStorageSync('currentBaziReading');
    if (reading && reading.result && reading.baziPlate) {
      const result = normalizeResult(reading.result);
      const professionalDetail = createProfessionalDetail(result);
      this.setData({
        result,
        baziPlate: reading.baziPlate,
        songPlate: buildSongPlate(reading.baziPlate),
        professionalDetail,
        selectedLuckIndex: professionalDetail.selectedLuckIndex,
        selectedYearIndex: professionalDetail.selectedYearIndex,
        selectedMonthIndex: professionalDetail.selectedMonthIndex
      });
    }
  },

  onResultTabChange(event) {
    this.setData({ activeResultTab: event.currentTarget.dataset.tab });
  },

  refreshProfessionalDetail(patch) {
    if (!this.data.result) return;
    const next = {
      luckIndex: this.data.selectedLuckIndex,
      yearIndex: this.data.selectedYearIndex,
      monthIndex: this.data.selectedMonthIndex,
      ...patch
    };
    const professionalDetail = createProfessionalDetail(this.data.result, next);
    this.setData({
      professionalDetail,
      selectedLuckIndex: professionalDetail.selectedLuckIndex,
      selectedYearIndex: professionalDetail.selectedYearIndex,
      selectedMonthIndex: professionalDetail.selectedMonthIndex
    });
  },

  onLuckTap(event) {
    this.refreshProfessionalDetail({ luckIndex: Number(event.currentTarget.dataset.index) });
  },

  onFlowYearTap(event) {
    this.refreshProfessionalDetail({ yearIndex: Number(event.currentTarget.dataset.index) });
  },

  onFlowMonthTap(event) {
    this.refreshProfessionalDetail({ monthIndex: Number(event.currentTarget.dataset.index) });
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
