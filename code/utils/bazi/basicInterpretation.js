const { getTenGod } = require('./coreEngine');

// 天干五行阴阳
const STEM_META = {
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

// 地支本气五行
const BRANCH_ELEMENT = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水'
};

// 地支藏干
const HIDDEN_STEMS_BY_BRANCH = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲']
};

// 五行对应颜色（青玄风格）
const ELEMENT_COLOR = {
  木: '#4A7C59', // 青
  火: '#A63A3A', // 朱
  土: '#8B7355', // 褐黄
  金: '#B8B8B8', // 银白
  水: '#3A5A7C'  // 玄青
};

// 五行生克关系
const ELEMENT_GENERATE = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const ELEMENT_CONTROL = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const ELEMENT_SAME = { 木: '木', 火: '火', 土: '土', 金: '金', 水: '水' };

/**
 * 统计五行分布
 * @param {Object} result pageAdapter返回的排盘结果
 * @returns {Array} 五行统计数据
 */
function getElementStats(result) {
  const distribution = result.distribution || [];
  return distribution.map(item => ({
    name: item.name,
    count: item.count,
    percent: item.percent,
    color: ELEMENT_COLOR[item.name] || '#666666'
  }));
}

/**
 * 判断日主旺衰
 * @param {Object} result pageAdapter返回的排盘结果
 * @returns {Object} 旺衰结果
 */
function getStrength(result) {
  const dayMaster = result.dayMaster;
  const dayElement = dayMaster.element;
  const pillars = result.pillars || [];
  
  let score = 0;
  const basis = [];

  // 1. 得令：月令是否生扶日主（40分权重）
  const monthPillar = pillars.find(p => p.label === '月柱');
  if (monthPillar) {
    const monthBranchElement = BRANCH_ELEMENT[monthPillar.branch];
    // 月令本气
    const monthMainHiddenStem = HIDDEN_STEMS_BY_BRANCH[monthPillar.branch]?.[0];
    const monthMainElement = monthMainHiddenStem ? STEM_META[monthMainHiddenStem]?.element : monthBranchElement;
    
    if (monthMainElement === dayElement) {
      score += 40;
      basis.push('月令本气与日主同类，得令');
    } else if (ELEMENT_GENERATE[monthMainElement] === dayElement) {
      score += 30;
      basis.push('月令本气生扶日主，得令气');
    } else {
      basis.push('月令克泄日主，不得令');
    }
  }

  // 2. 得地：地支通根（30分权重）
  let rootCount = 0;
  pillars.forEach(pillar => {
    const hiddenStems = pillar.hiddenStems || [];
    const hasRoot = hiddenStems.some(hs => STEM_META[hs.stem]?.element === dayElement);
    if (hasRoot) rootCount++;
  });
  if (rootCount >= 3) {
    score += 30;
    basis.push(`地支${rootCount}处通根，得地深厚`);
  } else if (rootCount === 2) {
    score += 22;
    basis.push('地支2处通根，得地');
  } else if (rootCount === 1) {
    score += 12;
    basis.push('地支1处通根，得地较浅');
  } else {
    basis.push('地支全无通根，不得地');
  }

  // 3. 得势：天干比劫印星（30分权重）
  let helpCount = 0;
  pillars.forEach(pillar => {
    const stemElement = STEM_META[pillar.stem]?.element;
    if (stemElement === dayElement) helpCount++; // 比劫
    else if (ELEMENT_GENERATE[stemElement] === dayElement) helpCount++; // 印星
  });
  // 减去日主自己
  helpCount = Math.max(0, helpCount - 1);
  if (helpCount >= 2) {
    score += 28;
    basis.push(`天干${helpCount}个比劫印星帮扶，得势`);
  } else if (helpCount === 1) {
    score += 18;
    basis.push('天干1个印比帮扶，得势一般');
  } else {
    basis.push('天干无印比帮扶，不得势');
  }

  // 判定旺衰
  let status;
  if (score >= 65) {
    status = '身旺';
  } else if (score <= 35) {
    status = '身弱';
  } else {
    status = '中和';
  }

  return {
    status,
    score: Math.min(100, Math.max(0, score)),
    basis
  };
}

// 找生我的元素（印星）
function getGenerateElement(element) {
  return Object.keys(ELEMENT_GENERATE).find(key => ELEMENT_GENERATE[key] === element) || '';
}

// 找克我的元素（官杀）
function getControlElement(element) {
  return Object.keys(ELEMENT_CONTROL).find(key => ELEMENT_CONTROL[key] === element) || '';
}

/**
 * 判断喜用神和忌神
 * @param {Object} result pageAdapter返回的排盘结果
 * @param {Object} strength 旺衰结果
 * @returns {Object} 喜忌神结果
 */
function getUsefulGod(result, strength) {
  const dayElement = result.dayMaster.element;
  const useful = [];
  const avoid = [];
  let basis = '';

  if (strength.status === '身旺') {
    // 身旺：克泄耗为用，生扶为忌
    useful.push(getControlElement(dayElement)); // 克我者官杀
    useful.push(ELEMENT_GENERATE[dayElement]); // 我生者食伤
    useful.push(ELEMENT_CONTROL[dayElement]); // 我克者财星
    avoid.push(dayElement); // 同类比劫
    avoid.push(getGenerateElement(dayElement)); // 生我者印星
    basis = '身旺宜克泄耗，忌生扶';
  } else if (strength.status === '身弱') {
    // 身弱：生扶为用，克泄耗为忌
    useful.push(dayElement); // 同类比劫
    useful.push(getGenerateElement(dayElement)); // 生我者印星
    avoid.push(getControlElement(dayElement)); // 克我者官杀
    avoid.push(ELEMENT_GENERATE[dayElement]); // 我生者食伤
    avoid.push(ELEMENT_CONTROL[dayElement]); // 我克者财星
    basis = '身弱宜生扶，忌克泄耗';
  } else {
    // 中和：顺用月令
    const monthPillar = result.pillars.find(p => p.label === '月柱');
    const monthMainHiddenStem = monthPillar ? HIDDEN_STEMS_BY_BRANCH[monthPillar.branch]?.[0] : '';
    const monthElement = monthMainHiddenStem ? STEM_META[monthMainHiddenStem]?.element : '';
    if (monthElement) {
      useful.push(monthElement);
      useful.push(ELEMENT_GENERATE[monthElement]);
      avoid.push(ELEMENT_CONTROL[monthElement]);
    }
    basis = '命局中和，以月令为用';
  }

  // 去重
  const uniqueUseful = [...new Set(useful)].filter(Boolean);
  const uniqueAvoid = [...new Set(avoid)].filter(Boolean);

  return {
    useful: uniqueUseful,
    usefulText: uniqueUseful.join('、'),
    avoid: uniqueAvoid,
    avoidText: uniqueAvoid.join('、'),
    basis
  };
}

/**
 * 判断格局
 * @param {Object} result pageAdapter返回的排盘结果
 * @returns {Object} 格局结果
 */
function getPattern(result) {
  const dayStem = result.dayMaster.stem;
  const monthPillar = result.pillars.find(p => p.label === '月柱');
  const basis = [];

  if (!monthPillar) {
    return { name: '正格', basis: ['月令不明，以正格论'] };
  }

  // 取月令本气十神
  const monthMainHiddenStem = HIDDEN_STEMS_BY_BRANCH[monthPillar.branch]?.[0];
  if (!monthMainHiddenStem) {
    return { name: '正格', basis: ['月令藏干不明，以正格论'] };
  }

  const mainTenGod = getTenGod(dayStem, monthMainHiddenStem);
  basis.push(`月令本气${monthMainHiddenStem}为${mainTenGod}`);

  // 普通格局映射
  const patternMap = {
    '正官': '正官格',
    '七杀': '七杀格',
    '正印': '正印格',
    '偏印': '偏印格',
    '正财': '正财格',
    '偏财': '偏财格',
    '食神': '食神格',
    '伤官': '伤官格',
    '比肩': '建禄格',
    '劫财': '羊刃格'
  };

  const patternName = patternMap[mainTenGod] || '正格';
  
  // 特殊格局判断（条件严格，暂只做明显的从格判断，后续迭代完善）
  // 这里先只返回正格，特殊格局后续版本再加
  basis.push('按月令本气取格');

  return {
    name: patternName,
    basis
  };
}

/**
 * 生成基础解读结果
 * @param {Object} result pageAdapter.buildReadingFromForm返回的排盘结果
 * @returns {Object} 基础解读结果
 */
function getBasicInterpretation(result) {
  if (!result) return null;

  const strength = getStrength(result);
  const usefulGod = getUsefulGod(result, strength);
  const pattern = getPattern(result);
  const elementStats = getElementStats(result);

  return {
    elementStats,
    strength,
    usefulGod,
    pattern
  };
}

module.exports = {
  getBasicInterpretation
};
