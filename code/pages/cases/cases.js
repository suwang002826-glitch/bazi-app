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
    allCases: [],
    cases: [],
    query: '',
    categories: ['全部', '练习', '亲友', '客户', '复盘'],
    activeCategory: '全部',
    emptyText: '暂无八字命例。完成一次八字排盘后，会自动记录在命例档案中。'
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const archive = (wx.getStorageSync('caseArchive') || []).filter(isBaziRecord);
    this.setData({
      allCases: archive,
      cases: this.filterAndDecorate(archive, this.data.query, this.data.activeCategory)
    });
  },

  filterAndDecorate(archive, query, category) {
    const filtered = archive
      .filter((item) => {
        const itemCategory = item.category || item.group || '练习';
        if (category === '全部') return true;
        if (category === '复盘') return item.status === '需复盘' || itemCategory === '复盘';
        return itemCategory === category;
      })
      .filter((item) => {
        if (!query) return true;
        const result = item.payload && item.payload.result ? item.payload.result : {};
        return [item.title, result.displayName, result.solarTime].some((value) => String(value || '').includes(query));
      });
    return filtered.map(decorateRecord);
  },

  onSearchInput(event) {
    const query = event.detail.value.trim();
    this.setData({
      query,
      cases: this.filterAndDecorate(this.data.allCases, query, this.data.activeCategory)
    });
  },

  onCategoryTap(event) {
    const category = event.currentTarget.dataset.category;
    this.setData({
      activeCategory: category,
      cases: this.filterAndDecorate(this.data.allCases, this.data.query, category)
    });
  },

  openFilterSheet() {
    wx.showActionSheet({
      itemList: this.data.categories,
      success: (res) => {
        const category = this.data.categories[res.tapIndex] || '全部';
        this.setData({
          activeCategory: category,
          cases: this.filterAndDecorate(this.data.allCases, this.data.query, category)
        });
      }
    });
  },

  findRecordById(id) {
    return this.data.allCases.find((item) => Number(item.id) === id)
      || this.data.cases.find((item) => Number(item.id) === id);
  },

  resolvePayload(record) {
    if (record && record.payload) return record.payload;
    const history = wx.getStorageSync('readingHistory') || [];
    const sourceId = Number(record && record.sourceId);
    const title = record && record.title;
    const matched = history.find((item) => Number(item.id) === sourceId)
      || history.find((item) => title && item.title === title && item.payload)
      || history.find((item) => item.payload && item.payload.result && stripTitle(item.title) === stripTitle(title));
    return matched && matched.payload ? matched.payload : null;
  },

  openCase(event) {
    const id = Number(event.currentTarget.dataset.id);
    const record = this.findRecordById(id);
    const payload = this.resolvePayload(record);
    if (!record || !payload) {
      wx.showToast({ title: '旧命例缺少详情，请重新排盘', icon: 'none' });
      return;
    }
    app.globalData.currentBaziReading = payload;
    wx.setStorageSync('currentBaziReading', payload);
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
        const record = this.findRecordById(id);
        const sourceId = Number(record && record.sourceId);
        if (sourceId) {
          const history = (wx.getStorageSync('readingHistory') || []).filter((item) => Number(item.id) !== sourceId);
          wx.setStorageSync('readingHistory', history);
        }
        wx.setStorageSync('caseArchive', archive);
        this.setData({
          allCases: archive,
          cases: this.filterAndDecorate(archive, this.data.query, this.data.activeCategory)
        });
      }
    });
  },

  goBazi() {
    wx.switchTab({ url: '/pages/bazi/bazi' });
  }
});
