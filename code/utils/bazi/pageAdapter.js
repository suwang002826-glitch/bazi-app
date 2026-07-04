const {
  buildBaziChart,
  getSolarTermTime,
  getTenGod,
  STEMS,
  BRANCHES
} = require('./coreEngine');
const { normalizeBaziInput } = require('./inputNormalizer');
const { RULES } = require('./constants');

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

const PILLAR_KEY_BY_LABEL = {
  年柱: 'year',
  月柱: 'month',
  日柱: 'day',
  时柱: 'hour'
};

const TERM_ORDER = ['小寒', '立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪'];

const GZ_INDEX_BY_PAIR = (() => {
  const map = {};
  for (let index = 0; index < 60; index += 1) {
    const stem = STEMS[index % 10];
    const branch = BRANCHES[index % 12];
    if (!map[stem]) map[stem] = {};
    map[stem][branch] = index;
  }
  return map;
})();

function getElementName(stem) {
  return STEM_META[stem] ? STEM_META[stem].element : '';
}

function getJulianDayNumber(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function getDayIndexFromDate(date) {
  return ((getJulianDayNumber(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) + 49) % 60 + 60) % 60;
}

function getVoidBranchesByDate(date) {
  const dayIndex = getDayIndexFromDate(date);
  const start = Math.floor(dayIndex / 10) * 10;
  const inCycle = [];
  for (let i = 0; i < 10; i += 1) {
    inCycle.push(BRANCHES[(start + i) % 12]);
  }
  return BRANCHES.filter((item) => !inCycle.includes(item));
}

function normalizeVoidBranches(branches = []) {
  return branches.map((branch) => (branch === '寡' ? '寅' : branch));
}

function getPillarIndexByGanZhi(stem, branch) {
  const byStem = GZ_INDEX_BY_PAIR[stem];
  if (!byStem) return -1;
  return typeof byStem[branch] === 'number' ? byStem[branch] : -1;
}

function getXunVoidBranches(stem, branch) {
  const idx = getPillarIndexByGanZhi(stem, branch);
  if (idx < 0) return [];
  const start = Math.floor(idx / 10) * 10;
  const inCycle = [];
  for (let i = 0; i < 10; i += 1) {
    inCycle.push(BRANCHES[(start + i) % 12]);
  }
  return BRANCHES.filter((item) => !inCycle.includes(item));
}

function buildHiddenStems(branch, dayStem) {
  const stems = HIDDEN_STEMS_BY_BRANCH[branch] || [];
  return stems.map((stem) => ({
    stem,
    element: getElementName(stem),
    tenGod: getTenGod(dayStem, stem)
  }));
}

function buildPillarItem(label, pillar, stemGod, dayStem) {
  const hiddenStems = buildHiddenStems(pillar.branch, dayStem);
  const branchMainStem = hiddenStems[0] ? hiddenStems[0].stem : '';
  const xunVoidBranches = normalizeVoidBranches(getXunVoidBranches(pillar.stem, pillar.branch));
  const fullStemBranch = `${pillar.stem}${pillar.branch}`;

  return {
    label,
    stem: pillar.stem,
    branch: pillar.branch,
    fullStemBranch,
    stems: fullStemBranch,
    stemTenGod: stemGod,
    stemGod,
    branchGod: branchMainStem ? getTenGod(dayStem, branchMainStem) : '',
    element: `${getElementName(pillar.stem)}/${getElementName(branchMainStem) || BRANCH_ELEMENT[pillar.branch] || ''}`,
    hiddenStems,
    xunVoidBranches,
    xunVoidText: xunVoidBranches.length ? xunVoidBranches.join('、') : '无',
    voidBranches: xunVoidBranches,
    isVoid: xunVoidBranches.length > 0,
    voidText: xunVoidBranches.length ? xunVoidBranches.join('、') : '无'
  };
}

function resolveFormGender(form = {}) {
  if (form.gender !== undefined && form.gender !== null) return form.gender;
  if (form.sex !== undefined && form.sex !== null) return form.sex;
  return '男';
}

function buildLuckCyclesFromDaYun(coreResult, form = {}) {
  const daYun = coreResult && coreResult.daYun;
  if (!daYun || !Array.isArray(daYun.list) || daYun.list.length === 0) {
    return {
      cycles: [],
      direction: '',
      startAge: null,
      startMonth: null,
      startDay: null,
      targetJie: '',
      startDate: ''
    };
  }

  const cycles = daYun.list.map((item) => {
    const startAge = Number.isFinite(item.startAge) ? item.startAge : 0;
    const endAge = Number.isFinite(item.endAge) ? item.endAge : startAge + 9;
    const startYear = Number.isFinite(item.startYear) ? item.startYear : 0;
    const endYear = Number.isFinite(item.endYear) ? item.endYear : startYear + 9;

    return {
      label: item.label || `${item.index + 1}步大运`,
      value: `${item.stem || ''}${item.branch || ''}`,
      fullStemBranch: `${item.stem || ''}${item.branch || ''}`,
      stem: item.stem || '',
      branch: item.branch || '',
      startAge,
      endAge,
      startYear,
      endYear,
      ageRange: `${startAge}-${endAge}岁`,
      yearRange: `${startYear}-${endYear}`,
      tenGod: item.tenGod || '',
      naYin: item.naYin || '',
      xunVoidBranches: item.xunVoidBranches || [],
      xunVoidText: item.xunVoidText || '',
      direction: daYun.direction || '',
      index: item.index
    };
  });

  return {
    cycles,
    direction: daYun.direction || '',
    startAge: daYun.startAge,
    startMonth: daYun.startMonth,
    startDay: daYun.startDay,
    targetJie: daYun.targetJie || '',
    startDate: daYun.startDate || '',
    diffDays: daYun.diffDays || 0,
    label: `起运:${daYun.startAge || 0}岁${resolveFormGender(form)}`
  };
}

function buildFlatFlowYears(liuNianList = []) {
  return liuNianList.map((ln) => {
    const months = (ln.months || []).map((m) => ({
      label: '流月',
      monthTitle: m.name,
      termName: m.jieName,
      termTime: `${m.startDate} 00:00:00`,
      dateShort: m.startDate.slice(5),
      value: m.ganZhi,
      tenGod: m.tenGod,
      naYin: m.naYin,
      startDate: m.startDate,
      endDate: m.endDate,
      influenceSummary: '以月干支看短周期应事',
      interactionSummary: '以日主喜忌为先'
    }));

    return {
      age: ln.age,
      year: ln.year,
      value: ln.ganZhi,
      yearRange: `${ln.year}`,
      ageRange: `${ln.age}岁`,
      tenGod: ln.tenGod,
      naYin: ln.naYin,
      startDate: ln.startDate,
      endDate: ln.endDate,
      lichunDate: ln.lichunDate,
      influenceSummary: '运势以当运干支与命局互动为参照',
      interactionSummary: '以十神生克制化观察发展变化',
      triggerPoints: [],
      months
    };
  });
}

function buildGroupedFlowYears(flatFlowYears, luckCycles = []) {
  // 把流年按大运分组，每个大运10年
  const grouped = [];
  
  // 如果有大运数据，按大运年份范围分组
  if (luckCycles && luckCycles.length > 0) {
    luckCycles.forEach((cycle) => {
      const startYear = cycle.startYear;
      const endYear = cycle.endYear;
      const yearsInCycle = flatFlowYears.filter((ln) => ln.year >= startYear && ln.year <= endYear);
      if (yearsInCycle.length > 0) {
        const firstYear = yearsInCycle[0];
        grouped.push({
          year: firstYear.year,
          value: firstYear.value,
          yearRange: `${startYear}-${endYear}`,
          ageRange: `${cycle.startAge}-${cycle.endAge}岁`,
          tenGod: firstYear.tenGod,
          naYin: firstYear.naYin,
          startDate: firstYear.startDate,
          endDate: yearsInCycle[yearsInCycle.length - 1].endDate,
          influenceSummary: '运势以当运干支与命局互动为参照',
          interactionSummary: '以十神生克制化观察发展变化',
          triggerPoints: [],
          months: firstYear.months || [],
          allYears: yearsInCycle
        });
      }
    });
  } else {
    // 没有大运数据时，简单按10年分组
    for (let i = 0; i < flatFlowYears.length; i += 10) {
      const group = flatFlowYears.slice(i, i + 10);
      if (group.length > 0) {
        const firstYear = group[0];
        grouped.push({
          year: firstYear.year,
          value: firstYear.value,
          yearRange: `${firstYear.year}-${group[group.length - 1].year}`,
          ageRange: `${firstYear.age}-${group[group.length - 1].age}岁`,
          tenGod: firstYear.tenGod,
          naYin: firstYear.naYin,
          startDate: firstYear.startDate,
          endDate: group[group.length - 1].endDate,
          influenceSummary: '运势以当运干支与命局互动为参照',
          interactionSummary: '以十神生克制化观察发展变化',
          triggerPoints: [],
          months: firstYear.months || [],
          allYears: group
        });
      }
    }
  }

  // 为每个分组生成miniPillars需要的完整10年数据
  return grouped.map((group) => {
    const miniPillars = [];
    for (let offset = 0; offset < 10; offset++) {
      const targetYear = group.year + offset;
      const yearData = group.allYears.find((y) => y.year === targetYear);
      if (yearData) {
        miniPillars.push({
          year: yearData.year,
          value: yearData.value,
          tenGod: yearData.tenGod,
          months: yearData.months || []
        });
      } else {
        // 如果数据不足，用干支偏移计算
        const stemIndex = (STEMS.indexOf(group.value.charAt(0)) + offset) % 10;
        const branchIndex = (BRANCHES.indexOf(group.value.charAt(1)) + offset) % 12;
        miniPillars.push({
          year: targetYear,
          value: `${STEMS[stemIndex]}${BRANCHES[branchIndex]}`,
          tenGod: '',
          months: []
        });
      }
    }
    return {
      ...group,
      miniPillars
    };
  });
}

function normalizeElementCount(rawCount = {}) {
  return {
    金: Number(rawCount.金 || 0),
    木: Number(rawCount.木 || 0),
    水: Number(rawCount.水 || 0),
    火: Number(rawCount.火 || 0),
    土: Number(rawCount.土 || 0)
  };
}

function getDestinyLabel(gender) {
  return gender === '女' ? '坤造' : '乾造';
}

function formatDistribution(elementCount) {
  const total = Object.values(elementCount).reduce((sum, value) => sum + value, 0) || 1;
  return Object.keys(elementCount).map((name) => ({
    name,
    count: elementCount[name],
    percent: Math.round((elementCount[name] / total) * 100)
  }));
}

function getSolarTermsAroundDate(date, termsData) {
  const year = date.getUTCFullYear();
  const currentYearTerms = TERM_ORDER.map((termName) => ({
    name: termName,
    date: getSolarTermTime(year, termName, termsData)
  })).sort((a, b) => a.date.getTime() - b.date.getTime());

  let previous = currentYearTerms[0];
  let next = null;

  for (let i = 0; i < currentYearTerms.length; i += 1) {
    if (currentYearTerms[i].date <= date) {
      previous = currentYearTerms[i];
    } else if (!next) {
      next = currentYearTerms[i];
      break;
    }
  }

  if (!next) {
    next = {
      name: '小寒',
      date: getSolarTermTime(year + 1, '小寒', termsData)
    };
  }

  if (!previous || !previous.date || previous.date > date) {
    previous = {
      name: '大雪',
      date: getSolarTermTime(year - 1, '大雪', termsData)
    };
  }

  return { previous, next };
}

function getCalendarConversionSummary(form = {}) {
  const conversion = form.calendarConversion || {};
  const isLunar = conversion.calendarType === 'lunar';
  const lunarYear = conversion.lunarYear;
  const lunarMonth = conversion.lunarMonth;
  const lunarDay = conversion.lunarDay;

  return {
    calendarType: isLunar ? '农历' : '公历',
    modeText: isLunar ? '农历输入' : '公历输入',
    source: conversion.source || 'direct_solar_input',
    sourceNote: conversion.sourceNote || '',
    inputCalendarText: isLunar
      ? `${lunarYear || ''}年${lunarMonth || ''}月${lunarDay || ''}日${conversion.isLeapMonth ? '（闰月）' : ''}`
      : (form.birthDate || ''),
    outputCalendarText: form.birthDate || '',
    warnings: conversion.warnings || []
  };
}

function buildLegacyBaziResult(coreResult, form = {}) {
  const { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar } = coreResult.pillars;
  const dayStem = dayPillar.stem;

  const yearText = `${yearPillar.stem}${yearPillar.branch}`;
  const monthText = `${monthPillar.stem}${monthPillar.branch}`;
  const dayText = `${dayPillar.stem}${dayPillar.branch}`;
  const hourText = `${hourPillar.stem}${hourPillar.branch}`;

  const naYinByKey = {
    year: coreResult.naYin.year,
    month: coreResult.naYin.month,
    day: coreResult.naYin.day,
    hour: coreResult.naYin.hour
  };

  const pillars = [
    buildPillarItem('年柱', yearPillar, coreResult.tenGods.year, dayStem),
    buildPillarItem('月柱', monthPillar, coreResult.tenGods.month, dayStem),
    buildPillarItem('日柱', dayPillar, coreResult.tenGods.day, dayStem),
    buildPillarItem('时柱', hourPillar, coreResult.tenGods.hour, dayStem)
  ];

  const elementCount = normalizeElementCount(coreResult.elementCount);
  const distribution = formatDistribution(elementCount);
  const terms = getSolarTermsAroundDate(new Date(coreResult.adjustedDateTime), form.termsData || null);
  const dayVoidBranches = normalizeVoidBranches(getVoidBranchesByDate(new Date(coreResult.adjustedDateTime)));
  const dayVoidText = dayVoidBranches.includes(dayPillar.branch) ? '空' : '不空';

  const pillarExtras = pillars.map((pillar) => {
    const key = PILLAR_KEY_BY_LABEL[pillar.label] || 'year';
    return {
      label: pillar.label,
      voidText: pillar.voidText,
      voidBranches: pillar.voidBranches,
      isVoid: pillar.isVoid,
      xunVoidBranches: pillar.xunVoidBranches,
      nayin: naYinByKey[key] || '',
      stemGod: pillar.stemGod,
      branchGod: pillar.branchGod,
      hiddenStems: pillar.hiddenStems
    };
  });

  const dominant = distribution.reduce((maxItem, item) => (item.count > maxItem.count ? item : maxItem), distribution[0]);

  const detailProfile = {
    zodiac: `${ZODIAC_BY_BRANCH[yearPillar.branch]}`,
    voidText: '无',
    voidBranches: dayVoidBranches,
    dayVoidText,
    dayVoidBranches,
    pillarExtras,
    pillarSpirits: [],
    petal: `${ZODIAC_BY_BRANCH[yearPillar.branch]}`
  };

  // 先构建大运数据，再用大运年份范围分组流年
  const luck = buildLuckCyclesFromDaYun(coreResult, form);
  const flatFlowYears = buildFlatFlowYears(coreResult.liuNian || []);
  const groupedFlowYears = buildGroupedFlowYears(flatFlowYears, luck.cycles);
  // 找到出生时间所在的流月作为默认当前流月
  const birthDateStr = new Date(coreResult.adjustedDateTime).toISOString().split('T')[0];
  let currentFlowMonth = flatFlowYears[0]?.months?.[0] || {
    label: '流月',
    monthTitle: `${terms.previous.name}月`,
    termTime: terms.previous.date.toISOString().slice(0, 19).replace('T', ' '),
    dateShort: terms.previous.date.toISOString().slice(5, 10),
    value: monthText,
    tenGod: coreResult.tenGods.month,
    influenceSummary: '以月干支看短周期应事',
    interactionSummary: '以日主喜忌为先'
  };
  for (const m of (flatFlowYears[0]?.months || [])) {
    if (birthDateStr >= m.startDate && birthDateStr <= m.endDate) {
      currentFlowMonth = m;
      break;
    }
  }
  const flowMonths = [currentFlowMonth];

  const destinyLabel = getDestinyLabel(form.gender);
  const trueSolarApplied = Boolean(coreResult.trueSolarTime && coreResult.trueSolarTime.applied);

  const professional = {
    pattern: { name: '平和', basis: ['以八字干支基础结构为主'] },
    strength: { status: '中和', ratio: 50, basis: ['P0命局主导'] },
    usefulGod: {
      useful: [],
      usefulText: '待观察',
      avoidText: '过旺同类',
      basis: '以五行衡量为参考'
    },
    chartSummary: {
      oneLine: `${yearText} ${monthText} ${dayText} ${hourText}`,
      highlights: ['五行分布', '十神对照', '空亡核对'],
      tags: ['P0', '核心排盘', '准则对齐'],
      caution: `真太阳时${trueSolarApplied ? '已计算修正' : '未计算修正'}，修正说明：${coreResult.trueSolarTime.label}`
    },
    natalRelations: [],
    growthStages: [],
    spirits: []
  };

  return {
    dayMaster: {
      stem: dayStem,
      text: `${dayStem}${STEM_META[dayStem].element}`,
      element: STEM_META[dayStem].element,
      yinYang: STEM_META[dayStem].yinYang
    },
    pillarsP0: {
      year: {
        ...pillars[0],
        zodiac: `${ZODIAC_BY_BRANCH[yearPillar.branch]}年`,
        nayin: naYinByKey.year
      },
      month: { ...pillars[1], zodiac: '', nayin: naYinByKey.month },
      day: { ...pillars[2], zodiac: '', nayin: naYinByKey.day },
      hour: { ...pillars[3], zodiac: '', nayin: naYinByKey.hour }
    },
    tenGodP0: {
      yearStemGod: coreResult.tenGods.year,
      yearBranchGod: pillars[0].branchGod,
      monthStemGod: coreResult.tenGods.month,
      monthBranchGod: pillars[1].branchGod,
      dayStemGod: coreResult.tenGods.day,
      dayBranchGod: pillars[2].branchGod,
      hourStemGod: coreResult.tenGods.hour,
      hourBranchGod: pillars[3].branchGod
    },
    fiveElementsP0: {
      counts: elementCount,
      dominant: dominant ? dominant.name : '土',
      waxing: BRANCH_ELEMENT[monthPillar.branch]
    },
    naYinP0: {
      ...naYinByKey,
      destiny: naYinByKey.year
    },
    solarTermInfoP0: {
      previous: { name: terms.previous.name, time: terms.previous.date.toISOString() },
      next: { name: terms.next.name, time: terms.next.date.toISOString() },
      distanceFromPreviousDays: Math.max(0, Math.round((new Date(coreResult.adjustedDateTime).getTime() - terms.previous.date.getTime()) / 86400000))
    },
    displayName: form.name || '命例',
    destinyLabel,
    gender: form.gender || '男',
    title: `${form.name || '命例'}${destinyLabel}`,
    betaLabel: '排盘引擎 v0.4.2',
    solarTime: `${form.birthDate || ''} ${form.birthTime || ''}`,
    adjustedSolarTime: coreResult.adjustedDateTime,
    birthPlace: form.birthPlace || '',
    longitude: String(form.longitude || ''),
    ziHourLabel: coreResult.ziHourLabel || '',
    calendarConversion: {
      ...getCalendarConversionSummary(form),
      calendarType: form.isLunar ? 'lunar' : 'solar',
      isLunar: Boolean(form.isLunar),
      isLeapMonth: Boolean(form.isLeapMonth),
      useTrueSolarTime: trueSolarApplied,
      useEarlyLateZi: Boolean(form.useEarlyLateZi)
    },
    pillars,
    distribution,
    luck,
    flowYears: flatFlowYears,
    flatFlowYears,
    groupedFlowYears,
    flowMonths,
    professional,
    detailProfile,
    dayVoid: {
      branches: dayVoidBranches,
      text: dayVoidText
    },
    calibration: {
      enabled: trueSolarApplied,
      correctionMinutes: coreResult.trueSolarTime.correctionMinutes,
      hourChanged: false,
      note: coreResult.trueSolarTime.label
    },
    summary: `${yearText}(${naYinByKey.year}) ${monthText}(${naYinByKey.month}) ${dayText}(${naYinByKey.day}) ${hourText}(${naYinByKey.hour})`,
    aiText: `参考十神 ${coreResult.tenGods.year} / ${coreResult.tenGods.month} / ${coreResult.tenGods.day} / ${coreResult.tenGods.hour}`,
    flowTriggerSummary: {
      summary: `${yearText} ${monthText} ${dayText} ${hourText}`
    },
    engineInfo: [
      '当前为 v0.4.2 稳定版，真太阳时由核心计算模块输出',
      `${ZODIAC_BY_BRANCH[yearPillar.branch]}年`
    ]
  };
}

function buildReadingFromForm(form, options = {}) {
  const merged = { ...form, ...options };
  const normalizedInput = normalizeBaziInput(merged);
  const normalizedForm = normalizedInput.form;
  const derivedIsLunar = Boolean(
    merged.isLunar
    || merged.calendarType === 'lunar'
    || merged.calendarMode === 'lunar'
    || (normalizedForm.calendarConversion && normalizedForm.calendarConversion.calendarType === 'lunar')
  );
  const mergedInput = {
    ...merged,
    useTrueSolarTime: merged.useTrueSolarTime !== undefined
      ? merged.useTrueSolarTime
      : merged.use_true_solar,
    useDST: merged.useDST !== undefined
      ? merged.useDST
      : merged.use_dst,
    useSummerTime: merged.useSummerTime !== undefined
      ? merged.useSummerTime
      : merged.use_dst,
    useEarlyLateZi: merged.useEarlyLateZi !== undefined
      ? merged.useEarlyLateZi
      : merged.use_early_late_zi,
    longitude: merged.longitude === undefined || merged.longitude === null || merged.longitude === ''
      ? RULES.defaultLongitude
      : merged.longitude,
    latitude: merged.latitude === undefined || merged.latitude === null || merged.latitude === ''
      ? RULES.defaultLatitude
      : merged.latitude
  };
  const calculationForm = {
    ...mergedInput,
    ...normalizedForm,
    useDST: Boolean(
      mergedInput.useDST
      || mergedInput.useSummerTime
      || mergedInput.applyDST
      || RULES.defaultDST
    ),
    useSummerTime: Boolean(
      mergedInput.useDST
      || mergedInput.useSummerTime
      || mergedInput.applyDST
      || RULES.defaultDST
    ),
    useTrueSolarTime: Boolean(
      mergedInput.useTrueSolarTime
      ?? RULES.defaultTrueSolarTime
    ),
    isLunar: derivedIsLunar,
    useEarlyLateZi: Boolean(
      mergedInput.useEarlyLateZi
      || RULES.defaultEarlyLateZi
    )
  };
  const coreInput = {
    birthDate: calculationForm.birthDate,
    birthTime: calculationForm.birthTime,
    longitude: calculationForm.longitude,
    latitude: calculationForm.latitude,
    gender: resolveFormGender(calculationForm),
    useTrueSolarTime: calculationForm.useTrueSolarTime,
    useEarlyLateZi: calculationForm.useEarlyLateZi,
    termsData: calculationForm.termsData || null
  };

  const coreResult = buildBaziChart(coreInput, { ...calculationForm });
  const legacy = buildLegacyBaziResult(coreResult, calculationForm);

  return {
    ...legacy,
    calendarConversion: {
      ...(legacy.calendarConversion || {}),
      ...(calculationForm.calendarConversion || {}),
      warnings: calculationForm.calendarConversion ? calculationForm.calendarConversion.warnings || [] : []
    }
  };
}

module.exports = {
  buildReadingFromForm,
  buildLegacyBaziResult
};
