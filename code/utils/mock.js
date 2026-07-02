const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const elements = ['木', '火', '土', '金', '水'];
const relations = ['父母', '兄弟', '子孙', '妻财', '官鬼'];
const spirits = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
const { normalizeBaziInput } = require('./bazi/inputNormalizer');
const {
  jieTerms,
  findSolarTermTime,
  getActiveJie,
  getAdjacentJie,
  getSolarTermProviderInfo
} = require('./bazi/solarTermProvider');

const stemMeta = {
  甲: { element: '木', yinYang: '阳' },
  乙: { element: '木', yinYang: '阴' },
  丙: { element: '火', yinYang: '阳' },
  丁: { element: '火', yinYang: '阴' },
  戊: { element: '土', yinYang: '阳' },
  己: { element: '土', yinYang: '阴' },
  庚: { element: '金', yinYang: '阳' },
  辛: { element: '金', yinYang: '阴' },
  壬: { element: '水', yinYang: '阳' },
  癸: { element: '水', yinYang: '阴' }
};

const branchElements = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
};

const hiddenStemsByBranch = {
  子: [{ stem: '癸', weight: 10 }],
  丑: [{ stem: '己', weight: 6 }, { stem: '癸', weight: 3 }, { stem: '辛', weight: 2 }],
  寅: [{ stem: '甲', weight: 6 }, { stem: '丙', weight: 3 }, { stem: '戊', weight: 2 }],
  卯: [{ stem: '乙', weight: 10 }],
  辰: [{ stem: '戊', weight: 6 }, { stem: '乙', weight: 3 }, { stem: '癸', weight: 2 }],
  巳: [{ stem: '丙', weight: 6 }, { stem: '庚', weight: 3 }, { stem: '戊', weight: 2 }],
  午: [{ stem: '丁', weight: 7 }, { stem: '己', weight: 3 }],
  未: [{ stem: '己', weight: 6 }, { stem: '丁', weight: 3 }, { stem: '乙', weight: 2 }],
  申: [{ stem: '庚', weight: 6 }, { stem: '壬', weight: 3 }, { stem: '戊', weight: 2 }],
  酉: [{ stem: '辛', weight: 10 }],
  戌: [{ stem: '戊', weight: 6 }, { stem: '辛', weight: 3 }, { stem: '丁', weight: 2 }],
  亥: [{ stem: '壬', weight: 7 }, { stem: '甲', weight: 3 }]
};

const elementFlow = ['木', '火', '土', '金', '水'];
const elementGenerates = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const elementControls = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const elementControlledBy = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' };
const growthStages = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const growthStart = {
  甲: { branch: '亥', direction: 1 },
  乙: { branch: '午', direction: -1 },
  丙: { branch: '寅', direction: 1 },
  丁: { branch: '酉', direction: -1 },
  戊: { branch: '寅', direction: 1 },
  己: { branch: '酉', direction: -1 },
  庚: { branch: '巳', direction: 1 },
  辛: { branch: '子', direction: -1 },
  壬: { branch: '申', direction: 1 },
  癸: { branch: '卯', direction: -1 }
};
const branchInteractionRules = [
  { type: '六合', pairs: ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'] },
  { type: '六冲', pairs: ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'] },
  { type: '六害', pairs: ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'] },
  { type: '相破', pairs: ['子酉', '丑辰', '寅亥', '卯午', '巳申', '未戌'] },
  { type: '相刑', pairs: ['寅巳', '巳申', '申寅', '丑戌', '戌未', '未丑', '子卯', '卯子'] }
];

const nayinPairs = [
  ['甲子', '乙丑', '海中金'], ['丙寅', '丁卯', '炉中火'], ['戊辰', '己巳', '大林木'],
  ['庚午', '辛未', '路旁土'], ['壬申', '癸酉', '剑锋金'], ['甲戌', '乙亥', '山头火'],
  ['丙子', '丁丑', '涧下水'], ['戊寅', '己卯', '城头土'], ['庚辰', '辛巳', '白蜡金'],
  ['壬午', '癸未', '杨柳木'], ['甲申', '乙酉', '泉中水'], ['丙戌', '丁亥', '屋上土'],
  ['戊子', '己丑', '霹雳火'], ['庚寅', '辛卯', '松柏木'], ['壬辰', '癸巳', '长流水'],
  ['甲午', '乙未', '沙中金'], ['丙申', '丁酉', '山下火'], ['戊戌', '己亥', '平地木'],
  ['庚子', '辛丑', '壁上土'], ['壬寅', '癸卯', '金箔金'], ['甲辰', '乙巳', '覆灯火'],
  ['丙午', '丁未', '天河水'], ['戊申', '己酉', '大驿土'], ['庚戌', '辛亥', '钗钏金'],
  ['壬子', '癸丑', '桑柘木'], ['甲寅', '乙卯', '大溪水'], ['丙辰', '丁巳', '沙中土'],
  ['戊午', '己未', '天上火'], ['庚申', '辛酉', '石榴木'], ['壬戌', '癸亥', '大海水']
];

const nayinMap = nayinPairs.reduce((map, [left, right, name]) => ({
  ...map,
  [left]: name,
  [right]: name
}), {});

const trigramMeta = {
  '111': { name: '乾', element: '金' },
  '110': { name: '兑', element: '金' },
  '101': { name: '离', element: '火' },
  '100': { name: '震', element: '木' },
  '011': { name: '巽', element: '木' },
  '010': { name: '坎', element: '水' },
  '001': { name: '艮', element: '土' },
  '000': { name: '坤', element: '土' }
};

const trigramOrder = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
const hexagramMatrix = {
  乾: { 乾: '乾为天', 兑: '泽天夬', 离: '火天大有', 震: '雷天大壮', 巽: '风天小畜', 坎: '水天需', 艮: '山天大畜', 坤: '地天泰' },
  兑: { 乾: '天泽履', 兑: '兑为泽', 离: '火泽睽', 震: '雷泽归妹', 巽: '风泽中孚', 坎: '水泽节', 艮: '山泽损', 坤: '地泽临' },
  离: { 乾: '天火同人', 兑: '泽火革', 离: '离为火', 震: '雷火丰', 巽: '风火家人', 坎: '水火既济', 艮: '山火贲', 坤: '地火明夷' },
  震: { 乾: '天雷无妄', 兑: '泽雷随', 离: '火雷噬嗑', 震: '震为雷', 巽: '风雷益', 坎: '水雷屯', 艮: '山雷颐', 坤: '地雷复' },
  巽: { 乾: '天风姤', 兑: '泽风大过', 离: '火风鼎', 震: '雷风恒', 巽: '巽为风', 坎: '水风井', 艮: '山风蛊', 坤: '地风升' },
  坎: { 乾: '天水讼', 兑: '泽水困', 离: '火水未济', 震: '雷水解', 巽: '风水涣', 坎: '坎为水', 艮: '山水蒙', 坤: '地水师' },
  艮: { 乾: '天山遁', 兑: '泽山咸', 离: '火山旅', 震: '雷山小过', 巽: '风山渐', 坎: '水山蹇', 艮: '艮为山', 坤: '地山谦' },
  坤: { 乾: '天地否', 兑: '泽地萃', 离: '火地晋', 震: '雷地豫', 巽: '风地观', 坎: '水地比', 艮: '山地剥', 坤: '坤为地' }
};
const kingWenOrder = [
  '乾为天', '坤为地', '水雷屯', '山水蒙', '水天需', '天水讼', '地水师', '水地比',
  '风天小畜', '天泽履', '地天泰', '天地否', '天火同人', '火天大有', '地山谦', '雷地豫',
  '泽雷随', '山风蛊', '地泽临', '风地观', '火雷噬嗑', '山火贲', '山地剥', '地雷复',
  '天雷无妄', '山天大畜', '山雷颐', '泽风大过', '坎为水', '离为火', '泽山咸', '雷风恒',
  '天山遁', '雷天大壮', '火地晋', '地火明夷', '风火家人', '火泽睽', '水山蹇', '雷水解',
  '山泽损', '风雷益', '泽天夬', '天风姤', '泽地萃', '地风升', '泽水困', '水风井',
  '泽火革', '火风鼎', '震为雷', '艮为山', '风山渐', '雷泽归妹', '雷火丰', '火山旅',
  '巽为风', '兑为泽', '风水涣', '水泽节', '风泽中孚', '雷山小过', '水火既济', '火水未济'
];
const hexagramDatabase = trigramOrder.flatMap((lowerName) => (
  trigramOrder.map((upperName) => {
    const name = hexagramMatrix[lowerName][upperName];
    return {
      key: `${upperName}-${lowerName}`,
      name,
      number: kingWenOrder.indexOf(name) + 1,
      upper: upperName,
      lower: lowerName
    };
  })
));
const hexagramDatabaseByTrigrams = hexagramDatabase.reduce((map, item) => {
  map[item.key] = item;
  return map;
}, {});
const trigramElementByName = Object.values(trigramMeta).reduce((map, item) => {
  map[item.name] = item.element;
  return map;
}, {});
const jingFangPalaces = {
  乾: ['乾为天', '天风姤', '天山遁', '天地否', '风地观', '山地剥', '火地晋', '火天大有'],
  坎: ['坎为水', '水泽节', '水雷屯', '水火既济', '泽火革', '雷火丰', '地火明夷', '地水师'],
  艮: ['艮为山', '山火贲', '山天大畜', '山泽损', '火泽睽', '天泽履', '风泽中孚', '风山渐'],
  震: ['震为雷', '雷地豫', '雷水解', '雷风恒', '地风升', '水风井', '泽风大过', '泽雷随'],
  巽: ['巽为风', '风天小畜', '风火家人', '风雷益', '天雷无妄', '火雷噬嗑', '山雷颐', '山风蛊'],
  离: ['离为火', '火山旅', '火风鼎', '火水未济', '山水蒙', '风水涣', '天水讼', '天火同人'],
  坤: ['坤为地', '地雷复', '地泽临', '地天泰', '雷天大壮', '泽天夬', '水天需', '水地比'],
  兑: ['兑为泽', '泽水困', '泽地萃', '泽山咸', '水山蹇', '地山谦', '雷山小过', '雷泽归妹']
};
const palaceSequenceNames = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'];
const hexagramPalaceMetaByName = Object.entries(jingFangPalaces).reduce((map, [palace, names]) => {
  names.forEach((name, index) => {
    const sequence = palaceSequenceNames[index];
    map[name] = {
      palace,
      sequence,
      palaceLabel: sequence === '游魂' || sequence === '归魂' ? `${palace}-${sequence}` : palace
    };
  });
  return map;
}, {});

function pickBySeed(list, seed) {
  return list[Math.abs(seed) % list.length];
}

function textSeed(text) {
  return String(text || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function stableHash(text) {
  return String(text || '').split('').reduce((hash, char) => (
    Math.imul(hash ^ char.charCodeAt(0), 16777619)
  ), 2166136261) >>> 0;
}

function mixedSeedValue(seed, index) {
  let value = (seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35) >>> 0;
  return (value ^ (value >>> 16)) >>> 0;
}

function parseBirthDateTime(dateText, timeText) {
  const [year, month, day] = String(dateText || '2000-01-01').split('-').map(Number);
  const [hour, minute] = String(timeText || '08:00').split(':').map(Number);
  return {
    year: year || 2000,
    month: month || 1,
    day: day || 1,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0
  };
}

function makeDate(parts) {
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
}

function formatDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeLongitude(value) {
  const longitude = Number(value);
  if (!Number.isFinite(longitude)) {
    return 116.4;
  }
  return Math.min(135, Math.max(73, longitude));
}

function equationOfTimeMinutes(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function applyTrueSolarTime(date, longitude, enabled) {
  if (!enabled) {
    return {
      date,
      correctionMinutes: 0,
      label: '未启用真太阳时校准，时柱按北京时间估算。'
    };
  }

  const correctionMinutes = Math.round((longitude - 120) * 4 + equationOfTimeMinutes(date));
  return {
    date: new Date(date.getTime() + correctionMinutes * 60000),
    correctionMinutes,
    label: `已按经度 ${longitude.toFixed(2)}°E 与均时差校准，约 ${correctionMinutes >= 0 ? '+' : ''}${correctionMinutes} 分钟。`
  };
}

function ganzhiFromIndex(index) {
  const normalized = ((index % 60) + 60) % 60;
  return {
    stem: heavenlyStems[normalized % 10],
    branch: earthlyBranches[normalized % 12],
    index: normalized,
    value: `${heavenlyStems[normalized % 10]}${earthlyBranches[normalized % 12]}`
  };
}

function getGanzhiIndex(stem, branch) {
  for (let i = 0; i < 60; i += 1) {
    const item = ganzhiFromIndex(i);
    if (item.stem === stem && item.branch === branch) return i;
  }
  return 0;
}

function getYearForPillar(date) {
  const lichun = findSolarTermTime(date.getFullYear(), jieTerms[0]);
  return date >= lichun ? date.getFullYear() : date.getFullYear() - 1;
}

function getYearPillar(date) {
  return ganzhiFromIndex(getYearForPillar(date) - 4);
}

function getYearPillarByYear(year) {
  return ganzhiFromIndex(year - 4);
}

function getMonthPillar(date, yearStemIndex) {
  const term = getActiveJie(date);
  const stemIndex = ((yearStemIndex % 5) * 2 + 2 + term.index) % 10;
  const branchIndex = (2 + term.index) % 12;
  const stem = heavenlyStems[stemIndex];
  const branch = earthlyBranches[branchIndex];
  return {
    stem,
    branch,
    value: `${stem}${branch}`,
    term: term.key,
    termTime: formatDateTime(term.date),
    index: getGanzhiIndex(stem, branch),
    monthIndex: term.index
  };
}

function getJulianDayNumber(parts) {
  const a = Math.floor((14 - parts.month) / 12);
  const y = parts.year + 4800 - a;
  const m = parts.month + 12 * a - 3;
  return parts.day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getDayPillar(date) {
  const parts = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
  return ganzhiFromIndex(getJulianDayNumber(parts) + 49);
}

function getHourPillarByBranch(dayStemIndex, branchIndex) {
  const stemIndex = ((dayStemIndex % 5) * 2 + branchIndex) % 10;
  const stem = heavenlyStems[stemIndex];
  const branch = earthlyBranches[branchIndex];
  return {
    stem,
    branch,
    value: `${stem}${branch}`,
    index: getGanzhiIndex(stem, branch)
  };
}

function getHourPillar(date, dayStemIndex) {
  const branchIndex = Math.floor((date.getHours() + 1) / 2) % 12;
  return getHourPillarByBranch(dayStemIndex, branchIndex);
}

function getTenGod(dayStem, targetStem) {
  const day = stemMeta[dayStem];
  const target = stemMeta[targetStem];
  if (!day || !target) return '参考';

  const samePolarity = day.yinYang === target.yinYang;
  const dayIndex = elementFlow.indexOf(day.element);
  const targetIndex = elementFlow.indexOf(target.element);

  if (day.element === target.element) return samePolarity ? '比肩' : '劫财';
  if ((dayIndex + 1) % 5 === targetIndex) return samePolarity ? '食神' : '伤官';
  if ((targetIndex + 1) % 5 === dayIndex) return samePolarity ? '偏印' : '正印';
  if ((dayIndex + 2) % 5 === targetIndex) return samePolarity ? '偏财' : '正财';
  return samePolarity ? '七杀' : '正官';
}

function getSixRelation(baseElement, targetElement) {
  if (baseElement === targetElement) return '兄弟';
  if (elementGenerates[targetElement] === baseElement) return '父母';
  if (elementGenerates[baseElement] === targetElement) return '子孙';
  if (elementControls[baseElement] === targetElement) return '妻财';
  return '官鬼';
}

function getElementForSixRelation(baseElement, relation) {
  if (relation === '兄弟') return baseElement;
  if (relation === '父母') {
    return Object.entries(elementGenerates).find(([, target]) => target === baseElement)?.[0] || baseElement;
  }
  if (relation === '子孙') return elementGenerates[baseElement] || baseElement;
  if (relation === '妻财') return elementControls[baseElement] || baseElement;
  return elementControlledBy[baseElement] || baseElement;
}

function getBranchByElement(element, seed = 0) {
  const candidates = earthlyBranches.filter((branch) => branchElements[branch] === element);
  return candidates[Math.abs(seed) % candidates.length] || earthlyBranches[0];
}

function addElementScore(scores, stem, value) {
  scores[stemMeta[stem].element] += value;
}

function buildElementDistribution(pillars, dayStem) {
  const scores = elements.reduce((map, item) => ({ ...map, [item]: 0 }), {});

  pillars.forEach((pillar) => {
    addElementScore(scores, pillar.stem, 8);
    hiddenStemsByBranch[pillar.branch].forEach((hidden) => {
      addElementScore(scores, hidden.stem, hidden.weight);
    });
  });

  const monthMainStem = hiddenStemsByBranch[pillars[1].branch][0].stem;
  addElementScore(scores, monthMainStem, 12);
  addElementScore(scores, dayStem, 6);

  const total = elements.reduce((sum, item) => sum + scores[item], 0);
  const raw = elements.map((name) => ({
    name,
    score: scores[name],
    percent: Math.round((scores[name] / total) * 100)
  }));
  const delta = 100 - raw.reduce((sum, item) => sum + item.percent, 0);
  raw[0].percent += delta;
  return raw;
}

function enrichPillar(label, pillar, dayStem) {
  const hidden = hiddenStemsByBranch[pillar.branch].map((item) => ({
    stem: item.stem,
    tenGod: getTenGod(dayStem, item.stem),
    element: stemMeta[item.stem].element
  }));
  return {
    label,
    value: pillar.value,
    stem: pillar.stem,
    branch: pillar.branch,
    stemTenGod: label === '日柱' ? '日主' : getTenGod(dayStem, pillar.stem),
    hiddenStems: hidden,
    hiddenStemText: hidden.map((item) => `${item.stem}${item.tenGod}`).join(' / '),
    element: `${stemMeta[pillar.stem].element} / ${branchElements[pillar.branch]}`
  };
}

function getNayin(value) {
  return nayinMap[value] || '待校验';
}

function findStrongestElement(distribution) {
  return distribution.reduce((max, item) => (item.score > max.score ? item : max), distribution[0]);
}

function findWeakestElement(distribution) {
  return distribution.reduce((min, item) => (item.score < min.score ? item : min), distribution[0]);
}

function getProsperityStage(dayStem, branch) {
  const start = growthStart[dayStem];
  if (!start) return '参考';
  const startIndex = earthlyBranches.indexOf(start.branch);
  const branchIndex = earthlyBranches.indexOf(branch);
  const offset = start.direction > 0
    ? (branchIndex - startIndex + 12) % 12
    : (startIndex - branchIndex + 12) % 12;
  return growthStages[offset];
}

function buildGrowthProfile(dayStem, pillars) {
  return pillars.map((pillar) => ({
    label: pillar.label,
    branch: pillar.branch,
    stage: getProsperityStage(dayStem, pillar.branch),
    basis: `${dayStem}日主临${pillar.branch}支`
  }));
}

function getBranchInteractionType(left, right) {
  for (let i = 0; i < branchInteractionRules.length; i += 1) {
    const rule = branchInteractionRules[i];
    const matched = rule.pairs.some((pair) => pair === `${left}${right}` || pair === `${right}${left}`);
    if (matched) return rule.type;
  }
  if (left === right) return '伏吟';
  return '';
}

function buildNatalRelations(pillars) {
  const relationsFound = [];
  for (let i = 0; i < pillars.length; i += 1) {
    for (let j = i + 1; j < pillars.length; j += 1) {
      const type = getBranchInteractionType(pillars[i].branch, pillars[j].branch);
      if (type) {
        relationsFound.push({
          pair: `${pillars[i].label}-${pillars[j].label}`,
          branches: `${pillars[i].branch}${pillars[j].branch}`,
          type,
          basis: `${pillars[i].branch}与${pillars[j].branch}${type}`
        });
      }
    }
  }
  return relationsFound.length ? relationsFound : [{ pair: '四柱地支', branches: '-', type: '平', basis: '未见明显六合、六冲、六害、刑破或伏吟。' }];
}

function buildStrengthProfile(dayMaster, distribution, monthPillar, pillars) {
  const dayElement = dayMaster.element;
  const resourceElement = elementFlow[(elementFlow.indexOf(dayElement) + 4) % 5];
  const outputElement = elementGenerates[dayElement];
  const wealthElement = elementControls[dayElement];
  const officerElement = elementControlledBy[dayElement];
  const selfScore = distribution.find((item) => item.name === dayElement).score;
  const resourceScore = distribution.find((item) => item.name === resourceElement).score;
  const outputScore = distribution.find((item) => item.name === outputElement).score;
  const wealthScore = distribution.find((item) => item.name === wealthElement).score;
  const officerScore = distribution.find((item) => item.name === officerElement).score;
  const support = selfScore + resourceScore + (branchElements[monthPillar.branch] === dayElement ? 12 : 0);
  const pressure = outputScore + wealthScore + officerScore;
  const ratio = Math.round((support / Math.max(1, support + pressure)) * 100);
  const status = ratio >= 60 ? '偏旺' : (ratio <= 42 ? '偏弱' : '中和');
  const monthStage = getProsperityStage(dayMaster.stem, monthPillar.branch);

  return {
    status,
    ratio,
    support,
    pressure,
    monthStage,
    basis: [
      `日主五行为${dayElement}，同类${dayElement}分与印星${resourceElement}分合计为扶身基础。`,
      `月令${monthPillar.branch}${branchElements[monthPillar.branch]}，日主十二长生临${monthStage}。`,
      `四柱中${pillars.map((item) => `${item.label}${item.value}`).join('、')}共同参与旺衰判断。`
    ]
  };
}

function buildPatternProfile(dayStem, monthPillar) {
  const mainStem = hiddenStemsByBranch[monthPillar.branch][0].stem;
  const tenGod = getTenGod(dayStem, mainStem);
  const patternName = `${tenGod}格`;
  return {
    name: patternName,
    monthCommand: `${monthPillar.branch}月`,
    mainQi: `${mainStem}${stemMeta[mainStem].element}`,
    tenGod,
    basis: `以月令${monthPillar.branch}支主气${mainStem}为纲，主气相对日主为${tenGod}，故作${patternName}观察。`
  };
}

function buildUsefulGodProfile(strength, dayMaster) {
  const dayElement = dayMaster.element;
  const resourceElement = elementFlow[(elementFlow.indexOf(dayElement) + 4) % 5];
  const outputElement = elementGenerates[dayElement];
  const wealthElement = elementControls[dayElement];
  const officerElement = elementControlledBy[dayElement];
  const strongUseful = [outputElement, wealthElement, officerElement];
  const weakUseful = [resourceElement, dayElement];
  const useful = strength.status === '偏弱' ? weakUseful : strongUseful;
  const avoid = strength.status === '偏弱' ? [outputElement, wealthElement, officerElement] : [resourceElement, dayElement];
  const usefulUnique = Array.from(new Set(useful));
  const avoidUnique = Array.from(new Set(avoid));

  return {
    useful: usefulUnique,
    avoid: avoidUnique,
    usefulText: usefulUnique.join('、'),
    avoidText: avoidUnique.join('、'),
    basis: strength.status === '偏弱'
      ? `日主${strength.status}，先取印比扶身，观察${resourceElement}、${dayElement}是否成力。`
      : `日主${strength.status}，先取泄耗制化，观察${outputElement}、${wealthElement}、${officerElement}是否能平衡盘面。`
  };
}

function getBranchGroup(branch) {
  if (['申', '子', '辰'].includes(branch)) return '申子辰';
  if (['寅', '午', '戌'].includes(branch)) return '寅午戌';
  if (['巳', '酉', '丑'].includes(branch)) return '巳酉丑';
  return '亥卯未';
}

function buildSpiritProfile(dayStem, yearBranch, dayBranch, pillars) {
  const branches = pillars.map((item) => item.branch);
  const group = getBranchGroup(dayBranch);
  const yearBranchIndex = earthlyBranches.indexOf(yearBranch);
  const dayBranchIndex = earthlyBranches.indexOf(dayBranch);
  const branchAt = (baseIndex, offset) => earthlyBranches[(baseIndex + offset + 120) % 12];
  const peachMap = { 申子辰: '酉', 寅午戌: '卯', 巳酉丑: '午', 亥卯未: '子' };
  const horseMap = { 申子辰: '寅', 寅午戌: '申', 巳酉丑: '亥', 亥卯未: '巳' };
  const canopyMap = { 申子辰: '辰', 寅午戌: '戌', 巳酉丑: '丑', 亥卯未: '未' };
  const robberyMap = { 申子辰: '巳', 寅午戌: '亥', 巳酉丑: '寅', 亥卯未: '申' };
  const disasterMap = { 申子辰: '午', 寅午戌: '子', 巳酉丑: '卯', 亥卯未: '酉' };
  const funeralMap = { 申子辰: '未', 寅午戌: '丑', 巳酉丑: '辰', 亥卯未: '戌' };
  const deathMap = { 申子辰: '巳', 寅午戌: '亥', 巳酉丑: '申', 亥卯未: '寅' };
  const nobleMap = {
    甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
    乙: ['子', '申'], 己: ['子', '申'],
    丙: ['亥', '酉'], 丁: ['亥', '酉'],
    壬: ['卯', '巳'], 癸: ['卯', '巳'],
    辛: ['午', '寅']
  };
  const wenchangMap = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
  const taijiMap = { 甲: ['子', '午'], 乙: ['子', '午'], 丙: ['卯', '酉'], 丁: ['卯', '酉'], 戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'], 庚: ['寅', '亥'], 辛: ['寅', '亥'], 壬: ['巳', '申'], 癸: ['巳', '申'] };
  const fuxingMap = { 甲: '寅', 乙: '丑', 丙: '子', 丁: '亥', 戊: '申', 己: '未', 庚: '午', 辛: '巳', 壬: '辰', 癸: '卯' };
  const guoyinMap = { 甲: '戌', 乙: '亥', 丙: '丑', 丁: '寅', 戊: '丑', 己: '寅', 庚: '辰', 辛: '巳', 壬: '未', 癸: '申' };
  const xueTangMap = { 甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅', 己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯' };
  const tianchuMap = { 甲: '巳', 乙: '午', 丙: '巳', 丁: '午', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
  const tianxiMap = { 子: '酉', 丑: '申', 寅: '未', 卯: '午', 辰: '巳', 巳: '辰', 午: '卯', 未: '寅', 申: '丑', 酉: '子', 戌: '亥', 亥: '戌' };
  const hongluanMap = { 子: '卯', 丑: '寅', 寅: '丑', 卯: '子', 辰: '亥', 巳: '戌', 午: '酉', 未: '申', 申: '未', 酉: '午', 戌: '巳', 亥: '辰' };
  const tiandeMap = { 甲: '巳', 乙: '申', 丙: '亥', 丁: '寅', 戊: '巳', 己: '申', 庚: '亥', 辛: '寅', 壬: '巳', 癸: '申' };
  const yuedeMap = { 甲: '寅', 乙: '巳', 丙: '申', 丁: '亥', 戊: '寅', 己: '巳', 庚: '申', 辛: '亥', 壬: '寅', 癸: '巳' };
  const lurenMap = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
  const yangrenMap = { 甲: '卯', 乙: '寅', 丙: '午', 丁: '巳', 戊: '午', 己: '巳', 庚: '酉', 辛: '申', 壬: '子', 癸: '亥' };
  const jinyuMap = { 甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' };
  const hongyanMap = { 甲: '午', 乙: '申', 丙: '寅', 丁: '未', 戊: '辰', 己: '辰', 庚: '戌', 辛: '酉', 壬: '子', 癸: '申' };
  const liuxiaMap = { 甲: '酉', 乙: '戌', 丙: '未', 丁: '申', 戊: '巳', 己: '午', 庚: '辰', 辛: '卯', 壬: '亥', 癸: '寅' };
  const ciGuanMap = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
  const deXiuMap = { 甲: '丑', 乙: '寅', 丙: '辰', 丁: '巳', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' };
  const tianguanMap = { 甲: '未', 乙: '辰', 丙: '巳', 丁: '寅', 戊: '卯', 己: '酉', 庚: '亥', 辛: '申', 壬: '酉', 癸: '午' };
  const tianfuMap = { 甲: '酉', 乙: '申', 丙: '子', 丁: '亥', 戊: '卯', 己: '寅', 庚: '午', 辛: '巳', 壬: '午', 癸: '巳' };
  const tianyinMap = { 甲: '子', 乙: '亥', 丙: '卯', 丁: '寅', 戊: '午', 己: '巳', 庚: '酉', 辛: '申', 壬: '子', 癸: '亥' };
  const guChenMap = { 子: '寅', 丑: '寅', 寅: '巳', 卯: '巳', 辰: '巳', 巳: '申', 午: '申', 未: '申', 申: '亥', 酉: '亥', 戌: '亥', 亥: '寅' };
  const guaSuMap = { 子: '戌', 丑: '戌', 寅: '丑', 卯: '丑', 辰: '丑', 巳: '辰', 午: '辰', 未: '辰', 申: '未', 酉: '未', 戌: '未', 亥: '戌' };
  const yuanChenMap = { 子: '未', 丑: '申', 寅: '酉', 卯: '戌', 辰: '亥', 巳: '子', 午: '丑', 未: '寅', 申: '卯', 酉: '辰', 戌: '巳', 亥: '午' };
  const gouJiaoMap = { 子: ['卯', '酉'], 丑: ['辰', '戌'], 寅: ['巳', '亥'], 卯: ['午', '子'], 辰: ['未', '丑'], 巳: ['申', '寅'], 午: ['酉', '卯'], 未: ['戌', '辰'], 申: ['亥', '巳'], 酉: ['子', '午'], 戌: ['丑', '未'], 亥: ['寅', '申'] };
  const checks = [
    { name: '桃花', branch: peachMap[group], basis: `以日支${dayBranch}所属${group}局取桃花。`, category: '情缘' },
    { name: '咸池', branch: peachMap[group], basis: `咸池同桃花，以日支${dayBranch}三合局取。`, category: '情缘' },
    { name: '驿马', branch: horseMap[group], basis: `以日支${dayBranch}所属${group}局取驿马。`, category: '行移' },
    { name: '华盖', branch: canopyMap[group], basis: `以日支${dayBranch}所属${group}局取华盖。`, category: '才艺' },
    { name: '将星', branch: group === '申子辰' ? '子' : (group === '寅午戌' ? '午' : (group === '巳酉丑' ? '酉' : '卯')), basis: `以日支${dayBranch}三合局取将星。`, category: '权柄' },
    { name: '亡神', branch: deathMap[group], basis: `以日支${dayBranch}三合局取亡神。`, category: '杂曜' },
    { name: '劫煞', branch: robberyMap[group], basis: `以日支${dayBranch}所属${group}局取劫煞。`, category: '刑耗' },
    { name: '灾煞', branch: disasterMap[group], basis: `以日支${dayBranch}所属${group}局取灾煞。`, category: '刑耗' },
    { name: '丧门', branch: funeralMap[group], basis: `以日支${dayBranch}所属${group}局取丧门。`, category: '慎忌' },
    { name: '孤辰', branch: guChenMap[yearBranch], basis: `以年支${yearBranch}取孤辰。`, category: '孤曜' },
    { name: '寡宿', branch: guaSuMap[yearBranch], basis: `以年支${yearBranch}取寡宿。`, category: '孤曜' },
    { name: '元辰', branch: yuanChenMap[yearBranch], basis: `以年支${yearBranch}取元辰。`, category: '杂曜' },
    { name: '文昌贵人', branch: wenchangMap[dayStem], basis: `以日干${dayStem}取文昌贵人。`, category: '文教' },
    { name: '词馆', branch: ciGuanMap[dayStem], basis: `以日干${dayStem}取词馆。`, category: '文教' },
    { name: '学堂', branch: xueTangMap[dayStem], basis: `以日干${dayStem}取学堂。`, category: '文教' },
    { name: '德秀贵人', branch: deXiuMap[dayStem], basis: `以日干${dayStem}取德秀贵人。`, category: '贵人' },
    { name: '福星贵人', branch: fuxingMap[dayStem], basis: `以日干${dayStem}取福星贵人。`, category: '贵人' },
    { name: '国印贵人', branch: guoyinMap[dayStem], basis: `以日干${dayStem}取国印贵人。`, category: '贵人' },
    { name: '天厨贵人', branch: tianchuMap[dayStem], basis: `以日干${dayStem}取天厨贵人。`, category: '贵人' },
    { name: '天官贵人', branch: tianguanMap[dayStem], basis: `以日干${dayStem}取天官贵人。`, category: '贵人' },
    { name: '天福贵人', branch: tianfuMap[dayStem], basis: `以日干${dayStem}取天福贵人。`, category: '贵人' },
    { name: '天印贵人', branch: tianyinMap[dayStem], basis: `以日干${dayStem}取天印贵人。`, category: '贵人' },
    { name: '禄神', branch: lurenMap[dayStem], basis: `以日干${dayStem}取禄神。`, category: '禄曜' },
    { name: '羊刃', branch: yangrenMap[dayStem], basis: `以日干${dayStem}取羊刃。`, category: '刃曜' },
    { name: '金舆', branch: jinyuMap[dayStem], basis: `以日干${dayStem}取金舆。`, category: '贵人' },
    { name: '红艳煞', branch: hongyanMap[dayStem], basis: `以日干${dayStem}取红艳煞。`, category: '情缘' },
    { name: '流霞', branch: liuxiaMap[dayStem], basis: `以日干${dayStem}取流霞。`, category: '慎忌' },
    { name: '飞刃', branch: branchAt(dayBranchIndex, 6), basis: `以日支${dayBranch}对冲取飞刃参考。`, category: '刃曜' },
    { name: '血刃', branch: branchAt(dayBranchIndex, 3), basis: `以日支${dayBranch}顺取血刃参考。`, category: '慎忌' },
    { name: '破碎', branch: branchAt(dayBranchIndex, 7), basis: `以日支${dayBranch}取破碎参考。`, category: '刑耗' },
    { name: '隔角', branch: branchAt(dayBranchIndex, 4), basis: `以日支${dayBranch}取隔角参考。`, category: '杂曜' },
    { name: '天喜', branch: tianxiMap[yearBranch], basis: `以年支${yearBranch}取天喜。`, category: '喜庆' },
    { name: '红鸾', branch: hongluanMap[yearBranch], basis: `以年支${yearBranch}取红鸾。`, category: '情缘' },
    { name: '吊客', branch: branchAt(yearBranchIndex, 2), basis: `以年支${yearBranch}顺二位取吊客参考。`, category: '慎忌' },
    { name: '披麻', branch: branchAt(yearBranchIndex, 3), basis: `以年支${yearBranch}顺三位取披麻参考。`, category: '慎忌' },
    { name: '白虎', branch: branchAt(yearBranchIndex, 4), basis: `以年支${yearBranch}顺四位取白虎参考。`, category: '慎忌' },
    { name: '小耗', branch: branchAt(yearBranchIndex, 5), basis: `以年支${yearBranch}顺五位取小耗参考。`, category: '耗曜' },
    { name: '岁破', branch: branchAt(yearBranchIndex, 6), basis: `以年支${yearBranch}对冲取岁破。`, category: '岁曜' },
    { name: '大耗', branch: branchAt(yearBranchIndex, 7), basis: `以年支${yearBranch}顺七位取大耗参考。`, category: '耗曜' },
    { name: '病符', branch: branchAt(yearBranchIndex, 1), basis: `以年支${yearBranch}顺一位取病符参考。`, category: '慎忌' },
    { name: '死符', branch: branchAt(yearBranchIndex, 8), basis: `以年支${yearBranch}顺八位取死符参考。`, category: '慎忌' },
    { name: '天医', branch: branchAt(yearBranchIndex, 10), basis: `以年支${yearBranch}逆二位取天医参考。`, category: '调养' },
    { name: '月德合', branch: yuedeMap[dayStem], basis: `以日干${dayStem}取月德合参考。`, category: '德曜' },
    { name: '天德合', branch: tiandeMap[dayStem], basis: `以日干${dayStem}取天德合参考。`, category: '德曜' },
    { name: '天罗', branch: '戌', basis: '四柱见戌作天罗参考。', category: '网罗' },
    { name: '地网', branch: '辰', basis: '四柱见辰作地网参考。', category: '网罗' },
    { name: '埋儿煞', branch: branchAt(dayBranchIndex, 5), basis: `以日支${dayBranch}顺五位取埋儿煞参考。`, category: '慎忌' },
    { name: '宅墓煞', branch: branchAt(dayBranchIndex, 8), basis: `以日支${dayBranch}顺八位取宅墓煞参考。`, category: '杂曜' }
  ];
  (gouJiaoMap[yearBranch] || []).forEach((branch, index) => {
    checks.push({ name: index === 0 ? '勾煞' : '绞煞', branch, basis: `以年支${yearBranch}取勾绞煞。`, category: '刑耗' });
  });
  (taijiMap[dayStem] || []).forEach((branch) => {
    checks.push({ name: '太极贵人', branch, basis: `以日干${dayStem}取太极贵人。`, category: '贵人' });
  });
  const nobleBranches = nobleMap[dayStem] || [];
  nobleBranches.forEach((branch) => {
    checks.push({ name: '天乙贵人', branch, basis: `以日干${dayStem}取天乙贵人。`, category: '贵人' });
  });
  const valueChecks = [
    { name: '魁罡', values: ['庚辰', '庚戌', '壬辰', '戊戌'], basis: '四柱见庚辰、庚戌、壬辰、戊戌取魁罡。', category: '特殊格曜' },
    { name: '阴差阳错', values: ['丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳', '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥'], basis: '四柱见阴差阳错日组取用。', category: '婚缘' },
    { name: '十恶大败', values: ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'], basis: '四柱见十恶大败日组取用。', category: '慎忌' },
    { name: '孤鸾', values: ['乙巳', '丁巳', '辛亥', '戊申', '甲寅', '戊午', '壬子', '丙午'], basis: '四柱见孤鸾日组取用。', category: '婚缘' },
    { name: '天赦', values: ['戊寅', '甲午', '戊申', '甲子'], basis: '四柱见天赦日组取用。', category: '德曜' },
    { name: '三奇贵人', values: ['甲戊庚', '乙丙丁', '壬癸辛'], basis: '四柱天干成甲戊庚、乙丙丁、壬癸辛顺布作三奇贵人参考。', category: '贵人', stemCombo: true },
    { name: '童子煞', values: ['春秋寅子', '冬夏卯未', '金木午卯', '水火酉戌', '土命辰巳'], basis: '按季令、纳音与日时支综合取童子煞，测试版作提示库保留。', category: '慎忌', advisoryOnly: true }
  ];

  const branchResults = checks.filter((item) => item.branch).map((item, index) => ({
    key: `${item.name}-${item.branch}-${index}`,
    ...item,
    hit: branches.includes(item.branch) || yearBranch === item.branch,
    location: pillars.filter((pillar) => pillar.branch === item.branch).map((pillar) => pillar.label).join('、') || '未入四柱'
  }));
  const stems = pillars.map((item) => item.stem).join('');
  const valueResults = valueChecks.map((item, index) => {
    const matched = item.stemCombo
      ? (item.values.some((combo) => combo.split('').every((stem) => stems.includes(stem))) ? pillars : [])
      : (item.advisoryOnly ? [] : pillars.filter((pillar) => item.values.includes(pillar.value)));
    return {
      key: `${item.name}-value-${index}`,
      name: item.name,
      branch: matched[0] ? matched[0].branch : '',
      basis: item.basis,
      category: item.category,
      hit: matched.length > 0,
      location: matched.map((pillar) => pillar.label).join('、') || '未入四柱',
      values: item.values
    };
  });
  const spiritMap = {};
  [...branchResults, ...valueResults].forEach((item) => {
    const uniqueKey = `${item.name}-${item.branch}-${item.location}`;
    if (!spiritMap[uniqueKey]) spiritMap[uniqueKey] = item;
  });
  return Object.keys(spiritMap).map((key) => spiritMap[key]);
}

function buildProfessionalProfile(dayMaster, rawPillars, pillars, monthPillar, distribution) {
  const strength = buildStrengthProfile(dayMaster, distribution, monthPillar, pillars);
  const pattern = buildPatternProfile(dayMaster.stem, monthPillar);
  const usefulGod = buildUsefulGodProfile(strength, dayMaster);
  return {
    strength,
    pattern,
    usefulGod,
    natalRelations: buildNatalRelations(pillars),
    growthStages: buildGrowthProfile(dayMaster.stem, pillars),
    spirits: buildSpiritProfile(dayMaster.stem, rawPillars[0].branch, rawPillars[2].branch, pillars)
  };
}

function describeBranchInteraction(branch, natalBranches) {
  const clashPairs = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  const combinePairs = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
  const matches = [];
  natalBranches.forEach((item) => {
    const pair = `${branch}${item}`;
    const reverse = `${item}${branch}`;
    if (clashPairs.includes(pair) || clashPairs.includes(reverse)) matches.push(`冲${item}`);
    if (combinePairs.includes(pair) || combinePairs.includes(reverse)) matches.push(`合${item}`);
    if (branch === item) matches.push(`伏吟${item}`);
  });
  return matches.length ? matches.join('、') : '平';
}

function getElementRole(dayElement, targetElement) {
  if (dayElement === targetElement) return { name: '比劫', tendency: '扶身', tone: '助' };
  if (elementGenerates[targetElement] === dayElement) return { name: '印星', tendency: '生扶日主', tone: '助' };
  if (elementGenerates[dayElement] === targetElement) return { name: '食伤', tendency: '泄秀输出', tone: '泄' };
  if (elementControls[dayElement] === targetElement) return { name: '财星', tendency: '耗身取财', tone: '耗' };
  return { name: '官杀', tendency: '克身成压', tone: '压' };
}

function getBranchInteractionPriority(type, targetLabel) {
  const typeScore = { 六冲: 5, 相刑: 4, 六害: 3, 相破: 3, 六合: 2, 伏吟: 2 };
  const labelScore = { 月柱: 2, 日柱: 2, 年柱: 1, 时柱: 1 };
  return (typeScore[type] || 1) + (labelScore[targetLabel] || 0);
}

function buildFlowInteractions(branch, natalPillars) {
  return natalPillars
    .map((pillar) => {
      const type = getBranchInteractionType(branch, pillar.branch);
      if (!type) return null;
      return {
        target: pillar.label,
        targetBranch: pillar.branch,
        type,
        priority: getBranchInteractionPriority(type, pillar.label),
        text: `流支${branch}与原局${pillar.label}${pillar.branch}${type}`
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.priority - a.priority);
}

function summarizeFlowInfluence(dayStem, stem, branch) {
  const dayElement = stemMeta[dayStem].element;
  const stemElement = stemMeta[stem].element;
  const branchElement = branchElements[branch];
  const stemRole = getElementRole(dayElement, stemElement);
  const branchRole = getElementRole(dayElement, branchElement);
  const tenGod = getTenGod(dayStem, stem);
  const tones = [stemRole.tone, branchRole.tone];
  const tendency = tones.every((item) => item === '助')
    ? '偏向补身与承接资源'
    : (tones.includes('压') ? '容易带来规则、责任或压力议题' : (tones.includes('耗') ? '偏向资源投入、财务消耗或现实交换' : '偏向表达、输出与消耗精力'));

  return {
    stemElement,
    branchElement,
    tenGod,
    stemRole: stemRole.name,
    branchRole: branchRole.name,
    tendency,
    text: `天干${stem}${stemElement}为${tenGod}，地支${branch}${branchElement}属${branchRole.name}，${tendency}。`
  };
}

function buildFlowContext(pillar, dayStem, natalPillars, scope) {
  const influence = summarizeFlowInfluence(dayStem, pillar.stem, pillar.branch);
  const interactions = buildFlowInteractions(pillar.branch, natalPillars);
  const interactionSummary = interactions.length
    ? interactions.map((item) => `${item.target}${item.targetBranch}${item.type}`).join('、')
    : '与原局地支未见明显合冲刑害';
  const triggerPoints = interactions.filter((item) => item.priority >= 5).map((item) => ({
    scope,
    target: item.target,
    type: item.type,
    priority: item.priority,
    text: `${scope}${pillar.value}触发${item.target}${item.targetBranch}${item.type}，宜结合具体事项复盘，不作绝对断定。`
  }));

  return {
    tenGod: influence.tenGod,
    stemElement: influence.stemElement,
    branchElement: influence.branchElement,
    stemRole: influence.stemRole,
    branchRole: influence.branchRole,
    influence,
    influenceSummary: influence.text,
    interactions,
    interactionSummary,
    interaction: interactionSummary,
    triggerPoints,
    note: `${scope}${pillar.value}：${influence.text}${interactionSummary === '与原局地支未见明显合冲刑害' ? interactionSummary : `地支重点看${interactionSummary}`}。`
  };
}

function buildChartSummary(dayMaster, monthPillar, distribution, strength, pattern, usefulGod, natalRelations) {
  const strongest = findStrongestElement(distribution);
  const weakest = findWeakestElement(distribution);
  const relationText = natalRelations.filter((item) => item.type !== '平').map((item) => `${item.pair}${item.type}`).join('、') || '原局地支较平';
  return {
    oneLine: `日主${dayMaster.text}，月令${monthPillar.branch}${branchElements[monthPillar.branch]}，暂按${pattern.name}与${strength.status}观察，喜用参考${usefulGod.usefulText}。`,
    tags: [pattern.name, strength.status, `强项${strongest.name}`, `弱项${weakest.name}`],
    highlights: [
      `五行权重最高为${strongest.name}${strongest.percent}%，最低为${weakest.name}${weakest.percent}%，用于提示盘面偏性。`,
      `月令主气定格为${pattern.tenGod}，旺衰扶身比例约${strength.ratio}%，适合做趋势观察而非绝对判断。`,
      `原局关系：${relationText}。`
    ],
    caution: '以上为传统文化排盘摘要，需结合真实经历、地域历法校验与具体问题交叉验证。'
  };
}

function buildCalibrationHints(baseDate, readingDate, trueSolar, monthPillar, hourChanged, form) {
  const hints = [
    {
      level: trueSolar.correctionMinutes === 0 ? 'info' : 'check',
      title: '真太阳时校验',
      text: `${trueSolar.label}${hourChanged ? '已跨时辰边界，时柱采用校准后时间。' : '未跨时辰边界，时柱相对稳定。'}`
    },
    {
      level: 'check',
      title: '节气边界校验',
      text: `月柱以${monthPillar.term}节令后计${monthPillar.branch}月，节气时刻为${monthPillar.termTime}；临近节气出生建议服务端复核。`
    },
    {
      level: form.birthPlace ? 'info' : 'warn',
      title: '出生地信息',
      text: form.birthPlace ? `出生地记录为${form.birthPlace}，经度用于校准为${normalizeLongitude(form.longitude).toFixed(2)}°E。` : '出生地未填写，当前仅按经度字段做估算。'
    },
    {
      level: baseDate.getDate() !== readingDate.getDate() ? 'warn' : 'info',
      title: '跨日提示',
      text: baseDate.getDate() !== readingDate.getDate() ? '真太阳时校准后跨日，日柱与时柱均应重点复核。' : '真太阳时校准后未跨日。'
    }
  ];
  return hints;
}

function buildFlowTriggerSummary(flowYears, flowMonths, flowDays, flowHours) {
  const collect = (items, label) => items.flatMap((item) => (item.triggerPoints || []).map((point) => ({
    ...point,
    label,
    value: item.value,
    display: item.year || item.label || item.date || item.timeRange
  })));
  const triggers = [
    ...collect(flowYears, '流年'),
    ...collect(flowMonths, '流月'),
    ...collect(flowDays, '流日'),
    ...collect(flowHours, '流时')
  ].sort((a, b) => b.priority - a.priority).slice(0, 8);
  return {
    items: triggers,
    topItems: triggers.slice(0, 3),
    moreCount: Math.max(0, triggers.length - 3),
    summary: triggers.length
      ? triggers.map((item) => `${item.label}${item.display}${item.type}${item.target}`).join('、')
      : '近期流运未见高优先级合冲刑害触发点，仍需结合十神与五行气势观察。',
    topSummary: triggers.length
      ? triggers.slice(0, 3).map((item) => `${item.label}${item.display}${item.type}${item.target}`).join('、')
      : '近期未见高优先级触发点',
    note: '触发点只提示需要复盘的时间窗口，不代表事件必然发生。'
  };
}

function buildPalaceProfile(monthPillar, hourPillar) {
  const monthOffset = Number.isFinite(monthPillar.monthIndex) ? monthPillar.monthIndex : 0;
  const hourBranchIndex = Math.max(0, earthlyBranches.indexOf(hourPillar.branch));
  const lifeAnchor = (2 - monthOffset + 12) % 12;
  const bodyAnchor = (2 + monthOffset) % 12;
  const lifeBranch = earthlyBranches[(lifeAnchor + hourBranchIndex) % 12];
  const bodyBranch = earthlyBranches[(bodyAnchor + hourBranchIndex) % 12];

  return {
    life: {
      label: '命宫',
      value: `${lifeBranch}宫`,
      branch: lifeBranch,
      basis: '寅宫起正月，逆数至生月，再从该宫起子时顺数至生时。测试版先作细盘参考。'
    },
    body: {
      label: '身宫',
      value: `${bodyBranch}宫`,
      branch: bodyBranch,
      basis: '寅宫起正月，顺数至生月，再从该宫起子时顺数至生时。流派口径较多，当前按内测口径提示。'
    },
    betaNote: '命宫、身宫目前用于辅助观察性情落点与行动侧重，正式版需继续做流派口径校验。'
  };
}

function buildDetailProfile(pillars, dayPillar, monthPillar, hourPillar, dayMaster, professional) {
  const voidBranches = getVoidBranches(dayPillar.index);
  const monthStemIndex = heavenlyStems.indexOf(monthPillar.stem);
  const monthBranchIndex = earthlyBranches.indexOf(monthPillar.branch);
  const fetalStem = heavenlyStems[(monthStemIndex + 1) % 10];
  const fetalBranch = earthlyBranches[(monthBranchIndex + 3) % 12];
  const fetalOrigin = `${fetalStem}${fetalBranch}`;
  const palaceProfile = buildPalaceProfile(monthPillar, hourPillar);
  const pillarExtras = pillars.map((pillar) => ({
    label: pillar.label,
    value: pillar.value,
    nayin: getNayin(pillar.value),
    voidHit: voidBranches.includes(pillar.branch),
    voidText: voidBranches.includes(pillar.branch) ? '逢空' : '不空',
    stemTenGod: pillar.stemTenGod,
    hiddenStemText: pillar.hiddenStemText
  }));
  const glossary = [
    {
      term: '日主',
      plain: `日主就是命盘中心点，本盘为${dayMaster.text}，后面的十神、喜忌都围绕它展开。`
    },
    {
      term: '旺衰',
      plain: `旺衰是看日主得到多少支持。本盘暂评${professional.strength.status}，代表判断时要先看扶身与压力的平衡。`
    },
    {
      term: '喜用',
      plain: `喜用是让命局更平衡的参考方向，本盘暂取${professional.usefulGod.usefulText}；它是趋势参考，不等于现实中的绝对选择。`
    },
    {
      term: '流运触发',
      plain: '流年、流月、流日、流时与原局发生合冲刑害时，会被标成触发点，用来提示更值得复盘的时间窗口。'
    }
  ];

  return {
    pillarExtras,
    voidBranches,
    voidText: voidBranches.join('、'),
    fetalOrigin: {
      value: fetalOrigin,
      nayin: getNayin(fetalOrigin),
      basis: '胎元按月干进一位、月支进三位生成，用于传统细盘参考。'
    },
    palaceProfile,
    glossary
  };
}

function buildCultivationAdvice(dayMaster, professional, flowTriggerSummary) {
  const dayElement = stemMeta[dayMaster.stem].element;
  const elementActions = {
    木: ['早起舒展，先把计划拆成可执行的小节', '少急于求成，遇到冲突先看方向是否走偏'],
    火: ['保留表达与创作出口，但重要决定留出冷静间隔', '避免情绪上头时立刻承诺或反击'],
    土: ['把作息、财务、任务边界整理清楚，先稳中宫', '不要把所有人的压力都揽到自己身上'],
    金: ['用清单和规则提高执行力，先定标准再行动', '少用过硬的判断处理亲近关系'],
    水: ['保留独处、学习和复盘时间，让信息沉淀后再判断', '避免想得太多而迟迟不落地']
  };
  const strengthAdvice = professional.strength.status === '偏弱'
    ? '盘面先以守根基、接资源、少过度消耗为要。'
    : (professional.strength.status === '偏旺'
      ? '盘面先以疏导、输出、接受约束为要。'
      : '盘面接近中和，重点在顺势安排节奏。');
  const triggerText = flowTriggerSummary.topSummary || '近期未见高优先级触发点';

  return {
    title: '修身建议',
    focus: `${dayMaster.text}日主属${dayElement}，${strengthAdvice}喜用参考${professional.usefulGod.usefulText}，忌${professional.usefulGod.avoidText}过重。`,
    actions: elementActions[dayElement] || ['先稳住作息与复盘节奏', '重要事项多做交叉验证'],
    timing: `近期留意：${triggerText}。这里更适合当作复盘提醒，不作事件必然判断。`,
    caution: '测试版先给小白可执行的修身方向，后续 App 版可结合命例反馈继续提高解读颗粒度。'
  };
}

function buildInterpretationLayers(professional, cultivationAdvice, flowTriggerSummary) {
  return [
    {
      title: '格局旺衰',
      original: `${professional.pattern.name}，日主${professional.strength.status}，喜用参考${professional.usefulGod.usefulText}。`,
      plain: `先看月令定格局，再看日主得到多少生扶。本盘不是单看一个神煞，而是用旺衰、格局、喜用一起判断倾向。`,
      action: cultivationAdvice.focus
    },
    {
      title: '流运触发',
      original: flowTriggerSummary.topSummary,
      plain: '流年、流月、流日、流时与原局合冲刑害时，只代表这个时间窗口更值得复盘，不代表事件一定发生。',
      action: cultivationAdvice.timing
    },
    {
      title: '取舍建议',
      original: `宜顺${professional.usefulGod.usefulText}之气，忌${professional.usefulGod.avoidText}过重。`,
      plain: '喜用可以理解为让命局更平衡的方向，忌神则是容易让偏性变重的方向。',
      action: cultivationAdvice.actions.join('；')
    }
  ];
}

function buildLuckFlowOverlay(luck, flowYears) {
  const currentYear = new Date().getFullYear();
  const activeCycle = luck.cycles.find((cycle) => {
    const [start, end] = cycle.yearRange.split('-').map(Number);
    return currentYear >= start && currentYear <= end;
  }) || luck.cycles[0];
  const currentYearFlow = flowYears[0];
  return {
    title: '大运流年叠看',
    activeLuck: activeCycle ? `${activeCycle.label} ${activeCycle.value}（${activeCycle.yearRange}）` : '当前大运待校验',
    yearFlow: `${currentYearFlow.year} ${currentYearFlow.value} · ${currentYearFlow.tenGod}`,
    plain: `测试版先把当前大运与流年并列观察：大运看十年环境，流年看当年触发，具体事项还需结合流月、流日与现实反馈。`,
    caution: '正式版建议继续补调候、通关、病药、格局成败与命例反馈校验。'
  };
}

function buildLuckCycles(readingDate, monthPillar, yearPillar, gender) {
  const yearYang = stemMeta[yearPillar.stem].yinYang === '阳';
  const isMale = gender === '男';
  const isFemale = gender === '女';
  const direction = (isMale && yearYang) || (isFemale && !yearYang) ? 1 : -1;
  const boundary = getAdjacentJie(readingDate, direction);
  const days = Math.abs(boundary.date.getTime() - readingDate.getTime()) / 86400000;
  const startAge = Math.max(1, Math.round(days / 3 * 10) / 10);
  const startYear = readingDate.getFullYear() + Math.floor(startAge);
  const cycles = [];

  for (let i = 1; i <= 8; i += 1) {
    const pillar = ganzhiFromIndex(monthPillar.index + direction * i);
    const ageStart = Math.round((startAge + (i - 1) * 10) * 10) / 10;
    cycles.push({
      label: `第${i}步大运`,
      value: pillar.value,
      ageRange: `${ageStart}-${Math.round(ageStart + 9.9)}岁`,
      yearRange: `${startYear + (i - 1) * 10}-${startYear + i * 10 - 1}`,
      direction: direction > 0 ? '顺排' : '逆排'
    });
  }

  return {
    direction: direction > 0 ? '顺排' : '逆排',
    startAge,
    boundary: `${boundary.key} ${formatDateTime(boundary.date)}`,
    cycles
  };
}

function buildFlowYears(startYear, dayStem, natalPillars) {
  return Array.from({ length: 12 }, (_, index) => {
    const year = startYear + index;
    const pillar = getYearPillarByYear(year);
    const context = buildFlowContext(pillar, dayStem, natalPillars, '流年');
    return {
      year,
      value: pillar.value,
      ...context
    };
  });
}

function buildFlowMonths(year, dayStem, natalPillars) {
  const yearPillar = getYearPillarByYear(year);
  return jieTerms.map((term) => {
    const stemIndex = ((heavenlyStems.indexOf(yearPillar.stem) % 5) * 2 + 2 + term.index) % 10;
    const branchIndex = (2 + term.index) % 12;
    const stem = heavenlyStems[stemIndex];
    const branch = earthlyBranches[branchIndex];
    const pillar = { stem, branch, value: `${stem}${branch}` };
    const context = buildFlowContext(pillar, dayStem, natalPillars, '流月');
    return {
      label: `${term.key}月`,
      termTime: formatDateTime(findSolarTermTime(year, term)),
      value: pillar.value,
      focus: `${branchElements[branch]}气当令 · ${context.influence.tendency}`,
      ...context
    };
  });
}

function buildFlowDays(startDate, dayStem, natalPillars) {
  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
    const pillar = getDayPillar(date);
    const context = buildFlowContext(pillar, dayStem, natalPillars, '流日');
    return {
      date: formatDate(date),
      value: pillar.value,
      focus: `${branchElements[pillar.branch]}气流日 · ${context.influence.tendency}`,
      ...context
    };
  });
}

function buildFlowHours(date, dayStem, natalPillars) {
  const dayStemIndex = heavenlyStems.indexOf(getDayPillar(date).stem);
  return earthlyBranches.map((branch, branchIndex) => {
    const pillar = getHourPillarByBranch(dayStemIndex, branchIndex);
    const start = branchIndex === 0 ? 23 : branchIndex * 2 - 1;
    const end = branchIndex === 0 ? 0 : branchIndex * 2;
    const context = buildFlowContext(pillar, dayStem, natalPillars, '流时');
    return {
      label: `${branch}时`,
      timeRange: `${String(start).padStart(2, '0')}:00-${String(end).padStart(2, '0')}:59`,
      value: pillar.value,
      focus: `${branchElements[branch]}气流时 · ${context.influence.tendency}`,
      ...context
    };
  });
}

function buildBaziProfile(form) {
  const normalizedInput = normalizeBaziInput(form);
  const normalizedForm = normalizedInput.form;
  const birthParts = parseBirthDateTime(normalizedForm.birthDate, normalizedForm.birthTime);
  const baseDate = makeDate(birthParts);
  const longitude = normalizeLongitude(normalizedForm.longitude);
  const trueSolar = applyTrueSolarTime(baseDate, longitude, Boolean(normalizedForm.useTrueSolarTime));
  const readingDate = trueSolar.date;

  const yearPillar = getYearPillar(readingDate);
  const monthPillar = getMonthPillar(readingDate, heavenlyStems.indexOf(yearPillar.stem));
  const dayPillar = getDayPillar(readingDate);
  const hourPillar = getHourPillar(readingDate, heavenlyStems.indexOf(dayPillar.stem));
  const rawPillars = [yearPillar, monthPillar, dayPillar, hourPillar];
  const natalBranches = rawPillars.map((item) => item.branch);
  const dayMaster = {
    stem: dayPillar.stem,
    element: stemMeta[dayPillar.stem].element,
    yinYang: stemMeta[dayPillar.stem].yinYang,
    text: `${dayPillar.stem}${stemMeta[dayPillar.stem].element}${stemMeta[dayPillar.stem].yinYang}`
  };
  const distribution = buildElementDistribution(rawPillars, dayPillar.stem);
  const strongest = findStrongestElement(distribution);
  const weakest = findWeakestElement(distribution);
  const locationText = normalizedForm.birthPlace || '未填写出生地';
  const hourChanged = baseDate.getHours() !== readingDate.getHours() || baseDate.getDate() !== readingDate.getDate();

  const pillars = [
    enrichPillar('年柱', yearPillar, dayPillar.stem),
    enrichPillar('月柱', monthPillar, dayPillar.stem),
    enrichPillar('日柱', dayPillar, dayPillar.stem),
    enrichPillar('时柱', hourPillar, dayPillar.stem)
  ];
  const now = new Date();
  const luck = buildLuckCycles(readingDate, monthPillar, yearPillar, normalizedForm.gender);
  const professional = buildProfessionalProfile(dayMaster, rawPillars, pillars, monthPillar, distribution);
  professional.chartSummary = buildChartSummary(
    dayMaster,
    monthPillar,
    distribution,
    professional.strength,
    professional.pattern,
    professional.usefulGod,
    professional.natalRelations
  );
  const flowYears = buildFlowYears(now.getFullYear(), dayPillar.stem, pillars);
  const flowMonths = buildFlowMonths(now.getFullYear(), dayPillar.stem, pillars);
  const flowDays = buildFlowDays(now, dayPillar.stem, pillars);
  const flowHours = buildFlowHours(now, dayPillar.stem, pillars);
  const validationHints = buildCalibrationHints(baseDate, readingDate, trueSolar, monthPillar, hourChanged, normalizedForm);
  const flowTriggerSummary = buildFlowTriggerSummary(flowYears, flowMonths, flowDays, flowHours);
  const detailProfile = buildDetailProfile(pillars, dayPillar, monthPillar, hourPillar, dayMaster, professional);
  const cultivationAdvice = buildCultivationAdvice(dayMaster, professional, flowTriggerSummary);
  const interpretationLayers = buildInterpretationLayers(professional, cultivationAdvice, flowTriggerSummary);
  const luckFlowOverlay = buildLuckFlowOverlay(luck, flowYears);

  const sections = [
    {
      title: '命局摘要',
      text: `${professional.chartSummary.oneLine}${professional.chartSummary.highlights.join('')}${professional.chartSummary.caution}`
    },
    {
      title: '流运触发点',
      text: `${flowTriggerSummary.summary}。${flowTriggerSummary.note}`
    },
    {
      title: cultivationAdvice.title,
      text: `${cultivationAdvice.focus}${cultivationAdvice.actions.join('')}${cultivationAdvice.timing}`
    },
    {
      title: luckFlowOverlay.title,
      text: `${luckFlowOverlay.activeLuck}${luckFlowOverlay.yearFlow}${luckFlowOverlay.plain}`
    },
    {
      title: '校准提示',
      text: validationHints.map((item) => `${item.title}：${item.text}`).join('')
    }
  ];
  const calendarProviderInfo = {
    solarTerm: getSolarTermProviderInfo(),
    lunar: normalizedInput.calendarConversion
  };

  return {
    sourceInput: { ...form, normalizedBirthDate: normalizedForm.birthDate, normalizedBirthTime: normalizedForm.birthTime },
    displayName: normalizedForm.name || '未命名',
    title: `${normalizedForm.name || '未命名'}的八字排盘`,
    betaLabel: '内测排盘口径',
    solarTime: formatDateTime(baseDate),
    adjustedSolarTime: formatDateTime(readingDate),
    birthPlace: locationText,
    longitude: longitude.toFixed(2),
    calendarConversion: normalizedInput.calendarConversion,
    calendarProviderInfo,
    normalizationWarnings: normalizedInput.warnings,
    dayMaster,
    pillars,
    distribution,
    luck,
    flowYears,
    flowMonths,
    flowDays,
    flowHours,
    professional,
    detailProfile,
    cultivationAdvice,
    interpretationLayers,
    luckFlowOverlay,
    validationHints,
    flowTriggerSummary,
    sections,
    engineInfo: [
      '四柱采用太阳黄经搜索节气时刻，年柱以立春分界，月柱以十二节令换月。',
      '时柱支持经度与均时差真太阳时校准，遇到跨时辰会重算时柱。',
      `节气数据源：${calendarProviderInfo.solarTerm.status}，${calendarProviderInfo.solarTerm.precisionNote}`,
      '已加入格局、旺衰、喜用神、纳音、旬空、胎元、合冲刑害、十二长生、神煞、大运、流年、流月、流日、流时和触发点摘要。',
      '小白重点页会把术语转成白话解释，并补充修身建议；专业细盘保留胎元、命宫、身宫等复盘信息。',
      '当前采用本地规则引擎，正式商用仍建议接入权威历法库或服务端校验。'
    ],
    calibration: {
      enabled: Boolean(form.useTrueSolarTime),
      correctionMinutes: trueSolar.correctionMinutes,
      hourChanged,
      note: trueSolar.label
    },
    summary: '八字排盘已加入节气时刻搜索、真太阳时、格局、旺衰、喜用神、纳音、旬空、胎元、命宫身宫、合冲刑害、十二长生、神煞、大运、流年、流月、流日、流时、命局摘要、修身建议、校验提示与流运触发点。结果仍为传统文化学习与产品验证参考。',
    aiText: `AI 辅助解读：你的日主为 ${dayMaster.text}，暂按${professional.pattern.name}观察，旺衰为${professional.strength.status}，喜用参考${professional.usefulGod.useful.join('、')}。当前流年${flowYears[0].value}为${flowYears[0].tenGod}，${flowYears[0].influenceSummary}${flowYears[0].interactionSummary}，仅作传统文化参考。`
  };
}

function getLineMeta(raw) {
  const value = Number(raw);
  if (value === 6) return { raw: value, yinYang: 0, moving: true, name: '老阴', symbol: '— — ×' };
  if (value === 9) return { raw: value, yinYang: 1, moving: true, name: '老阳', symbol: '——— ○' };
  if (value === 8 || value === 0) return { raw: value, yinYang: 0, moving: false, name: '少阴', symbol: '— —' };
  return { raw: value, yinYang: 1, moving: false, name: '少阳', symbol: '———' };
}

function lineToPreview(raw) {
  const meta = getLineMeta(raw);
  return {
    value: meta.yinYang,
    moving: meta.moving,
    text: `${meta.symbol} ${meta.name}`
  };
}

function trigramFromLines(lines) {
  const key = lines.map((line) => getLineMeta(line).yinYang).join('');
  return trigramMeta[key] || trigramMeta['000'];
}

function getHexagram(lines) {
  const lower = trigramFromLines(lines.slice(0, 3));
  const upper = trigramFromLines(lines.slice(3, 6));
  const record = hexagramDatabaseByTrigrams[`${upper.name}-${lower.name}`] || {
    name: hexagramMatrix[lower.name][upper.name],
    number: 0
  };
  const palaceMeta = hexagramPalaceMetaByName[record.name] || {
    palace: upper.name === lower.name ? upper.name : lower.name,
    sequence: '',
    palaceLabel: upper.name === lower.name ? upper.name : lower.name
  };
  const palace = {
    name: palaceMeta.palace,
    element: trigramElementByName[palaceMeta.palace] || lower.element || upper.element
  };
  return {
    ...record,
    upper,
    lower,
    palace,
    palaceName: palaceMeta.palace,
    palaceSequence: palaceMeta.sequence,
    palaceLabel: palaceMeta.palaceLabel,
    index: trigramOrder.indexOf(upper.name) * 8 + trigramOrder.indexOf(lower.name)
  };
}

function getChangedLines(lines) {
  return lines.map((line) => {
    const meta = getLineMeta(line);
    if (!meta.moving) return line;
    return meta.yinYang ? 8 : 7;
  });
}

function buildSixGods(dayStem) {
  const startMap = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 };
  const start = startMap[dayStem] || 0;
  return Array.from({ length: 6 }, (_, index) => spirits[(start + index) % 6]);
}

function getVoidBranches(dayIndex) {
  const groupStart = Math.floor(dayIndex / 10) * 10;
  const used = new Set(Array.from({ length: 10 }, (_, index) => earthlyBranches[(groupStart + index) % 12]));
  return earthlyBranches.filter((branch) => !used.has(branch));
}

function getLineSeasonState(branch, monthBranch, dayBranch, voidBranches) {
  const notes = [];
  if (voidBranches.includes(branch)) notes.push('空');
  if (branch === monthBranch) notes.push('临月');
  if (branch === dayBranch) notes.push('临日');
  if (describeBranchInteraction(branch, [monthBranch]).includes('冲')) notes.push('月破');
  if (describeBranchInteraction(branch, [dayBranch]).includes('冲')) notes.push('日冲');
  if (describeBranchInteraction(branch, [monthBranch]).includes('合')) notes.push('月合');
  if (describeBranchInteraction(branch, [dayBranch]).includes('合')) notes.push('日合');
  return notes.length ? notes.join('、') : '平';
}

function describeBackEffect(originalElement, changedElement) {
  if (originalElement === changedElement) return { name: '回头比和', tone: '稳', detail: '变爻与本爻同气，事情延续性较强。' };
  if (elementGenerates[changedElement] === originalElement) return { name: '回头生', tone: '吉', detail: '变爻回生本爻，后续条件有补益。' };
  if (elementControls[changedElement] === originalElement) return { name: '回头克', tone: '凶', detail: '变爻反克本爻，推进中要防反复与压力。' };
  if (elementGenerates[originalElement] === changedElement) return { name: '化泄', tone: '耗', detail: '本爻生出变爻，事情容易耗力、耗时。' };
  if (elementControls[originalElement] === changedElement) return { name: '化克', tone: '制', detail: '本爻去克变爻，适合主动处理阻力。' };
  return { name: '平化', tone: '平', detail: '本变五行关系平缓，需结合月日与世应用神细看。' };
}

function scoreSeasonState(seasonState) {
  let score = 0;
  const factors = [];
  if (seasonState.includes('临月')) {
    score += 3;
    factors.push('得月建');
  }
  if (seasonState.includes('临日')) {
    score += 3;
    factors.push('得日辰');
  }
  if (seasonState.includes('月合')) {
    score += 1;
    factors.push('月合');
  }
  if (seasonState.includes('日合')) {
    score += 1;
    factors.push('日合');
  }
  if (seasonState.includes('空')) {
    score -= 3;
    factors.push('旬空');
  }
  if (seasonState.includes('月破')) {
    score -= 4;
    factors.push('月破');
  }
  if (seasonState.includes('日冲')) {
    score -= 2;
    factors.push('日冲');
  }
  return { score, factors: factors.length ? factors : ['平'] };
}

function getLinePowerLabel(score) {
  if (score >= 4) return '偏旺';
  if (score <= -3) return '偏弱';
  return '平衡';
}

function describeElementAction(sourceElement, targetElement) {
  if (sourceElement === targetElement) return '比和';
  if (elementGenerates[sourceElement] === targetElement) return '生扶';
  if (elementControls[sourceElement] === targetElement) return '克制';
  if (elementGenerates[targetElement] === sourceElement) return '受生';
  if (elementControls[targetElement] === sourceElement) return '受克';
  return '平';
}

function buildUseGodStrength(focusLine, focusLines, movingLines) {
  const season = scoreSeasonState(focusLine.seasonState);
  let score = season.score;
  const factors = [...season.factors];
  if (focusLine.moving) {
    score += 2;
    factors.push('用神发动');
  }
  if (focusLines.length > 1) {
    score += 1;
    factors.push('同类用神多现');
  }
  if (movingLines.some((line) => elementGenerates[line.element] === focusLine.element)) {
    score += 1;
    factors.push('动爻来生');
  }
  if (movingLines.some((line) => elementControls[line.element] === focusLine.element)) {
    score -= 2;
    factors.push('动爻来克');
  }
  const label = getLinePowerLabel(score);
  return {
    score,
    label,
    factors,
    text: `用神强弱暂评${label}（${factors.join('、')}），需结合所问事项与后续应期验证。`
  };
}

function buildShiYingProfile(lines, focusLine) {
  const shi = lines.find((line) => line.role === '世');
  const ying = lines.find((line) => line.role === '应');
  const shiYingAction = shi && ying ? describeElementAction(shi.element, ying.element) : '平';
  const shiUseAction = shi ? describeElementAction(shi.element, focusLine.element) : '平';
  const yingUseAction = ying ? describeElementAction(ying.element, focusLine.element) : '平';
  return {
    shi: shi ? `${shi.position}${shi.relation}${shi.branch}${shi.element}` : '未定位',
    ying: ying ? `${ying.position}${ying.relation}${ying.branch}${ying.element}` : '未定位',
    shiYingAction,
    shiUseAction,
    yingUseAction,
    text: `世应关系为${shiYingAction}；世爻对用神为${shiUseAction}，应爻对用神为${yingUseAction}。此处只作关系提示，不作单点定论。`
  };
}

function buildMovingPriority(line, focusLine, effect) {
  let score = 1;
  const reasons = [];
  if (line.index === focusLine.index) {
    score += 5;
    reasons.push('用神发动');
  }
  if (line.relation === focusLine.relation && line.index !== focusLine.index) {
    score += 3;
    reasons.push('同类用神发动');
  }
  if (line.role === '世' || line.role === '应') {
    score += 2;
    reasons.push(`${line.role}爻发动`);
  }
  if (['回头生', '回头克'].includes(effect.name)) {
    score += 2;
    reasons.push(effect.name);
  }
  if (line.seasonState.includes('空') || line.seasonState.includes('月破') || line.seasonState.includes('日冲')) {
    score += 1;
    reasons.push(line.seasonState);
  }
  return {
    score,
    level: score >= 7 ? '优先' : (score >= 4 ? '次优先' : '参考'),
    reasons: reasons.length ? reasons : ['普通动爻']
  };
}

function buildRiskSummary(lines, focusLine, movingLines) {
  const riskyStates = ['空', '月破', '日冲'];
  const riskLines = lines.filter((line) => riskyStates.some((state) => line.seasonState.includes(state)));
  const focusRisks = riskyStates.filter((state) => focusLine.seasonState.includes(state));
  const movingRisks = movingLines.filter((line) => riskyStates.some((state) => line.seasonState.includes(state)));
  const items = [
    ...focusRisks.map((state) => `用神${state}`),
    ...movingRisks.map((line) => `${line.position}${line.seasonState}`)
  ];
  return {
    level: focusRisks.length || movingRisks.length ? '需复核' : '平稳',
    items,
    text: items.length
      ? `风险摘要：${Array.from(new Set(items)).join('、')}，短期宜复核信息、时机与外部条件。`
      : `风险摘要：六爻中共有${riskLines.length}处空亡/月破/日冲提示，用神与动爻未见集中风险。`
  };
}

function buildYingQiProfile(focusLine, movingLines, voidBranches) {
  const windows = [];
  if (focusLine.seasonState.includes('空')) {
    windows.push(`待${voidBranches.join('、')}出空后再观察`);
  }
  if (focusLine.seasonState.includes('日冲') || movingLines.some((line) => line.seasonState.includes('日冲'))) {
    windows.push('遇合日或冲动后的下一阶段复核');
  }
  if (movingLines.length) {
    windows.push('动爻所临地支之日、月为优先复盘点');
  }
  if (!windows.length) {
    windows.push('先以月建、日辰与下一次明显合冲日复盘');
  }

  return {
    title: '应期内测口径',
    windows,
    text: `应期测试版先按用神空亡、动爻、月日合冲取复盘窗口：${windows.join('；')}。正式版需继续补完整纳甲、旬空、飞伏与卦宫表。`
  };
}

function buildRitualProfile(method, castTime) {
  return {
    title: '起卦仪轨',
    castTime: formatDateTime(castTime),
    method,
    rules: ['静心一念', '一事一问', '不反复占同一事'],
    text: '起卦前先定清楚所问事项；同一件事短时间反复占问，容易让判断失焦。'
  };
}

function buildHexagramAnalysis(lines, changedLineDetails, focus, focusLine, movingLines, baseElement, voidBranches) {
  const focusLines = lines.filter((line) => line.relation === focus);
  const focusSeason = focusLine.seasonState === '平' ? '不临月日，力量平常' : `见${focusLine.seasonState}`;
  const useGodStrength = buildUseGodStrength(focusLine, focusLines, movingLines);
  const shiYing = buildShiYingProfile(lines, focusLine);
  const useGod = {
    title: `${focus}为用`,
    strength: useGodStrength.label,
    score: useGodStrength.score,
    factors: useGodStrength.factors,
    text: `用神落${focusLine.position}${focusLine.role ? `（${focusLine.role}）` : ''}，纳${focusLine.branch}${focusLine.element}，${focusSeason}。${useGodStrength.text}${focusLine.moving ? '用神发动，事项已有变化信号。' : '用神安静，宜先看世应与动爻是否来生扶。'}`
  };

  const moving = movingLines.map((line) => {
    const changed = changedLineDetails[line.index];
    const effect = describeBackEffect(line.element, changed.element);
    const priority = buildMovingPriority(line, focusLine, effect);
    return {
      position: line.position,
      relation: line.relation,
      from: `${line.branch}${line.element}`,
      to: `${changed.branch}${changed.element}`,
      effect: effect.name,
      tone: effect.tone,
      priority: priority.score,
      priorityLevel: priority.level,
      priorityReasons: priority.reasons,
      text: `${line.position}${line.relation}${line.branch}${line.element}化${changed.relation}${changed.branch}${changed.element}，${effect.name}：${effect.detail}`
    };
  }).sort((a, b) => b.priority - a.priority);

  const fuFei = focusLines.length
    ? {
        status: '用神已现',
        text: `${focus}在本卦中明现${focusLines.length}处，先以${focusLine.position}为主，再参看同类爻的月日旺衰。`
      }
    : {
        status: '伏神待查',
        text: `本卦未见${focus}明现，测试版先以世爻和${baseElement}局同气爻代参；正式版应继续补完整纳甲伏神飞神表。`
      };

  const decision = [
    `${focusLine.role === '世' ? '用神临世，主观掌控较强。' : focusLine.role === '应' ? '用神临应，关键在对方或外部条件。' : '用神不临世应，需看世应用神之间的生克距离。'}${shiYing.text}`,
    moving.length ? `动爻优先级看${moving.map((item) => `${item.position}${item.priorityLevel}`).join('、')}。` : '无动爻，取静卦之象，先守条件再择时推进。',
    focusLine.seasonState.includes('空') ? '用神逢空，短期信息可能不实或尚未落地。' : '用神不空，可按当前信息做下一步验证。'
  ];
  const riskSummary = buildRiskSummary(lines, focusLine, movingLines);
  const yingQi = buildYingQiProfile(focusLine, movingLines, voidBranches);
  const movingPriority = moving.map((item, index) => ({
    rank: index + 1,
    position: item.position,
    level: item.priorityLevel,
    score: item.priority,
    reasons: item.priorityReasons,
    text: `${item.position}${item.effect}，${item.priorityReasons.join('、')}`
  }));

  return { useGod, useGodStrength, shiYing, moving, movingPriority, fuFei, riskSummary, yingQi, decision };
}

function buildYaoLine(raw, index, baseElement, dayStem, shiIndex, yingIndex) {
  const meta = getLineMeta(raw);
  const branch = meta.yinYang
    ? ['子', '寅', '辰', '午', '申', '戌'][index]
    : ['丑', '卯', '巳', '未', '酉', '亥'][index];
  const relation = getSixRelation(baseElement, branchElements[branch]);
  const sixGod = buildSixGods(dayStem)[index];
  const stem = heavenlyStems[(heavenlyStems.indexOf(dayStem) + index + 10) % 10];
  return {
    raw,
    value: meta.yinYang,
    position: ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][index],
    name: meta.name,
    symbol: meta.symbol,
    stem,
    branch,
    element: branchElements[branch],
    relation,
    naText: `${relation}${stem}${branch}${branchElements[branch]}`,
    spirit: sixGod,
    moving: meta.moving,
    index,
    role: index === shiIndex ? '世' : (index === yingIndex ? '应' : ''),
    roleText: index === shiIndex ? ' · 世' : (index === yingIndex ? ' · 应' : '')
  };
}

function getPalacePureLines(palaceName) {
  const key = Object.entries(trigramMeta).find(([, meta]) => meta.name === palaceName)?.[0] || '000';
  const trigramLines = key.split('').map((value) => (value === '1' ? 7 : 8));
  return [...trigramLines, ...trigramLines];
}

function buildFuShenProfile(lineDetails, focus, baseElement, dayStem, seed) {
  if (lineDetails.some((line) => line.relation === focus)) return null;
  const element = getElementForSixRelation(baseElement, focus);
  const branch = getBranchByElement(element, seed);
  const stemIndex = (heavenlyStems.indexOf(dayStem) + Math.abs(seed) + 6) % heavenlyStems.length;
  const stem = heavenlyStems[stemIndex];
  const targetLine = lineDetails.find((line) => line.role === '世') || lineDetails[Math.abs(seed) % lineDetails.length] || lineDetails[0];

  return {
    targetIndex: targetLine.index,
    relation: focus,
    stem,
    branch,
    element,
    naText: `${focus}${stem}${branch}${element}`,
    anchor: targetLine.position
  };
}

function buildPalaceFuShenProfile(lineDetails, focus, baseHex, dayStem, shiIndex, yingIndex, seed) {
  const palaceLines = getPalacePureLines(baseHex.palace.name).map((value, index) => (
    buildYaoLine(value, index, baseHex.palace.element, dayStem, shiIndex, yingIndex)
  ));
  const sourceLine = palaceLines.find((line) => line.relation === focus)
    || palaceLines.find((line) => !lineDetails.some((item) => item.relation === line.relation))
    || palaceLines[Math.abs(seed) % palaceLines.length]
    || palaceLines[0];
  const shownInCurrentHexagram = lineDetails.some((line) => line.relation === sourceLine.relation);

  return {
    targetIndex: sourceLine.index,
    relation: sourceLine.relation,
    stem: sourceLine.stem,
    branch: sourceLine.branch,
    element: sourceLine.element,
    naText: sourceLine.naText,
    anchor: lineDetails[sourceLine.index]?.position || sourceLine.position,
    sourcePosition: sourceLine.position,
    sourcePalace: baseHex.palace.name,
    shownInCurrentHexagram
  };
}

function randomYao() {
  const total = [0, 0, 0].reduce((sum) => sum + (Math.random() > 0.5 ? 3 : 2), 0);
  if (total === 6) return 6;
  if (total === 7) return 7;
  if (total === 8) return 8;
  return 9;
}

function buildTimeLines(seedDate, seedText) {
  const seed = stableHash(`${seedDate.getTime()}-${formatDateTime(seedDate)}-${seedText}`);
  return Array.from({ length: 6 }, (_, index) => [6, 7, 8, 9][mixedSeedValue(seed, index) % 4]);
}

function buildHexagram(question, lines = [], category, method, castTime) {
  const normalizedLines = lines.length === 6 ? lines : Array.from({ length: 6 }, () => randomYao());
  const seed = textSeed(`${question}-${category || ''}-${method || ''}`) + normalizedLines.reduce((sum, value, index) => sum + Number(value) * (index + 1), 0);
  const date = castTime || new Date();
  const yearPillar = getYearPillar(date);
  const monthPillar = getMonthPillar(date, heavenlyStems.indexOf(yearPillar.stem));
  const dayPillar = getDayPillar(date);
  const voidBranches = getVoidBranches(dayPillar.index);
  const baseHex = getHexagram(normalizedLines);
  const changedLines = getChangedLines(normalizedLines);
  const changedHex = getHexagram(changedLines);
  const baseElement = baseHex.palace.element;
  const shiIndex = baseHex.index % 6;
  const yingIndex = (shiIndex + 3) % 6;
  const lineDetails = normalizedLines.map((value, index) => {
    const line = buildYaoLine(value, index, baseElement, dayPillar.stem, shiIndex, yingIndex);
    return {
      ...line,
      seasonState: getLineSeasonState(line.branch, monthPillar.branch, dayPillar.branch, voidBranches)
    };
  });
  const changedLineDetails = changedLines.map((value, index) => {
    const line = buildYaoLine(value, index, baseElement, dayPillar.stem, shiIndex, yingIndex);
    return {
      ...line,
      seasonState: getLineSeasonState(line.branch, monthPillar.branch, dayPillar.branch, voidBranches)
    };
  });
  const focusByCategory = {
    事业: '官鬼',
    感情: '妻财',
    财务: '妻财',
    健康: '父母',
    出行: '父母',
    其他: pickBySeed(relations, seed + 11)
  };
  const focus = focusByCategory[category] || focusByCategory.其他;
  const movingLines = lineDetails.filter((line) => line.moving);
  const focusLine = lineDetails.find((line) => line.relation === focus) || lineDetails[shiIndex];
  const analysis = buildHexagramAnalysis(lineDetails, changedLineDetails, focus, focusLine, movingLines, baseElement, voidBranches);
  const ritual = buildRitualProfile(method || '手动起卦', date);
  const fuShen = buildPalaceFuShenProfile(lineDetails, focus, baseHex, dayPillar.stem, shiIndex, yingIndex, seed)
    || buildFuShenProfile(lineDetails, focus, baseElement, dayPillar.stem, seed);
  const displayLines = lineDetails.map((line, index) => ({
    position: line.position,
    base: line,
    changed: changedLineDetails[index],
    fuShen: fuShen && fuShen.targetIndex === line.index ? fuShen : null,
    movingMark: line.moving ? (line.raw === 9 ? '○' : '×') : '',
    changeText: line.moving ? '化' : ''
  })).reverse();

  return {
    question: question || '未填写事项',
    category: category || '其他',
    method: method || '手动起卦',
    hexagramName: baseHex.name,
    hexagramNumber: baseHex.number,
    changedName: changedHex.name,
    changedNumber: changedHex.number,
    upperTrigram: baseHex.upper.name,
    lowerTrigram: baseHex.lower.name,
    palace: `${baseHex.palace.name}宫`,
    palaceName: baseHex.palaceName,
    palaceLabel: baseHex.palaceLabel,
    palaceSequence: baseHex.palaceSequence,
    changedPalaceName: changedHex.palaceName,
    changedPalaceLabel: changedHex.palaceLabel,
    changedPalaceSequence: changedHex.palaceSequence,
    palaceElement: baseElement,
    dateContext: {
      month: monthPillar.value,
      day: dayPillar.value,
      monthBranch: monthPillar.branch,
      dayBranch: dayPillar.branch,
      voidText: voidBranches.join('、')
    },
    focus,
    focusLine: `${focusLine.position}${focusLine.role ? `(${focusLine.role})` : ''} ${focusLine.relation}${focusLine.branch}${focusLine.element}`,
    ritual,
    lines: lineDetails,
    changedLines: changedLines.map(lineToPreview),
    changedLineDetails,
    displayLines,
    fuShen,
    analysis,
    movingSummary: movingLines.length ? movingLines.map((line) => `${line.position}${line.name}`).join('、') : '无动爻',
    aiText: `AI 辅助解卦：本卦《${baseHex.name}》，变卦《${changedHex.name}》，${baseHex.palace.name}宫${baseElement}局。${analysis.useGod.text}${analysis.riskSummary.text}`,
    advice: `传统文化参考：${analysis.decision.join('')}动爻排序、空亡月破日冲均为辅助提示，不作绝对断语。`
  };
}

const qimenPalaceLayout = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6]
];
const qimenPalaceMeta = {
  1: { trigram: '坎', direction: '北', element: '水' },
  2: { trigram: '坤', direction: '西南', element: '土' },
  3: { trigram: '震', direction: '东', element: '木' },
  4: { trigram: '巽', direction: '东南', element: '木' },
  5: { trigram: '中', direction: '中宫', element: '土' },
  6: { trigram: '乾', direction: '西北', element: '金' },
  7: { trigram: '兑', direction: '西', element: '金' },
  8: { trigram: '艮', direction: '东北', element: '土' },
  9: { trigram: '离', direction: '南', element: '火' }
};
const qimenDoors = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'];
const qimenStars = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心', '天禽'];
const qimenGods = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
const qimenStems = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
const qimenStemColors = {
  木: '#39b88f',
  火: '#d84f48',
  土: '#d79b45',
  金: '#e2c66e',
  水: '#4aa8e8'
};
const qimenDoorElements = {
  休门: '水',
  生门: '土',
  伤门: '木',
  杜门: '木',
  景门: '火',
  死门: '土',
  惊门: '金',
  开门: '金'
};
const qimenFocus = {
  事业: { door: '开门', star: '天心', note: '事业先看开门、值符与问事宫是否得令。' },
  财务: { door: '生门', star: '天任', note: '财务先看生门、地盘三奇与宫位生克。' },
  感情: { door: '休门', star: '天辅', note: '感情先看休门、六合、日干与所落宫。' },
  健康: { door: '死门', star: '天芮', note: '健康先看天芮、死门、病符类提示，现实仍以医学为准。' },
  出行: { door: '景门', star: '天冲', note: '出行先看景门、开门与冲动之宫。' },
  其他: { door: '值使', star: '值符', note: '综合问事先看值符值使、日干时干与用门。' }
};

function parseDateTimeValue(dateText, timeText) {
  return makeDate(parseBirthDateTime(dateText, timeText));
}

function getQimenYuan(dayIndex) {
  const offset = dayIndex % 15;
  if (offset < 5) return { name: '上元', index: 0 };
  if (offset < 10) return { name: '中元', index: 1 };
  return { name: '下元', index: 2 };
}

function getQimenDun(activeTerm) {
  const yangIndexes = new Set([10, 11, 0, 1, 2, 3, 4]);
  return yangIndexes.has(activeTerm.index) ? '阳遁' : '阴遁';
}

function getQimenJu(activeTerm, yuan) {
  return ((activeTerm.index * 3 + yuan.index) % 9) + 1;
}

function toChineseNumber(value) {
  return ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'][Number(value)] || String(value);
}

function getQimenHorseBranch(branch) {
  if (['申', '子', '辰'].includes(branch)) return '寅';
  if (['寅', '午', '戌'].includes(branch)) return '申';
  if (['巳', '酉', '丑'].includes(branch)) return '亥';
  return '巳';
}

function getPalaceByBranch(branch) {
  const map = {
    子: 1,
    丑: 8,
    寅: 8,
    卯: 3,
    辰: 4,
    巳: 4,
    午: 9,
    未: 2,
    申: 2,
    酉: 7,
    戌: 6,
    亥: 6
  };
  return map[branch] || 5;
}

function shiftList(list, offset, reverse) {
  const source = reverse ? [...list].reverse() : list;
  return source.map((_, index) => source[(index + offset + source.length) % source.length]);
}

function buildQimenPalaces(ju, dun, dayPillar, hourPillar, category) {
  const reverse = dun === '阴遁';
  const offset = (ju + dayPillar.index + hourPillar.index) % 9;
  const stemSeries = shiftList(qimenStems, offset, reverse);
  const starSeries = shiftList(qimenStars, offset, reverse);
  const doorSeries = shiftList(qimenDoors, offset % 8, reverse);
  const godSeries = shiftList(qimenGods, heavenlyStems.indexOf(hourPillar.stem) % 8, reverse);
  const chiefPalace = ((ju + dayPillar.index + earthlyBranches.indexOf(hourPillar.branch) - 1) % 9) + 1;
  const focusConfig = qimenFocus[category] || qimenFocus.其他;
  const focusDoor = focusConfig.door === '值使' ? doorSeries[(chiefPalace - 1) % 8] : focusConfig.door;
  const focusPalace = qimenPalaceLayout.flat().find((number) => doorSeries[(number - 1) % 8] === focusDoor) || chiefPalace;
  const chiefDoor = doorSeries[(chiefPalace - 1) % 8];
  const chiefStar = starSeries[(chiefPalace - 1) % 9];
  const horseBranch = getQimenHorseBranch(hourPillar.branch);
  const horsePalace = getPalaceByBranch(horseBranch);

  const cells = qimenPalaceLayout.flat().map((number) => {
    const meta = qimenPalaceMeta[number];
    const rawDoor = doorSeries[(number - 1) % 8];
    const door = number === 5 ? `${rawDoor}寄坤` : rawDoor;
    const star = starSeries[(number - 1) % 9];
    const god = number === 5 ? '值符' : godSeries[(number - 1) % 8];
    const heavenStem = stemSeries[(number - 1) % 9];
    const earthStem = qimenStems[(number + ju - 1) % 9];
    const heavenElement = stemMeta[heavenStem] ? stemMeta[heavenStem].element : meta.element;
    const earthElement = stemMeta[earthStem] ? stemMeta[earthStem].element : meta.element;
    const tags = [];
    if (number === chiefPalace) tags.push('值符值使');
    if (number === focusPalace) tags.push('用宫');
    if (number === horsePalace) tags.push('马星');
    if (['开门', '生门', '休门'].some((item) => door.includes(item))) tags.push('三吉门');
    if (['死门', '惊门', '伤门'].some((item) => door.includes(item))) tags.push('慎用门');
    if (qimenDoorElements[rawDoor] && elementControls[qimenDoorElements[rawDoor]] === meta.element) tags.push('门迫');
    if (heavenStem === earthStem) tags.push('伏吟');
    if (Math.abs(qimenStems.indexOf(heavenStem) - qimenStems.indexOf(earthStem)) === 4) tags.push('反吟');
    return {
      number,
      ...meta,
      door,
      star,
      god,
      heavenStem,
      earthStem,
      heavenElement,
      earthElement,
      heavenStemStyle: `color:${qimenStemColors[heavenElement] || '#e8c98a'}`,
      earthStemStyle: `color:${qimenStemColors[earthElement] || '#e8c98a'}`,
      tags,
      tagText: tags.length ? tags.join('、') : '平',
      tone: tags.some((tag) => ['慎用门', '门迫', '反吟'].includes(tag)) ? 'warn' : (tags.includes('三吉门') ? 'good' : 'plain')
    };
  });

  return {
    chiefPalace,
    chiefDoor,
    chiefStar,
    horseBranch,
    horsePalace,
    focusDoor,
    focusPalace,
    focusConfig,
    cells
  };
}

function buildQimenAdvice(chart, category) {
  const focus = chart.cells.find((cell) => cell.number === chart.focusPalace) || chart.cells[0];
  const chief = chart.cells.find((cell) => cell.number === chart.chiefPalace) || focus;
  const doorTone = ['开门', '生门', '休门'].some((item) => focus.door.includes(item))
    ? '用门得吉，适合先做信息确认和稳步推进。'
    : (['死门', '惊门', '伤门'].some((item) => focus.door.includes(item))
      ? '用门偏紧，短期宜先防风险、查漏洞、慢做承诺。'
      : '用门平稳，宜先看值符值使与时干落宫再定动作。');
  const riskTone = focus.tags.some((tag) => ['门迫', '反吟', '伏吟'].includes(tag))
    ? `本宫见${focus.tags.filter((tag) => ['门迫', '反吟', '伏吟'].includes(tag)).join('、')}，宜把承诺、时限和现实条件再核一遍。`
    : '本宫未见明显反复标签，可按用门吉凶与现实条件同步推进。';
  return {
    title: '奇门判断',
    original: `${category}取${chart.focusConfig.door}为用，当前用宫落${focus.number}宫${focus.trigram}，${focus.door}、${focus.star}、${focus.god}，见${focus.tagText}。值符值使落${chief.number}宫。`,
    plain: `用宫代表所问事项的主场，值符值使代表当局主导力量。${chart.focusConfig.note}`,
    action: `${doorTone}${riskTone}若现实条件未明，先按“问事、时机、方位、风险”四项复盘。`,
    focus,
    chief
  };
}

function buildQimenChart(form) {
  const readingDate = parseDateTimeValue(form.date, form.time);
  const yearPillar = getYearPillar(readingDate);
  const monthPillar = getMonthPillar(readingDate, heavenlyStems.indexOf(yearPillar.stem));
  const dayPillar = getDayPillar(readingDate);
  const hourPillar = getHourPillar(readingDate, heavenlyStems.indexOf(dayPillar.stem));
  const activeTerm = getActiveJie(readingDate);
  const nextTerm = getAdjacentJie(readingDate, 1);
  const yuan = getQimenYuan(dayPillar.index);
  const dun = getQimenDun(activeTerm);
  const ju = getQimenJu(activeTerm, yuan);
  const category = form.category || '事业';
  const palaceChart = buildQimenPalaces(ju, dun, dayPillar, hourPillar, category);
  const advice = buildQimenAdvice(palaceChart, category);
  const layout = qimenPalaceLayout.map((row) => row.map((number) => palaceChart.cells.find((cell) => cell.number === number)));
  const voidBranches = getVoidBranches(dayPillar.index);
  const termRangeText = `${activeTerm.key} ${formatDateTime(activeTerm.date)} 至 ${nextTerm.key} ${formatDateTime(nextTerm.date)}`;
  const juText = `${dun}${toChineseNumber(ju)}局`;
  const focusPalaceText = `${toChineseNumber(palaceChart.focusPalace)}宫`;
  const chiefPalaceText = `${toChineseNumber(palaceChart.chiefPalace)}宫`;
  const horsePalaceText = `${toChineseNumber(palaceChart.horsePalace)}宫`;
  const xunShou = `${dayPillar.stem}${dayPillar.branch}${hourPillar.stem}`;

  return {
    title: `${form.question || '未填写事项'} · 奇门起局`,
    betaLabel: '奇门内测口径',
    question: form.question || '未填写事项',
    category,
    castTime: formatDateTime(readingDate),
    pillars: {
      year: yearPillar.value,
      month: monthPillar.value,
      day: dayPillar.value,
      hour: hourPillar.value
    },
    calendar: {
      term: activeTerm.key,
      termTime: formatDateTime(activeTerm.date),
      nextTerm: nextTerm.key,
      nextTermTime: formatDateTime(nextTerm.date),
      termRangeText,
      yuan: yuan.name,
      dun,
      ju: juText,
      juNumber: ju,
      juText,
      plateStyle: '时家奇门',
      voidText: voidBranches.join('、'),
      xunShou,
      horseBranch: palaceChart.horseBranch,
      horsePalace: palaceChart.horsePalace,
      horsePalaceText
    },
    chief: {
      palace: palaceChart.chiefPalace,
      palaceText: chiefPalaceText,
      door: palaceChart.chiefDoor,
      star: palaceChart.chiefStar
    },
    focus: {
      palace: palaceChart.focusPalace,
      palaceText: focusPalaceText,
      door: palaceChart.focusDoor,
      categoryNote: palaceChart.focusConfig.note
    },
    layout,
    cells: palaceChart.cells,
    advice,
    layers: [
      {
        title: '起局依据',
        original: `${activeTerm.key}节气、${yuan.name}、${dun}${ju}局，日柱${dayPillar.value}，时柱${hourPillar.value}。`,
        plain: '奇门先以节气定阴阳遁和局数，再看日时干、值符值使与用宫。',
        action: '测试版已使用本地节气时刻搜索；正式版建议继续接权威历法服务校验。'
      },
      {
        title: '用宫判断',
        original: advice.original,
        plain: advice.plain,
        action: advice.action
      },
      {
        title: '复盘提示',
        original: `值符值使在${palaceChart.chiefPalace}宫，用宫在${palaceChart.focusPalace}宫。`,
        plain: '值符值使看主导力量，用宫看所问事项，二者关系越清楚，行动越容易落地。',
        action: '先记录现实反馈，后续可用命例档案校验奇门判断颗粒度。'
      }
    ],
    engineInfo: [
      '测试版使用节气、三元、阴阳遁、局数、日时干与九宫盘生成奇门结构。',
      '九星、八门、八神、天地盘三奇六仪已进入盘面，但完整拆补/置闰法、转盘/飞盘口径仍需后续校验。',
      '奇门结果用于问事、择机和复盘参考，不作绝对预测。'
    ],
    aiText: `AI 辅助奇门解读：本局为${dun}${ju}局，${yuan.name}，值符值使落${palaceChart.chiefPalace}宫，${category}用${palaceChart.focusConfig.door}，当前用宫在${palaceChart.focusPalace}宫。${advice.action}`
  };
}

function todayAlmanac() {
  const now = new Date();
  const yearPillar = getYearPillar(now);
  const monthPillar = getMonthPillar(now, heavenlyStems.indexOf(yearPillar.stem));
  const dayPillar = getDayPillar(now);
  const activeTerm = getActiveJie(now);
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const practicePool = [
    '静坐十分钟',
    '整理一念',
    '读经一段',
    '少言养气',
    '焚香净几',
    '复盘一事'
  ];
  const classicPool = ['《清静经》', '《道德经》', '《阴符经》', '《文昌帝君阴骘文》'];
  const dayCoursePool = [
    '晨起净手，先定今日一件正事',
    '午后少争，遇冲突先退一步看全局',
    '晚间复盘一念一事，不带怨气入睡',
    '今日宜守口养气，把复杂问题写下来再定'
  ];
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3 + index);
    return { day: String(date.getDate()), current: index === 3 };
  });

  return {
    dateText: '青玄万年历',
    calendar: {
      solar: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
      lunar: '农历朔望按内测口径展示',
      ganzhi: `${yearPillar.value}年 ${monthPillar.value}月 ${dayPillar.value}日`,
      solarTerm: `${activeTerm.key}后 · 节令换月`,
      zodiac: earthlyBranches[(now.getFullYear() - 4) % 12],
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()],
      construct: pickBySeed(['建日', '除日', '满日', '平日', '定日', '执日', '破日', '危日', '成日', '收日', '开日', '闭日'], dayPillar.index),
      dutyGod: pickBySeed(['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈'], dayPillar.index + 3),
      clash: `冲${earthlyBranches[(earthlyBranches.indexOf(dayPillar.branch) + 6) % 12]}`,
      monthLabel: `${now.getMonth() + 1}月`,
      days
    },
    good: ['整理计划', '读书静心', '复盘校验'],
    avoid: ['冲动决策', '过度消费', '轻信传言'],
    daoist: {
      dateText: '道历内测口径 · 权威校验规划',
      fasting: pickBySeed(['清净自省', '谨言慎行', '安神养气', '整理坛案'], seed),
      practice: [0, 1, 2].map((offset) => pickBySeed(practicePool, seed + offset * 7)),
      classic: pickBySeed(classicPool, seed + 5),
      dayCourse: pickBySeed(dayCoursePool, seed + 9),
      festival: pickBySeed(['今日未见固定道教节日提示', '可查祖师圣诞与宫观日课', '宜作日常斋心省身'], seed + 13),
      orthodox: [
        '二十四节气时刻已用太阳黄经本地搜索',
        '农历朔望、道历节日、祖师圣诞仍待正式权威数据源',
        '建除、值神、冲煞为测试版规则提示'
      ],
      note: '正式版建议接入道历节日、祖师圣诞、斋日与宫观日课数据。'
    },
    note: '万年历干支使用本地规则引擎，农历朔望建议正式版接入权威数据源。'
  };
}

module.exports = {
  hexagramDatabase,
  buildBaziProfile,
  buildHexagram,
  buildQimenChart,
  buildTimeLines,
  lineToPreview,
  randomYao,
  todayAlmanac
};
