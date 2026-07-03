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
const ALPHABET_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SURNAME_INITIALS = {
  赵: 'Z', 钱: 'Q', 孙: 'S', 李: 'L', 周: 'Z', 吴: 'W', 郑: 'Z', 王: 'W',
  冯: 'F', 陈: 'C', 褚: 'C', 卫: 'W', 蒋: 'J', 沈: 'S', 韩: 'H', 杨: 'Y',
  朱: 'Z', 秦: 'Q', 尤: 'Y', 许: 'X', 何: 'H', 吕: 'L', 施: 'S', 张: 'Z',
  孔: 'K', 曹: 'C', 严: 'Y', 华: 'H', 金: 'J', 魏: 'W', 陶: 'T', 姜: 'J',
  戚: 'Q', 谢: 'X', 邹: 'Z', 喻: 'Y', 柏: 'B', 水: 'S', 窦: 'D', 章: 'Z',
  云: 'Y', 苏: 'S', 潘: 'P', 葛: 'G', 奚: 'X', 范: 'F', 彭: 'P', 郎: 'L',
  鲁: 'L', 韦: 'W', 昌: 'C', 马: 'M', 苗: 'M', 凤: 'F', 花: 'H', 方: 'F',
  俞: 'Y', 任: 'R', 袁: 'Y', 柳: 'L', 鲍: 'B', 史: 'S', 唐: 'T', 费: 'F',
  廉: 'L', 岑: 'C', 薛: 'X', 雷: 'L', 贺: 'H', 倪: 'N', 汤: 'T', 滕: 'T',
  殷: 'Y', 罗: 'L', 毕: 'B', 郝: 'H', 邬: 'W', 安: 'A', 常: 'C', 乐: 'Y',
  于: 'Y', 时: 'S', 傅: 'F', 皮: 'P', 卞: 'B', 齐: 'Q', 康: 'K', 伍: 'W',
  余: 'Y', 元: 'Y', 卜: 'B', 顾: 'G', 孟: 'M', 平: 'P', 黄: 'H', 和: 'H',
  穆: 'M', 萧: 'X', 尹: 'Y', 欧: 'O', 叶: 'Y', 田: 'T', 杜: 'D', 丁: 'D',
  邓: 'D', 郭: 'G', 白: 'B', 刘: 'L', 梁: 'L', 宋: 'S', 林: 'L', 徐: 'X',
  胡: 'H', 高: 'G', 郭: 'G', 肖: 'X', 曾: 'Z', 赖: 'L', 龚: 'G', 文: 'W',
  熊: 'X', 谭: 'T', 蔡: 'C', 侯: 'H', 邱: 'Q', 石: 'S', 夏: 'X', 钟: 'Z',
  姚: 'Y', 邵: 'S', 黎: 'L', 崔: 'C', 程: 'C', 戴: 'D', 陆: 'L', 廖: 'L',
  江: 'J', 夏: 'X', 汪: 'W', 范: 'F', 董: 'D', 方: 'F', 蔡: 'C', 邹: 'Z',
  段: 'D', 龙: 'L', 侯: 'H', 邵: 'S', 程: 'C', 史: 'S', 毛: 'M', 万: 'W',
  殷: 'Y', 牛: 'N', 尹: 'Y', 岳: 'Y', 易: 'Y', 贺: 'H', 赖: 'L', 龚: 'G',
  未: 'W'
};

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

function getRecordInitial(name) {
  const text = String(name || '').trim();
  const first = text[0] || '';
  if (/^[A-Za-z]$/.test(first)) return first.toUpperCase();
  if (SURNAME_INITIALS[first]) return SURNAME_INITIALS[first];
  if (/^[\d]$/.test(first)) return 'Z';
  return 'Z';
}

function buildSections(records, category) {
  if (category !== '八字') {
    return records.length ? [{ letter: '', showHeader: false, items: records }] : [];
  }
  const groups = {};
  records.forEach((item) => {
    const letter = getRecordInitial(item.displayName);
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(item);
  });
  return ALPHABET_LETTERS
    .filter((letter) => groups[letter] && groups[letter].length)
    .map((letter) => ({
      letter,
      showHeader: true,
      items: groups[letter].sort(compareByDisplayName)
    }));
}

function buildAlphabetEntries(sections) {
  const available = {};
  sections.forEach((section) => {
    if (section.letter) available[section.letter] = true;
  });
  return ALPHABET_LETTERS.map((letter) => ({
    letter,
    available: Boolean(available[letter])
  }));
}

Page({
  data: {
    allCases: [],
    cases: [],
    sections: [],
    query: '',
    categories: ['八字', '六爻', '奇门'],
    activeCategory: '八字',
    alphabetEntries: ALPHABET_LETTERS.map((letter) => ({ letter, available: false })),
    activeLetter: '',
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
    const cases = this.filterAndDecorate(source, this.data.query, this.data.activeCategory);
    const sections = buildSections(cases, this.data.activeCategory);
    this.setData({
      allCases: source,
      cases,
      sections,
      alphabetEntries: buildAlphabetEntries(sections),
      activeLetter: sections[0] && sections[0].letter ? sections[0].letter : '',
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
    const cases = this.filterAndDecorate(this.data.allCases, query, this.data.activeCategory);
    const sections = buildSections(cases, this.data.activeCategory);
    this.setData({
      query,
      cases,
      sections,
      alphabetEntries: buildAlphabetEntries(sections),
      activeLetter: sections[0] && sections[0].letter ? sections[0].letter : ''
    });
  },

  onCategoryTap(event) {
    const category = event.currentTarget.dataset.category;
    const cases = this.filterAndDecorate(this.data.allCases, this.data.query, category);
    const sections = buildSections(cases, category);
    this.setData({
      activeCategory: category,
      openedDeleteId: null,
      cases,
      sections,
      alphabetEntries: buildAlphabetEntries(sections),
      activeLetter: sections[0] && sections[0].letter ? sections[0].letter : ''
    });
  },

  openFilterSheet() {
    wx.showActionSheet({
      itemList: this.data.categories,
      success: (res) => {
        const category = this.data.categories[res.tapIndex] || '八字';
        const cases = this.filterAndDecorate(this.data.allCases, this.data.query, category);
        const sections = buildSections(cases, category);
        this.setData({
          activeCategory: category,
          openedDeleteId: null,
          cases,
          sections,
          alphabetEntries: buildAlphabetEntries(sections),
          activeLetter: sections[0] && sections[0].letter ? sections[0].letter : ''
        });
      }
    });
  },

  onAlphabetTap(event) {
    const letter = event.currentTarget.dataset.letter;
    const available = event.currentTarget.dataset.available;
    if (available === false || available === 'false') return;
    this.setData({ activeLetter: letter });
    wx.pageScrollTo({
      selector: `#letter-${letter}`,
      duration: 120
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
