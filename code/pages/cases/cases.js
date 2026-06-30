const app = getApp();

Page({
  data: {
    cases: [],
    filteredCases: [],
    history: [],
    filterOptions: ['全部', '八字', '六爻', '奇门'],
    filterIndex: 0,
    statusOptions: ['待验证', '已应验', '未应验', '需复盘'],
    emptyText: '暂无命例档案，可先在八字、六爻或奇门完成一次解读，再从最近记录中存档。'
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const cases = wx.getStorageSync('caseArchive') || [];
    const history = (wx.getStorageSync('readingHistory') || []).slice(0, 10);
    this.setData({
      cases,
      filteredCases: this.filterCases(cases, this.data.filterIndex),
      history
    });
  },

  filterCases(cases, filterIndex) {
    const type = this.data.filterOptions[filterIndex];
    if (!type || type === '全部') return cases;
    return cases.filter((item) => item.type === type);
  },

  onFilterChange(event) {
    const filterIndex = Number(event.currentTarget.dataset.index);
    this.setData({
      filterIndex,
      filteredCases: this.filterCases(this.data.cases, filterIndex)
    });
  },

  saveCase(event) {
    const id = Number(event.currentTarget.dataset.id);
    const item = this.data.history.find((record) => Number(record.id) === id);
    if (!item) return;

    const cases = app.addCase({
      sourceId: item.id,
      type: item.type,
      title: item.title,
      createdAt: item.createdAt,
      summary: item.summary,
      tag: item.type === '六爻' ? '问事' : (item.type === '奇门' ? '起局' : '命盘'),
      status: '待验证',
      verifiedAt: '',
      accurate: '',
      inaccurate: '',
      userFeedback: '',
      note: '测试版命例，可补充应验时间、准确点、不准点与现实反馈。'
    });
    this.setData({
      cases,
      filteredCases: this.filterCases(cases, this.data.filterIndex)
    });
    wx.showToast({ title: '已存入命例', icon: 'success' });
  },

  cycleStatus(event) {
    const id = Number(event.currentTarget.dataset.id);
    const cases = this.data.cases.map((item) => {
      if (Number(item.id) !== id) return item;
      const current = this.data.statusOptions.indexOf(item.status || '待验证');
      const status = this.data.statusOptions[(current + 1) % this.data.statusOptions.length];
      return { ...item, status };
    });
    wx.setStorageSync('caseArchive', cases);
    this.setData({
      cases,
      filteredCases: this.filterCases(cases, this.data.filterIndex)
    });
  },

  setVerifiedNow(event) {
    const id = Number(event.currentTarget.dataset.id);
    const now = app.formatDateTime(new Date());
    const cases = this.data.cases.map((item) => (
      Number(item.id) === id ? { ...item, verifiedAt: now, status: item.status || '待验证' } : item
    ));
    wx.setStorageSync('caseArchive', cases);
    this.setData({
      cases,
      filteredCases: this.filterCases(cases, this.data.filterIndex)
    });
  },

  updateCaseField(event) {
    const id = Number(event.currentTarget.dataset.id);
    const field = event.currentTarget.dataset.field;
    if (!['accurate', 'inaccurate', 'userFeedback', 'verifiedAt'].includes(field)) return;
    const cases = this.data.cases.map((item) => (
      Number(item.id) === id ? { ...item, [field]: event.detail.value } : item
    ));
    wx.setStorageSync('caseArchive', cases);
    this.setData({
      cases,
      filteredCases: this.filterCases(cases, this.data.filterIndex)
    });
  },

  markReview(event) {
    const id = Number(event.currentTarget.dataset.id);
    const cases = this.data.cases.map((item) => (
      Number(item.id) === id ? { ...item, status: '需复盘' } : item
    ));
    wx.setStorageSync('caseArchive', cases);
    this.setData({
      cases,
      filteredCases: this.filterCases(cases, this.data.filterIndex)
    });
  },

  deleteCase(event) {
    const id = Number(event.currentTarget.dataset.id);
    wx.showModal({
      title: '删除命例',
      content: '删除后无法恢复，确认删除这条复盘记录吗？',
      success: (res) => {
        if (!res.confirm) return;
        const cases = this.data.cases.filter((item) => Number(item.id) !== id);
        wx.setStorageSync('caseArchive', cases);
        this.setData({
          cases,
          filteredCases: this.filterCases(cases, this.data.filterIndex)
        });
      }
    });
  }
});
