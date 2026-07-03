App({
  globalData: {
    appName: '算命阁',
    engineVersion: 'local-rules-2026.06.29',
    disclaimer: '仅供参考，娱乐与研究向内容，仅供学习交流，不用于医疗、法律、金融等高风险决策。产品持续迭代中，请慎重参考。'
  },

  onLaunch() {
    this.ensureShareSnapshotStore();

    const history = wx.getStorageSync('readingHistory');
    if (!Array.isArray(history)) {
      wx.setStorageSync('readingHistory', []);
    }
    const caseArchive = wx.getStorageSync('caseArchive');
    if (!Array.isArray(caseArchive)) {
      wx.setStorageSync('caseArchive', []);
    }
  },

  getShareSnapshotStorage() {
    const raw = wx.getStorageSync('baziShareSnapshots');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw;
  },

  ensureShareSnapshotStore() {
    const now = Date.now();
    const store = this.getShareSnapshotStorage();
    const normalized = {};
    Object.keys(store).forEach((token) => {
      const entry = store[token];
      if (!entry || typeof entry !== 'object') return;
      if (entry.expiresAt && entry.expiresAt <= now) return;
      normalized[token] = entry;
    });
    wx.setStorageSync('baziShareSnapshots', normalized);
  },

  createShareToken() {
    return `bs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  },

  saveBaziShareSnapshot(reading = {}, ttlMinutes = 60 * 24) {
    const token = this.createShareToken();
    const now = Date.now();
    const payload = {
      token,
      reading,
      createdAt: now,
      expiresAt: now + ttlMinutes * 60 * 1000
    };

    const store = this.getShareSnapshotStorage();
    store[token] = payload;

    const maxItems = 30;
    const entries = Object.keys(store)
      .map((k) => ({ token: k, data: store[k] }))
      .filter((item) => item && item.data && Number.isFinite(item.data.createdAt))
      .sort((a, b) => b.data.createdAt - a.data.createdAt);

    if (entries.length > maxItems) {
      entries.slice(maxItems).forEach((item) => {
        delete store[item.token];
      });
    }

    wx.setStorageSync('baziShareSnapshots', store);
    return token;
  },

  readBaziShareSnapshot(token) {
    if (!token) return null;
    const store = this.getShareSnapshotStorage();
    const entry = store[token];
    if (!entry || typeof entry !== 'object') return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      delete store[token];
      wx.setStorageSync('baziShareSnapshots', store);
      return null;
    }
    return entry.reading || null;
  },

  removeBaziShareSnapshot(token) {
    if (!token) return;
    const store = this.getShareSnapshotStorage();
    if (store[token]) {
      delete store[token];
      wx.setStorageSync('baziShareSnapshots', store);
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

