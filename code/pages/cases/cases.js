const app = getApp();

const STEM_ELEMENTS = {
  甲: 'wood',
  乙: 'wood',
  丙: 'fire',
  丁: 'fire',
  戊: 'earth',
  己: 'earth',
  庚: 'metal',
  辛: 'metal',
  壬: 'water',
  癸: 'water'
};

const BRANCH_ELEMENTS = {
  寅: 'wood',
  卯: 'wood',
  巳: 'fire',
  午: 'fire',
  辰: 'earth',
  戌: 'earth',
  丑: 'earth',
  未: 'earth',
  申: 'metal',
  酉: 'metal',
  子: 'water',
  亥: 'water'
};

const ZODIAC_BY_BRANCH = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪'
};

const ZODIAC_ICON_BY_BRANCH = {
  子: 'zi',
  丑: 'chou',
  寅: 'yin',
  卯: 'mao',
  辰: 'chen',
  巳: 'si',
  午: 'wu',
  未: 'wei',
  申: 'shen',
  酉: 'you',
  戌: 'xu',
  亥: 'hai'
};

const ZODIAC_CDN_BASE = '';

function getZodiacIconSrc(iconKey) {
  if (ZODIAC_CDN_BASE) {
    return `${ZODIAC_CDN_BASE.replace(/\/$/, '')}/${iconKey}.png`;
  }
  return `/assets/zodiac/${iconKey}.png`;
}

function normalizeType(type) {
  if (type === '八字' || type === 'bazi') return 'bazi';
  if (type === '六爻' || type === 'liuyao') return 'liuyao';
  if (type === '奇门' || type === 'qimen') return 'qimen';
  return '';
}

function isReplayRecord(item) {
  return Boolean(item && normalizeType(item.type) && item.payload && item.payload.result);
}

function stripBaziTitle(title) {
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

function getYearBranch(result) {
  const yearPillar = result && result.pillars && result.pillars[0] ? result.pillars[0].value : '';
  return yearPillar && yearPillar[1] ? yearPillar[1] : '子';
}

function buildZodiacSeal(result) {
  const branch = getYearBranch(result);
  const iconKey = ZODIAC_ICON_BY_BRANCH[branch] || 'zi';
  return {
    branch,
    animal: ZODIAC_BY_BRANCH[branch] || '鼠',
    icon: getZodiacIconSrc(iconKey),
    className: BRANCH_ELEMENTS[branch] || 'water'
  };
}

function makeReplayKey(item) {
  const typeKey = normalizeType(item.type);
  const result = item.payload && item.payload.result ? item.payload.result : {};
  let identity = `${item.title || ''}-${item.createdAt || item.archivedAt || ''}`;
  if (typeKey === 'bazi') {
    identity = `${result.displayName || stripBaziTitle(item.title)}-${result.solarTime || ''}`;
  }
  if (typeKey === 'liuyao') {
    identity = `${item.payload.question || result.question || ''}-${result.hexagramName || item.title || ''}`;
  }
  if (typeKey === 'qimen') {
    identity = `${item.payload.form && item.payload.form.question ? item.payload.form.question : result.question || ''}-${result.castTime || ''}`;
  }
  return `${typeKey}-${identity}`;
}

function buildReplaySource() {
  const archive = (wx.getStorageSync('caseArchive') || [])
    .filter(isReplayRecord)
    .map((item) => ({ ...item, sourceStore: 'archive' }));
  const history = (wx.getStorageSync('readingHistory') || [])
    .filter(isReplayRecord)
    .map((item) => ({ ...item, sourceStore: 'history' }));
  const seen = {};
  return [...archive, ...history].filter((item) => {
    const key = makeReplayKey(item);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function decorateBaziRecord(item, result) {
  const name = result && result.displayName ? result.displayName : stripBaziTitle(item.title);
  return {
    ...item,
    typeKey: 'bazi',
    typeLabel: '八字',
    displayName: name || '未命名',
    gender: result && result.gender ? result.gender : '未填',
    detailLine: `阳历 ${splitDateLine(result && result.solarTime)}`,
    subLine: item.archivedAt || item.createdAt || '时间待校验',
    pillarRows: buildPillarRows(result),
    zodiacSeal: buildZodiacSeal(result)
  };
}

function decorateLiuyaoRecord(item, result) {
  const question = item.payload && item.payload.question ? item.payload.question : (result.question || '未填写问事');
  const method = result.method || (item.payload && item.payload.modeIndex === 0 ? '手动起卦' : '六爻起卦');
  const category = result.category || '复盘';
  return {
    ...item,
    typeKey: 'liuyao',
    typeLabel: '六爻',
    displayName: result.hexagramName || item.title || '六爻卦象',
    gender: category,
    detailLine: question,
    subLine: `${method} · ${item.createdAt || item.archivedAt || ''}`,
    recordSummary: result.changedName ? `${result.hexagramName} 之 ${result.changedName}` : (result.hexagramName || '卦象待复盘'),
    recordTags: [result.focus, result.movingSummary, result.palaceLabel].filter(Boolean).slice(0, 3),
    symbolText: '卦'
  };
}

function decorateQimenRecord(item, result) {
  const form = item.payload && item.payload.form ? item.payload.form : {};
  const question = form.question || result.question || '未填写问事';
  const category = form.category || '问事';
  return {
    ...item,
    typeKey: 'qimen',
    typeLabel: '奇门',
    displayName: result.title || item.title || '奇门局',
    gender: category,
    detailLine: question,
    subLine: `${result.castTime || [form.date, form.time].filter(Boolean).join(' ')} · ${item.createdAt || item.archivedAt || ''}`,
    recordSummary: result.calendar && result.calendar.ju ? `${result.calendar.ju} · ${result.focus && result.focus.door ? result.focus.door : '用宫待复盘'}` : '奇门局待复盘',
    recordTags: [
      result.chief && result.chief.star ? `值符${result.chief.star}` : '',
      result.chief && result.chief.door ? `值使${result.chief.door}` : '',
      result.calendar && result.calendar.horseBranch ? `马星${result.calendar.horseBranch}` : ''
    ].filter(Boolean).slice(0, 3),
    symbolText: '奇'
  };
}

function decorateRecord(item) {
  const result = item.payload && item.payload.result ? item.payload.result : {};
  const typeKey = normalizeType(item.type);
  if (typeKey === 'liuyao') return decorateLiuyaoRecord(item, result);
  if (typeKey === 'qimen') return decorateQimenRecord(item, result);
  return decorateBaziRecord(item, result);
}

function compareByDisplayName(a, b) {
  const left = String(a.displayName || '').trim();
  const right = String(b.displayName || '').trim();
  try {
    return left.localeCompare(right, 'zh-Hans-CN', { sensitivity: 'base' });
  } catch (error) {
    return left.localeCompare(right);
  }
}

Page({
  data: {
    allCases: [],
    cases: [],
    query: '',
    categories: ['八字', '六爻', '奇门'],
    activeCategory: '八字',
    openedDeleteId: null,
    touchStartX: 0,
    touchStartY: 0,
    touchMoved: false,
    emptyText: '暂无当前分类记录。完成对应排盘或起卦后，会自动记录在这里。'
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const source = buildReplaySource();
    this.setData({
      allCases: source,
      cases: this.filterAndDecorate(source, this.data.query, this.data.activeCategory),
      openedDeleteId: null
    });
  },

  filterAndDecorate(source, query, category) {
    const filtered = source
      .filter((item) => {
        const typeKey = normalizeType(item.type);
        if (category === '八字') return typeKey === 'bazi';
        if (category === '六爻') return typeKey === 'liuyao';
        if (category === '奇门') return typeKey === 'qimen';
        return false;
      })
      .filter((item) => {
        if (!query) return true;
        const result = item.payload && item.payload.result ? item.payload.result : {};
        return [
          item.title,
          item.summary,
          item.note,
          result.displayName,
          result.solarTime,
          result.hexagramName,
          result.changedName,
          result.question,
          result.title,
          result.castTime,
          result.calendar && result.calendar.ju,
          result.focus && result.focus.door,
          item.payload && item.payload.form && item.payload.form.question,
          item.payload && item.payload.question
        ].some((value) => String(value || '').includes(query));
      });
    const decorated = filtered.map(decorateRecord);
    if (category === '八字') {
      return decorated.sort(compareByDisplayName);
    }
    return decorated;
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
      openedDeleteId: null,
      cases: this.filterAndDecorate(this.data.allCases, this.data.query, category)
    });
  },

  openFilterSheet() {
    wx.showActionSheet({
      itemList: this.data.categories,
      success: (res) => {
        const category = this.data.categories[res.tapIndex] || '八字';
        this.setData({
          activeCategory: category,
          openedDeleteId: null,
          cases: this.filterAndDecorate(this.data.allCases, this.data.query, category)
        });
      }
    });
  },

  onCaseTouchStart(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      touchMoved: false
    });
  },

  onCaseTouchMove(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    const dx = touch.clientX - this.data.touchStartX;
    const dy = touch.clientY - this.data.touchStartY;
    if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy)) {
      this.setData({ touchMoved: true });
    }
  },

  onCaseTouchEnd(event) {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    const id = Number(event.currentTarget.dataset.id);
    const dx = touch.clientX - this.data.touchStartX;
    if (dx < -42) {
      this.setData({ openedDeleteId: id, touchMoved: true });
      return;
    }
    if (dx > 42) {
      this.setData({ openedDeleteId: null, touchMoved: true });
    }
  },

  findRecordById(id) {
    return this.data.allCases.find((item) => Number(item.id) === id)
      || this.data.cases.find((item) => Number(item.id) === id);
  },

  openCase(event) {
    const id = Number(event.currentTarget.dataset.id);
    if (this.data.touchMoved) {
      this.setData({ touchMoved: false });
      return;
    }
    if (this.data.openedDeleteId && this.data.openedDeleteId !== id) {
      this.setData({ openedDeleteId: null });
      return;
    }
    const record = this.findRecordById(id);
    const payload = record && record.payload;
    if (!record || !payload) {
      wx.showToast({ title: '旧记录缺少详情，请重新排盘', icon: 'none' });
      return;
    }
    this.setData({ openedDeleteId: null });
    if (normalizeType(record.type) === 'liuyao') {
      app.globalData.currentLiuyaoReading = payload;
      wx.setStorageSync('currentLiuyaoReading', payload);
      wx.navigateTo({ url: '/pages/liuyao-result/liuyao-result' });
      return;
    }
    if (normalizeType(record.type) === 'qimen') {
      app.globalData.currentQimenReading = payload;
      wx.setStorageSync('currentQimenReading', payload);
      wx.navigateTo({ url: '/pages/qimen-result/qimen-result' });
      return;
    }
    app.globalData.currentBaziReading = payload;
    wx.setStorageSync('currentBaziReading', payload);
    wx.navigateTo({ url: '/pages/bazi-result/bazi-result' });
  },

  deleteCase(event) {
    const id = Number(event.currentTarget.dataset.id);
    wx.showModal({
      title: '删除记录',
      content: '删除后无法恢复，确认删除这条复盘记录吗？',
      success: (res) => {
        if (!res.confirm) return;
        const record = this.findRecordById(id);
        if (record && record.sourceStore === 'history') {
          const history = (wx.getStorageSync('readingHistory') || []).filter((item) => Number(item.id) !== id);
          wx.setStorageSync('readingHistory', history);
        } else {
          const archive = (wx.getStorageSync('caseArchive') || []).filter((item) => Number(item.id) !== id);
          wx.setStorageSync('caseArchive', archive);
          const sourceId = Number(record && record.sourceId);
          if (sourceId) {
            const history = (wx.getStorageSync('readingHistory') || []).filter((item) => Number(item.id) !== sourceId);
            wx.setStorageSync('readingHistory', history);
          }
        }
        this.loadData();
      }
    });
  },

  goBazi() {
    wx.switchTab({ url: '/pages/bazi/bazi' });
  }
});
