const app = getApp();

Page({
  data: {
    result: null,
    selectedPalace: null
  },

  onLoad() {
    const reading = app.globalData.currentQimenReading || wx.getStorageSync('currentQimenReading');
    if (reading && reading.result) {
      this.setData({
        result: reading.result,
        selectedPalace: reading.selectedPalace || reading.result.cells[0]
      });
    }
  },

  selectPalace(event) {
    if (!this.data.result) return;
    const number = Number(event.currentTarget.dataset.number);
    const selectedPalace = this.data.result.cells.find((item) => Number(item.number) === number);
    if (selectedPalace) {
      this.setData({ selectedPalace });
    }
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/qimen/qimen' });
  }
});
