const elementClassMap = {
  木: 'wood',
  火: 'fire',
  土: 'earth',
  金: 'metal',
  水: 'water'
};

const stemElementMap = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水'
};

const branchElementMap = {
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
  申: '金', 酉: '金',
  亥: '水', 子: '水'
};

const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const elementFlow = ['木', '火', '土', '金', '水'];
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
const hiddenStemsByBranch = {
  子: [{ stem: '癸' }],
  丑: [{ stem: '己' }, { stem: '癸' }, { stem: '辛' }],
  寅: [{ stem: '甲' }, { stem: '丙' }, { stem: '戊' }],
  卯: [{ stem: '乙' }],
  辰: [{ stem: '戊' }, { stem: '乙' }, { stem: '癸' }],
  巳: [{ stem: '丙' }, { stem: '庚' }, { stem: '戊' }],
  午: [{ stem: '丁' }, { stem: '己' }],
  未: [{ stem: '己' }, { stem: '丁' }, { stem: '乙' }],
  申: [{ stem: '庚' }, { stem: '壬' }, { stem: '戊' }],
  酉: [{ stem: '辛' }],
  戌: [{ stem: '戊' }, { stem: '辛' }, { stem: '丁' }],
  亥: [{ stem: '壬' }, { stem: '甲' }]
};
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

const flowMonthTerms = [
  { key: '立春', date: '02-04', branchIndex: 2 },
  { key: '惊蛰', date: '03-05', branchIndex: 3 },
  { key: '清明', date: '04-05', branchIndex: 4 },
  { key: '立夏', date: '05-05', branchIndex: 5 },
  { key: '芒种', date: '06-05', branchIndex: 6 },
  { key: '小暑', date: '07-07', branchIndex: 7 },
  { key: '立秋', date: '08-07', branchIndex: 8 },
  { key: '白露', date: '09-07', branchIndex: 9 },
  { key: '寒露', date: '10-08', branchIndex: 10 },
  { key: '立冬', date: '11-07', branchIndex: 11 },
  { key: '大雪', date: '12-07', branchIndex: 0 },
  { key: '小寒', date: '01-05', branchIndex: 1 }
];

function getElementClass(element) {
  return elementClassMap[element] || 'earth';
}

function getElementIcon(element) {
  const icons = { 木: '木', 火: '火', 土: '土', 金: '金', 水: '水' };
  return icons[element] || '';
}

function createStemCell(stem, element) {
  return {
    text: stem,
    lines: [],
    richLines: [],
    hasRichLines: false,
    element,
    elementIcon: getElementIcon(element),
    className: getElementClass(element),
    large: true
  };
}

function createTextCell(text) {
  const lines = Array.isArray(text)
    ? text
    : String(text || '').split(/[\/、\n]/).map((item) => item.trim()).filter(Boolean);
  return {
    text: lines.length > 1 ? '' : (lines[0] || '—'),
    lines: lines.length > 1 ? lines : [],
    richLines: [],
    hasRichLines: false,
    className: 'plain',
    large: false
  };
}

function createRichCell(lines) {
  const normalized = (lines || []).slice(0, 3);
  const slots = [normalized[0], normalized[1], normalized[2]].map((item) => item || {});
  return {
    text: normalized.length ? '' : '—',
    lines: normalized.map((item) => `${item.stem || ''}${item.tenGod || ''}`).filter(Boolean),
    richLines: normalized,
    hasRichLines: true,
    hidden1Show: Boolean(slots[0].stem),
    hidden1Stem: slots[0].stem || '',
    hidden1God: slots[0].tenGod || '',
    hidden1Class: slots[0].className || 'plain',
    hidden2Show: Boolean(slots[1].stem),
    hidden2Stem: slots[1].stem || '',
    hidden2God: slots[1].tenGod || '',
    hidden2Class: slots[1].className || 'plain',
    hidden3Show: Boolean(slots[2].stem),
    hidden3Stem: slots[2].stem || '',
    hidden3God: slots[2].tenGod || '',
    hidden3Class: slots[2].className || 'plain',
    className: 'plain',
    large: false
  };
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

function getProsperityStage(dayStem, branch) {
  const start = growthStart[dayStem];
  if (!start) return '—';
  const startIndex = earthlyBranches.indexOf(start.branch);
  const branchIndex = earthlyBranches.indexOf(branch);
  if (startIndex < 0 || branchIndex < 0) return '—';
  const offset = start.direction > 0
    ? (branchIndex - startIndex + 12) % 12
    : (startIndex - branchIndex + 12) % 12;
  return growthStages[offset] || '—';
}

function getNayin(value) {
  return nayinMap[value] || '待校验';
}

function createHiddenLines(dayStem, branch) {
  return (hiddenStemsByBranch[branch] || []).map((item) => ({
    stem: item.stem,
    tenGod: getTenGod(dayStem, item.stem),
    className: getElementClass(stemElementMap[item.stem])
  }));
}

function createBaziPlate(result) {
  const pillars = result.pillars || [];
  const extrasByLabel = (result.detailProfile.pillarExtras || []).reduce((map, item) => {
    map[item.label] = item;
    return map;
  }, {});
  const growthByLabel = (result.professional.growthStages || []).reduce((map, item) => {
    map[item.label] = item;
    return map;
  }, {});
  const spiritsByLabel = {};
  (result.professional.spirits || []).forEach((spirit) => {
    if (!spirit.hit || !spirit.location) return;
    spirit.location.split('、').forEach((label) => {
      if (!spiritsByLabel[label]) spiritsByLabel[label] = [];
      spiritsByLabel[label].push(spirit.name);
    });
  });

  const columns = pillars.map((pillar) => ({
    label: pillar.label,
    shortLabel: pillar.label.replace('柱', '柱')
  }));
  const stemElements = pillars.map((pillar) => (pillar.element || '').split('/')[0].trim());
  const branchElements = pillars.map((pillar) => (pillar.element || '').split('/')[1].trim());
  const rows = [
    {
      label: '主星',
      cells: pillars.map((pillar) => createTextCell(pillar.stemTenGod))
    },
    {
      label: '天干',
      strong: true,
      cells: pillars.map((pillar, index) => createStemCell(pillar.stem, stemElements[index]))
    },
    {
      label: '地支',
      strong: true,
      cells: pillars.map((pillar, index) => createStemCell(pillar.branch, branchElements[index]))
    },
    {
      label: '藏干',
      cells: pillars.map((pillar) => createRichCell((pillar.hiddenStems || []).map((item) => ({
        stem: item.stem,
        tenGod: item.tenGod,
        className: getElementClass(item.element)
      }))))
    },
    {
      label: '副星',
      cells: pillars.map((pillar) => createTextCell((pillar.hiddenStems || []).map((item) => item.tenGod)))
    },
    {
      label: '星运',
      cells: pillars.map((pillar) => createTextCell(growthByLabel[pillar.label] ? growthByLabel[pillar.label].stage : '—'))
    },
    {
      label: '自坐',
      cells: pillars.map((pillar) => createTextCell(growthByLabel[pillar.label] ? growthByLabel[pillar.label].stage : '—'))
    },
    {
      label: '空亡',
      cells: pillars.map((pillar) => createTextCell(extrasByLabel[pillar.label] ? extrasByLabel[pillar.label].voidText : result.detailProfile.voidText))
    },
    {
      label: '纳音',
      cells: pillars.map((pillar) => createTextCell(extrasByLabel[pillar.label] ? extrasByLabel[pillar.label].nayin : '—'))
    },
    {
      label: '神煞',
      highlight: true,
      cells: pillars.map((pillar) => createTextCell(spiritsByLabel[pillar.label] && spiritsByLabel[pillar.label].length ? spiritsByLabel[pillar.label] : ['—']))
    }
  ];

  return { columns, rows };
}

function splitPillar(value) {
  const text = String(value || '——');
  return {
    stem: text.slice(0, 1) || '—',
    branch: text.slice(1, 2) || '—'
  };
}

function getGanZhiOffset(value, offset) {
  const pillar = splitPillar(value);
  const stemIndex = heavenlyStems.indexOf(pillar.stem);
  const branchIndex = earthlyBranches.indexOf(pillar.branch);
  if (stemIndex < 0 || branchIndex < 0) return '—';
  return `${heavenlyStems[(stemIndex + offset + 10) % 10]}${earthlyBranches[(branchIndex + offset + 12) % 12]}`;
}

function getYearPillarByYear(year) {
  const index = ((Number(year) - 4) % 60 + 60) % 60;
  return {
    stem: heavenlyStems[index % 10],
    branch: earthlyBranches[index % 12],
    value: `${heavenlyStems[index % 10]}${earthlyBranches[index % 12]}`
  };
}

function getBirthYear(result) {
  const match = String(result && result.solarTime || '').match(/^(\d{4})/);
  return match ? Number(match[1]) : NaN;
}

function getLuckStartYear(luck) {
  if (!luck) return NaN;
  if (Number.isFinite(Number(luck.startYear))) return Number(luck.startYear);
  const firstCycle = Array.isArray(luck.cycles) ? luck.cycles[0] : null;
  if (firstCycle && Number.isFinite(Number(firstCycle.yearStart))) return Number(firstCycle.yearStart);
  const rangeStart = firstCycle && String(firstCycle.yearRange || '').split('-')[0];
  return Number.isFinite(Number(rangeStart)) ? Number(rangeStart) : NaN;
}

function getLuckEndYear(result, startYear) {
  const luck = result && result.luck;
  if (luck && Number.isFinite(Number(luck.endYear))) return Number(luck.endYear);
  const birthYear = getBirthYear(result);
  if (Number.isFinite(birthYear)) return birthYear + 105;
  const cycles = luck && Array.isArray(luck.cycles) ? luck.cycles : [];
  const lastCycle = cycles[cycles.length - 1];
  const lastRange = lastCycle && String(lastCycle.yearRange || '').split('-')[1];
  if (Number.isFinite(Number(lastRange))) return Number(lastRange);
  return Number.isFinite(Number(startYear)) ? Number(startYear) + 99 : NaN;
}

function parseYearRange(value) {
  const parts = String(value || '').split('-').map((item) => Number(item));
  return {
    start: Number.isFinite(parts[0]) ? parts[0] : NaN,
    end: Number.isFinite(parts[1]) ? parts[1] : NaN
  };
}

function parseAgeRange(value) {
  const parts = String(value || '').replace(/岁/g, '').split('-').map((item) => Number(item));
  return {
    start: Number.isFinite(parts[0]) ? parts[0] : NaN,
    end: Number.isFinite(parts[1]) ? parts[1] : NaN
  };
}

function normalizeLuckCycle(cycle, index) {
  const yearRange = parseYearRange(cycle.yearRange);
  const ageRange = parseAgeRange(cycle.ageRange);
  const yearStart = Number.isFinite(Number(cycle.yearStart)) ? Number(cycle.yearStart) : yearRange.start;
  const yearEnd = Number.isFinite(Number(cycle.yearEnd)) ? Number(cycle.yearEnd) : yearRange.end;
  const ageStart = Number.isFinite(Number(cycle.ageStart)) ? Number(cycle.ageStart) : ageRange.start;
  const ageEnd = Number.isFinite(Number(cycle.ageEnd)) ? Number(cycle.ageEnd) : ageRange.end;
  return {
    ...cycle,
    label: cycle.label || `第${index + 1}步大运`,
    yearStart,
    yearEnd,
    yearRange: Number.isFinite(yearStart) && Number.isFinite(yearEnd) ? `${yearStart}-${yearEnd}` : cycle.yearRange,
    ageStart,
    ageEnd,
    ageRange: Number.isFinite(ageStart) && Number.isFinite(ageEnd) ? `${ageStart}-${ageEnd}岁` : cycle.ageRange
  };
}

function inferLuckDirection(luck, cycles) {
  const directionText = String(luck && luck.direction || cycles[0] && cycles[0].direction || '');
  if (directionText.includes('逆')) return -1;
  if (directionText.includes('顺')) return 1;
  if (cycles.length >= 2 && getGanZhiOffset(cycles[0].value, 1) === cycles[1].value) return 1;
  if (cycles.length >= 2 && getGanZhiOffset(cycles[0].value, -1) === cycles[1].value) return -1;
  return 1;
}

function normalizeLuckCyclesForEndAge(result, cyclesSource) {
  const source = Array.isArray(cyclesSource) ? cyclesSource : [];
  if (!source.length) return source;

  const luck = result && result.luck || {};
  const cycles = source.map(normalizeLuckCycle);
  const startYear = getLuckStartYear(luck);
  const endYear = getLuckEndYear(result, startYear);
  const endAge = Number.isFinite(Number(luck.endAge)) ? Number(luck.endAge) : 105;
  if (!Number.isFinite(endYear)) return cycles;

  cycles.forEach((cycle, index) => {
    if (!Number.isFinite(Number(cycle.yearStart))) return;
    const next = cycles[index + 1];
    const normalizedEnd = next && Number.isFinite(Number(next.yearStart))
      ? Number(next.yearStart) - 1
      : Math.min(endYear, Number(cycle.yearStart) + 9);
    cycle.yearEnd = normalizedEnd;
    cycle.yearRange = `${cycle.yearStart}-${cycle.yearEnd}`;
  });

  const direction = inferLuckDirection(luck, cycles);
  let last = cycles[cycles.length - 1];
  while (Number(last.yearEnd) < endYear) {
    const nextYearStart = Number(last.yearEnd) + 1;
    const nextYearEnd = Math.min(endYear, nextYearStart + 9);
    const nextAgeStart = Number.isFinite(Number(last.ageEnd))
      ? Math.round((Number(last.ageEnd) + 0.1) * 10) / 10
      : '';
    const nextAgeEnd = Number.isFinite(Number(nextAgeStart))
      ? Math.min(endAge, Math.round((Number(nextAgeStart) + 9.9) * 10) / 10)
      : '';
    const nextValue = getGanZhiOffset(last.value, direction);
    last = {
      label: `第${cycles.length + 1}步大运`,
      value: nextValue,
      ageStart: nextAgeStart,
      ageEnd: nextAgeEnd,
      ageRange: `${nextAgeStart}-${nextAgeEnd}岁`,
      yearStart: nextYearStart,
      yearEnd: nextYearEnd,
      yearRange: `${nextYearStart}-${nextYearEnd}`,
      startDate: last.startDate ? String(last.startDate).replace(/^\d{4}/, String(nextYearStart)) : '',
      startDateText: last.startDate ? `${String(last.startDate).replace(/^\d{4}/, String(nextYearStart))}起运` : '',
      direction: direction > 0 ? '顺排' : '逆排'
    };
    cycles.push(last);
  }

  return cycles;
}

function createFallbackFlowYear(result, year) {
  const pillar = getYearPillarByYear(year);
  const dayStem = result && result.dayMaster && result.dayMaster.stem;
  const birthYear = getBirthYear(result);
  return {
    year,
    age: Number.isFinite(birthYear) ? year - birthYear : '',
    value: pillar.value,
    tenGod: getTenGod(dayStem, pillar.stem),
    stemElement: stemElementMap[pillar.stem],
    branchElement: branchElementMap[pillar.branch],
    influenceSummary: `${year}年${pillar.value}流年，按起运时间轴补齐展示。`,
    interactionSummary: '旧命例或后端结果未返回完整流年轴，前端按年份干支补齐。',
    triggerPoints: []
  };
}

function normalizeFlowYearsForLuck(result, flowYearsSource) {
  const source = Array.isArray(flowYearsSource) ? flowYearsSource : [];
  const startYear = getLuckStartYear(result && result.luck);
  const endYear = getLuckEndYear(result, startYear);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return source;

  const firstYear = source.length ? Number(source[0].year) : NaN;
  const lastYear = source.length ? Number(source[source.length - 1].year) : NaN;
  const hasCompleteAxis = source.length
    && firstYear <= startYear
    && lastYear >= endYear;
  if (hasCompleteAxis) {
    return source.filter((item) => Number(item.year) >= startYear && Number(item.year) <= endYear);
  }

  const byYear = source.reduce((map, item) => {
    const year = Number(item.year);
    if (Number.isFinite(year)) map[year] = item;
    return map;
  }, {});
  return Array.from({ length: endYear - startYear + 1 }, (_, index) => {
    const year = startYear + index;
    return byYear[year] || createFallbackFlowYear(result, year);
  });
}

function findFlowYearSource(flowYears, year, fallbackIndex) {
  const direct = flowYears.find((item) => Number(item.year) === Number(year));
  if (direct) return direct;
  const fallback = flowYears[fallbackIndex] || flowYears[0] || {};
  return {
    ...fallback,
    year,
    value: getGanZhiOffset(fallback.value, Number(year) - Number(fallback.year || year))
  };
}

function createFlowMonthsForYear(result, flowYear) {
  const yearStemIndex = heavenlyStems.indexOf(splitPillar(flowYear.value).stem);
  const dayStem = result.dayMaster.stem;
  return flowMonthTerms.map((term, index) => {
    const stemIndex = ((yearStemIndex % 5) * 2 + 2 + index + 10) % 10;
    const stem = heavenlyStems[stemIndex];
    const branch = earthlyBranches[term.branchIndex];
    const value = `${stem}${branch}`;
    return {
      label: `${term.key}月`,
      monthTitle: term.key,
      termTime: `${flowYear.year}-${term.date}`,
      dateShort: term.date,
      value,
      tenGod: getTenGod(dayStem, stem),
      influenceSummary: `${flowYear.year}年${term.key}后，以${value}月气观察事项推进。`,
      interactionSummary: `${branch}支入月，与原局四支同参。`
    };
  });
}

function clampIndex(index, length, fallback) {
  const value = Number(index);
  if (Number.isInteger(value) && value >= 0 && value < length) return value;
  return fallback;
}

function getActiveLuckIndex(result) {
  const year = result.flowYears && result.flowYears[0] ? result.flowYears[0].year : new Date().getFullYear();
  const cycles = result.luck.cycles || [];
  const index = cycles.findIndex((cycle) => {
    const range = String(cycle.yearRange || '').split('-').map(Number);
    return year >= range[0] && year <= range[1];
  });
  return index >= 0 ? index : 0;
}

function buildFlowYearBlocks(flowYearsSource) {
  const source = Array.isArray(flowYearsSource) ? flowYearsSource : [];
  const blocks = [];
  for (let index = 0; index < source.length; index += 10) {
    const years = source.slice(index, index + 10);
    if (!years.length) continue;
    const first = years[0];
    const last = years[years.length - 1];
    blocks.push({
      ...first,
      blockIndex: blocks.length,
      year: first.year,
      endYear: last.year,
      yearRange: `${first.year}-${last.year}`,
      years
    });
  }
  return blocks;
}

function getSpiritsForBranch(result, branch) {
  return (result.professional.spirits || [])
    .filter((spirit) => spirit.branch === branch)
    .map((spirit) => spirit.name);
}

function createProfessionalColumn(label, source, sourceType, result) {
  const pillar = splitPillar(source.value);
  const dayStem = result.dayMaster.stem;
  const isDayPillar = sourceType === 'natal' && label === '日柱';
  const voidBranches = result.detailProfile.voidBranches || [];
  return {
    label,
    sourceType,
    value: source.value,
    mainStar: isDayPillar ? '元男' : (source.tenGod || source.stemTenGod || getTenGod(dayStem, pillar.stem)),
    stem: pillar.stem,
    branch: pillar.branch,
    stemElement: source.stemElement || stemElementMap[pillar.stem],
    branchElement: source.branchElement || branchElementMap[pillar.branch],
    hiddenLines: createHiddenLines(dayStem, pillar.branch),
    stage: getProsperityStage(dayStem, pillar.branch),
    self: getProsperityStage(pillar.stem, pillar.branch),
    voidText: source.voidText || (voidBranches.includes(pillar.branch) ? result.detailProfile.voidText : '不空'),
    nayin: source.nayin || getNayin(source.value),
    spirits: getSpiritsForBranch(result, pillar.branch)
  };
}

function summarizeRelations(result, activeLuck, flowYear) {
  const luckPillar = splitPillar(activeLuck ? activeLuck.value : '');
  const yearPillar = splitPillar(flowYear ? flowYear.value : '');
  const dayPillar = result.pillars.find((item) => item.label === '日柱') || result.pillars[2];
  const monthPillar = result.pillars.find((item) => item.label === '月柱') || result.pillars[1];
  const flowBranches = [luckPillar.branch, yearPillar.branch].filter((item) => item && item !== '—');
  const natalBranches = (result.pillars || []).map((item) => item.branch);
  return {
    luckStem: [
      `${luckPillar.stem}${dayPillar.stem}相参`,
      `${yearPillar.stem}${dayPillar.stem}并看`,
      `${luckPillar.stem}${yearPillar.stem}岁运同层`
    ],
    luckBranch: [
      flowYear && flowYear.interactionSummary ? flowYear.interactionSummary : '流年地支与原局平参',
      `${flowBranches.join('、')}入岁运`,
      `${natalBranches.join('、')}为原局四支`
    ],
    luckWhole: flowYear && flowYear.triggerPoints && flowYear.triggerPoints.length
      ? flowYear.triggerPoints.map((item) => item.text)
      : ['当前岁运整柱未见高优先级触发点'],
    natalStem: [
      `${monthPillar.stem}${dayPillar.stem}月日同参`,
      `${dayPillar.stem}为日主，先定旺衰再看十神`
    ],
    natalBranch: (result.professional.natalRelations || []).map((item) => item.basis),
    natalWhole: [
      `${result.professional.pattern.name} · ${result.professional.strength.status}`,
      `喜用${result.professional.usefulGod.usefulText}，忌${result.professional.usefulGod.avoidText}`
    ]
  };
}

function createProfessionalDetail(result, options = {}) {
  const luckCyclesSource = normalizeLuckCyclesForEndAge(result, result.luck.cycles || []);
  const flowYearsSource = normalizeFlowYearsForLuck(result, result.flowYears || []);
  const flowMonthsSource = result.flowMonths || [];
  const flowYearBlocksSource = buildFlowYearBlocks(flowYearsSource);
  const selectedLuckIndex = clampIndex(options.luckIndex, luckCyclesSource.length, getActiveLuckIndex(result));
  const selectedYearIndex = clampIndex(options.yearIndex, flowYearBlocksSource.length, 0);
  const selectedYearBlock = flowYearBlocksSource[selectedYearIndex] || null;
  const selectedYearOffset = clampIndex(options.yearOffset, selectedYearBlock && selectedYearBlock.years ? selectedYearBlock.years.length : 10, 0);
  const activeLuck = luckCyclesSource[selectedLuckIndex] || null;
  const baseFlowYear = selectedYearBlock && selectedYearBlock.years ? selectedYearBlock.years[0] : null;
  const exactFlowYear = baseFlowYear ? Number(baseFlowYear.year) + selectedYearOffset : 0;
  const flowYear = baseFlowYear ? findFlowYearSource(flowYearsSource, exactFlowYear, flowYearsSource.indexOf(baseFlowYear)) : null;
  const selectedFlowYearValue = flowYear ? flowYear.value : '';
  const flowMonthsSourceForYear = flowYear ? createFlowMonthsForYear(result, flowYear) : flowMonthsSource;
  const selectedMonthIndex = clampIndex(options.monthIndex, flowMonthsSourceForYear.length, 0);
  const extrasByLabel = (result.detailProfile.pillarExtras || []).reduce((map, item) => {
    map[item.label] = item;
    return map;
  }, {});
  const growthByLabel = (result.professional.growthStages || []).reduce((map, item) => {
    map[item.label] = item;
    return map;
  }, {});
  const natalColumns = (result.pillars || []).map((pillar) => createProfessionalColumn(pillar.label, {
    ...pillar,
    ...extrasByLabel[pillar.label],
    stage: growthByLabel[pillar.label] ? growthByLabel[pillar.label].stage : '参看'
  }, 'natal', result));
  const columns = [
    flowYear ? createProfessionalColumn('流年', flowYear, 'flowYear', result) : null,
    activeLuck ? createProfessionalColumn('大运', activeLuck, 'luck', result) : null,
    ...natalColumns
  ].filter(Boolean);
  const rows = [
    { label: '主星', cells: columns.map((item) => createTextCell(item.mainStar)) },
    { label: '天干', strong: true, cells: columns.map((item) => createStemCell(item.stem, item.stemElement)) },
    { label: '地支', strong: true, cells: columns.map((item) => createStemCell(item.branch, item.branchElement)) },
    { label: '藏干', cells: columns.map((item) => createRichCell(item.hiddenLines.length ? item.hiddenLines : [{ stem: '—', tenGod: '', className: 'plain' }])) },
    { label: '星运', cells: columns.map((item) => createTextCell(item.stage)) },
    { label: '自坐', cells: columns.map((item) => createTextCell(item.self)) },
    { label: '空亡', cells: columns.map((item) => createTextCell(item.voidText)) },
    { label: '纳音', cells: columns.map((item) => createTextCell(item.nayin)) },
    { label: '神煞', highlight: true, cells: columns.map((item) => createTextCell(item.spirits.length ? item.spirits : ['—'])) }
  ];
  const luckCycles = luckCyclesSource.map((cycle, index) => {
    const pillar = splitPillar(cycle.value);
    return {
      ...cycle,
      stem: pillar.stem,
      branch: pillar.branch,
      yearStart: String(cycle.yearRange || '').split('-')[0],
      active: index === selectedLuckIndex,
      spirits: getSpiritsForBranch(result, pillar.branch)
    };
  });
  const flowYears = flowYearBlocksSource.map((yearBlock, index) => ({
    ...yearBlock,
    miniPillars: (yearBlock.years || []).map((sourceYear, offset) => {
      const itemYear = sourceYear.year;
      const value = sourceYear.value || getGanZhiOffset(yearBlock.value, offset);
      return {
        year: itemYear,
        value,
        age: sourceYear.age,
        active: index === selectedYearIndex && offset === selectedYearOffset
      };
    }),
    active: index === selectedYearIndex
  }));
  const flowMonths = flowMonthsSourceForYear.map((month, index) => ({
    ...month,
    monthTitle: String(month.label || '').replace('月', ''),
    dateShort: String(month.termTime || '').slice(5, 10),
    active: index === selectedMonthIndex
  }));
  const selectedMonth = flowMonths[selectedMonthIndex] || null;
  const pillarSpirits = (result.pillars || []).map((pillar) => ({
    value: pillar.value,
    names: getSpiritsForBranch(result, pillar.branch).filter((name, index, arr) => arr.indexOf(name) === index)
  }));
  const luckSpirits = luckCycles.map((cycle) => ({
    value: cycle.value,
    active: cycle.active,
    names: cycle.spirits.filter((name, index, arr) => arr.indexOf(name) === index)
  })).filter((item) => item.names.length);
  pillarSpirits.forEach((item) => {
    item.namesText = item.names.length ? item.names.join('　') : '未见常用神煞入柱';
  });
  luckSpirits.forEach((item) => {
    item.namesText = item.names.join('　');
  });
  const relations = summarizeRelations(result, activeLuck, flowYear);

  return {
    columns,
    rows,
    tableWidth: columns.length * 122 + 112,
    selectedLuckIndex,
    selectedYearIndex,
    selectedYearOffset,
    selectedFlowYear: flowYear,
    selectedFlowYearValue,
    selectedMonthIndex,
    activeLuck,
    luckCycles,
    luckStripWidth: luckCycles.length * 116,
    flowYears,
    flowYearStripWidth: flowYears.length * 122,
    flowMonths,
    flowMonthStripWidth: flowMonths.length * 122,
    selectedMonth,
    elementStates: ['火旺', '土相', '木休', '水囚', '金死'],
    relationLines: [
      { label: '岁运天干', text: relations.luckStem.join('｜') },
      { label: '岁运地支', text: relations.luckBranch.join('｜') },
      { label: '岁运整柱', text: relations.luckWhole.join('｜') },
      { label: '原局天干', text: relations.natalStem.join('｜') },
      { label: '原局地支', text: relations.natalBranch.join('｜') },
      { label: '原局整柱', text: relations.natalWhole.join('｜') }
    ],
    pillarSpirits,
    luckSpirits
  };
}

module.exports = {
  createBaziPlate,
  createProfessionalDetail
};
