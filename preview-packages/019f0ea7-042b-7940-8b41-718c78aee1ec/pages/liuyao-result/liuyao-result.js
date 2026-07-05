const app = getApp();

Page({
  data: {
    result: null
  },

  onLoad() {
    const reading = app.globalData.currentLiuyaoReading || wx.getStorageSync('currentLiuyaoReading');
    if (reading && reading.result) {
      this.setData({ result: reading.result });
    }
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/liuyao/liuyao' });
  }
});
