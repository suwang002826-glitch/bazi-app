App({
  globalData: {
    appName: '玄门命理',
    engineVersion: 'backend-api-2026.07.02',
    baziApi: {
      enabled: true,
      baseUrl: 'http://127.0.0.1:8787',
      calculatePath: '/bazi/calculate',
      healthPath: '/health',
      coveragePath: '/bazi/calendar/coverage',
      timeout: 15000,
      provider: 'backend-local'
    },
    disclaimer: '术数为观象明理之学，本小程序内容用于传统文化学习、趋吉避凶与自我复盘，不作绝对命运裁断，也不用于医疗、法律、投资等重大决策。'
  },

  onLaunch() {
    const history = wx.getStorageSync('readingHistory');
    if (!Array.isArray(history)) {
      wx.setStorageSync('readingHistory', []);
    }
    const caseArchive = wx.getStorageSync('caseArchive');
    if (!Array.isArray(caseArchive)) {
      wx.setStorageSync('caseArchive', []);
    }
  },

  addHistory(record) {
    const history = wx.getStorageSync('readingHistory') || [];
    const next = [
      {
        id: Date.now(),
        createdAt: this.formatDateTime(new Date()),
        engineVersion: this.globalData.engineVersion,
        ...record
      },
      ...history
    ].slice(0, 20);
    wx.setStorageSync('readingHistory', next);
  },

  addCase(record) {
    const archive = wx.getStorageSync('caseArchive') || [];
    const next = [
      {
        id: Date.now(),
        archivedAt: this.formatDateTime(new Date()),
        engineVersion: this.globalData.engineVersion,
        ...record
      },
      ...archive
    ].slice(0, 50);
    wx.setStorageSync('caseArchive', next);
    return next;
  },

  formatDateTime(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
});
