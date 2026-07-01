const app = getApp();

const STEM_ELEMENTS = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water'
};

const BRANCH_ELEMENTS = {
  寅: 'wood', 卯: 'wood',
  巳: 'fire', 午: 'fire',
  辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth',
  申: 'metal', 酉: 'metal',
  子: 'water', 亥: 'water'
};

function isBaziRecord(item) {
  if (!item) return false;
  return item.type === '八字' || item.type === '鍏瓧';
}

function stripTitle(title) {
  return String(title || '未命名').replace(/的八字排盘$/, '') || '未命名';
}

function splitDateLine(solarTime) {
  const value = String(solarTime || '');
  return value.split(' ')[0] || value || '时间待校验';
}

function charMeta(char) {
  return {
    char,
    className: STEM_ELEMENTS[char] || BRANCH_ELEMENTS[char] || 'earth'
  };
}

function buildPillarRows(result) {
  const values = (result && result.pillars ? result.pillars : [])
    .map((item) => item.value || '')
    .filter(Boolean);
  const normalized = values.length ? values : ['甲子', '丙寅', '辛巳', '戊申'];
  return [
    normalized.map((item) => charMeta(item[0] || '')),
    normalized.map((item) => charMeta(item[1] || ''))
  ];
}

function decorateRecord(item, index) {
  const result = item.payload && item.payload.result ? item.payload.result : null;
  const name = result && result.displayName ? result.displayName : stripTitle(item.title);
  return {
    ...item,
    displayName: name,
    gender: result && result.gender ? result.gender : '未填',
    solarDate: result ? splitDateLine(result.solarTime) : (item.createdAt || item.archivedAt || '时间待校验'),
    pillarRows: buildPillarRows(result),
    sealText: name.slice(0, 1) || '命',
    indexLetter: /^[A-Za-z]/.test(name) ? name[0].toUpperCase() : (index === 0 ? 'A' : '')
  };
}

Page({
  data: {
    cases: [],
    query: '',
    emptyText: '暂无八字命例。完成一次八字排盘后，会自动记录在命例档案中。'
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const archive = (wx.getStorageSync('caseArchive') || []).filter(isBaziRecord);
    this.setData({
      cases: archive.map(decorateRecord)
    });
  },

  onSearchInput(event) {
    const query = event.detail.value.trim();
    const archive = (wx.getStorageSync('caseArchive') || []).filter(isBaziRecord);
    const filtered = query
      ? archive.filter((item) => {
        const result = item.payload && item.payload.result ? item.payload.result : {};
        return [item.title, result.displayName, result.solarTime].some((value) => String(value || '').includes(query));
      })
      : archive;
    this.setData({
      query,
      cases: filtered.map(decorateRecord)
    });
  },

  openCase(event) {
    const id = Number(event.currentTarget.dataset.id);
    const record = this.data.cases.find((item) => Number(item.id) === id);
    if (!record || !record.payload) {
      wx.showToast({ title: '旧命例缺少详情，请重新排盘', icon: 'none' });
      return;
    }
    app.globalData.currentBaziReading = record.payload;
    wx.setStorageSync('currentBaziReading', record.payload);
    wx.navigateTo({ url: '/pages/bazi-result/bazi-result' });
  },

  deleteCase(event) {
    const id = Number(event.currentTarget.dataset.id);
    wx.showModal({
      title: '删除命例',
      content: '删除后无法恢复，确认删除这条命例吗？',
      success: (res) => {
        if (!res.confirm) return;
        const archive = (wx.getStorageSync('caseArchive') || []).filter((item) => Number(item.id) !== id);
        wx.setStorageSync('caseArchive', archive);
        this.loadData();
      }
    });
  },

  goBazi() {
    wx.switchTab({ url: '/pages/bazi/bazi' });
  }
});
