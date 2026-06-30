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

Page({
  data: {
    result: null,
    baziPlate: null,
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
