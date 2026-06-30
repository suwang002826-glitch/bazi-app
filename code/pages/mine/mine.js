const app = getApp();

Page({
  data: {
    profile: {
      nickname: '文化学习者',
      level: '测试版用户',
      note: '档案信息仅保存在本机，用于测试版功能验证。'
    },
    history: [],
    disclaimer: app.globalData.disclaimer
  },

  onShow() {
    this.setData({ history: wx.getStorageSync('readingHistory') || [] });
  },

  goCases() {
    wx.navigateTo({
      url: '/pages/cases/cases',
      fail: () => {
        wx.showToast({ title: '命例档案暂无法打开，请重新编译', icon: 'none' });
      }
    });
  },

  openHistoryRecord(event) {
    const id = Number(event.currentTarget.dataset.id);
    const record = this.data.history.find((item) => Number(item.id) === id);
    if (!record) return;
    if (record.type === '八字' && record.payload) {
      app.globalData.currentBaziReading = record.payload;
      wx.setStorageSync('currentBaziReading', record.payload);
      wx.navigateTo({ url: '/pages/bazi-result/bazi-result' });
      return;
    }
    if (record.type === '六爻' && record.payload) {
      app.globalData.currentLiuyaoReading = record.payload;
      wx.setStorageSync('currentLiuyaoReading', record.payload);
      wx.navigateTo({ url: '/pages/liuyao-result/liuyao-result' });
      return;
    }
    if (record.type === '奇门' && record.payload) {
      app.globalData.currentQimenReading = record.payload;
      wx.setStorageSync('currentQimenReading', record.payload);
      wx.navigateTo({ url: '/pages/qimen-result/qimen-result' });
      return;
    }
    wx.showToast({ title: '旧记录无详情，已打开命例档案', icon: 'none' });
    this.goCases();
  },

  clearHistory() {
    wx.showModal({
      title: '清空历史记录',
      content: '仅清空本机测试数据，不影响其他信息。',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('readingHistory', []);
          this.setData({ history: [] });
        }
      }
    });
  }
});
