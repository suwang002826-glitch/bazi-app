const app = getApp();
const { createProfessionalDetail } = require('../../utils/baziPlate');

const BASIC_ELEMENT_CLASS = {
  木: 'wood',
  火: 'fire',
  土: 'earth',
  金: 'metal',
  水: 'water'
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

const SPIRIT_INFO = {
  天乙贵人: { figure: '乙', title: '天乙贵人', category: '贵人', meaning: '主逢凶有解、遇事得助，是四柱神煞中常用于观察助力与转圜空间的贵曜。', advice: '宜主动求教、借力专业人士；不可因见贵人而轻忽现实准备。' },
  太极贵人: { figure: '太', title: '太极贵人', category: '贵人', meaning: '多主悟性、清静、好学与对玄学、哲理、宗教文化的亲近倾向。', advice: '适合深学一门、静心复盘，把感悟落成行动。' },
  文昌贵人: { figure: '昌', title: '文昌贵人', category: '文教', meaning: '主文章、学习、表达、考试与文书能力，常看学业、写作、策划与表达灵感。', advice: '宜读书、写作、准备资料；忌浮躁求快。' },
  词馆: { figure: '词', title: '词馆', category: '文教', meaning: '偏重语言、文字、名誉与表达修饰，常与文职、传播、策划相关。', advice: '宜打磨表达，重要文字多校对。' },
  学堂: { figure: '学', title: '学堂', category: '文教', meaning: '主学习环境、师承、训练与知识积累，适合观察求学和专业技能养成。', advice: '宜系统学习，不宜三心二意。' },
  德秀贵人: { figure: '德', title: '德秀贵人', category: '贵人', meaning: '重德行、气质、清秀与修养，常作人格气象与名誉参考。', advice: '宜以德服人，少争口舌。' },
  福星贵人: { figure: '福', title: '福星贵人', category: '贵人', meaning: '主福厚、缓和与生活助缘，常看顺遂度与人情助力。', advice: '宜珍惜善缘，主动回馈。' },
  国印贵人: { figure: '印', title: '国印贵人', category: '贵人', meaning: '与制度、文书、资质、印信、组织认可相关，常看证照和正式身份。', advice: '宜守规则、重凭证、重流程。' },
  天厨贵人: { figure: '厨', title: '天厨贵人', category: '贵人', meaning: '与饮食、享用、供养、口福及资源补给有关，也可看生活照料。', advice: '宜养身节食，避免贪享伤身。' },
  天官贵人: { figure: '官', title: '天官贵人', category: '贵人', meaning: '偏向名位、职分、上级助力与正式机会。', advice: '宜重责任与信用，少投机。' },
  天福贵人: { figure: '福', title: '天福贵人', category: '贵人', meaning: '主福泽、和缓、得助与生活中的缓冲力量。', advice: '宜积善修身，福不离德。' },
  桃花: { figure: '花', title: '桃花', category: '情缘', meaning: '主吸引力、人缘、审美、情感流动，也可对应社交曝光。', advice: '宜正向经营人际，忌感情牵扯不清。' },
  咸池: { figure: '池', title: '咸池', category: '情缘', meaning: '古法常与桃花同看，偏重欲望、情绪、声色与人际牵动。', advice: '宜清醒自持，重要关系保持边界。' },
  红鸾: { figure: '鸾', title: '红鸾', category: '婚缘', meaning: '主喜庆、姻缘、情感机会与关系推进。', advice: '宜真诚沟通，不宜以冲动代替承诺。' },
  天喜: { figure: '喜', title: '天喜', category: '婚缘', meaning: '主喜事、人情往来与关系中的愉悦气象。', advice: '宜顺势增进关系，也要看现实条件。' },
  驿马: { figure: '马', title: '驿马', category: '行移', meaning: '主动象、奔波、迁移、出差、变动与远方机会。', advice: '宜提前规划路线与节奏，忌仓促远行。' },
  华盖: { figure: '盖', title: '华盖', category: '才艺', meaning: '主孤高、艺术、宗教玄学、独立思考，也有清冷自守之象。', advice: '宜深造修心，少陷入孤僻。' },
  将星: { figure: '将', title: '将星', category: '权柄', meaning: '主统筹、掌控、号令与承担责任的能力。', advice: '宜承担正事，忌刚愎自用。' },
  亡神: { figure: '亡', title: '亡神', category: '杂曜', meaning: '多主心神耗散、遗失、隐忧和注意力偏离，需结合格局判断。', advice: '宜收心、核对、保管重要物品。' },
  劫煞: { figure: '劫', title: '劫煞', category: '刑耗', meaning: '主竞争、损耗、突发阻力与资源被分夺的倾向。', advice: '宜留备份、控风险，慎作担保。' },
  灾煞: { figure: '灾', title: '灾煞', category: '刑耗', meaning: '偏向风险、阻滞和意外消耗，需看岁运触发程度。', advice: '宜稳行，不宜冒险。' },
  丧门: { figure: '慎', title: '丧门', category: '慎忌', meaning: '古法多作慎忌星看，提示情绪低落、家宅事务或耗神之事。', advice: '宜关照家人身心，避免传播焦虑。' },
  孤辰: { figure: '孤', title: '孤辰', category: '孤曜', meaning: '主独处、独立、关系疏离感，也可化为专注研究。', advice: '宜独立思考，也要保留沟通。' },
  寡宿: { figure: '寡', title: '寡宿', category: '孤曜', meaning: '多看情感疏离、独守与内敛之象，需结合夫妻宫和岁运。', advice: '宜主动表达，不把沉默当稳定。' },
  元辰: { figure: '元', title: '元辰', category: '杂曜', meaning: '多作复杂气机和暗处牵动参考，常提示心绪与旧事牵连。', advice: '宜断旧账、理清边界。' },
  魁罡: { figure: '魁', title: '魁罡', category: '特殊格曜', meaning: '主刚烈、决断、气势强，成则担当，偏则过刚。', advice: '宜以规则约束锋芒。' },
  阴差阳错: { figure: '错', title: '阴差阳错', category: '婚缘', meaning: '古法常用于婚缘与关系错位参考，不宜单独断吉凶。', advice: '关系中宜把话说清，少让误会累积。' },
  十恶大败: { figure: '败', title: '十恶大败', category: '慎忌', meaning: '传统慎忌神煞之一，多提示资源、财务或承载力要谨慎看。', advice: '宜保守理财，重大事项看全局。' },
  孤鸾: { figure: '鸾', title: '孤鸾', category: '婚缘', meaning: '多用于情感与婚缘孤克倾向参考，需结合全盘综合判断。', advice: '宜修沟通与包容，不可单凭此星定论。' },
  天赦: { figure: '赦', title: '天赦', category: '德曜', meaning: '主宽解、赦免、缓和，常作转圜与修正机会参考。', advice: '宜改过修正，把握补救窗口。' },
  三奇贵人: { figure: '奇', title: '三奇贵人', category: '贵人', meaning: '主奇才、机缘、特殊组合和突破力，仍需格局配合。', advice: '宜走专业路线，不宜猎奇浮夸。' },
  太岁: { figure: '岁', title: '太岁', category: '岁君', meaning: '太岁为岁君，传统中代表当年岁气与时令主宰，术数里常看流年气机。', advice: '宜敬时守分，重大事择稳妥路径。' },
  空亡: { figure: '空', title: '空亡', category: '旬空', meaning: '提示某些象意暂虚、落空或待时而发，不等于完全没有。', advice: '宜复核时间与条件，少急断。' }
};

function normalizeResult(result) {
  if (!result) return result;
  const title = result.title || '';
  const displayName = result.displayName || title.replace(/的八字排盘$/, '') || '未命名';
  return {
    ...result,
    displayName
  };
}

function cellToText(cell) {
  if (!cell) return '';
  if (cell.text) return cell.text;
  if (cell.lines && cell.lines.length) return cell.lines.join('、');
  if (cell.richLines && cell.richLines.length) {
    return cell.richLines.map((item) => `${item.stem}${item.tenGod}`).join('、');
  }
  if (cell.hidden1Show) {
    return [
      cell.hidden1Show ? `${cell.hidden1Stem}${cell.hidden1God}` : '',
      cell.hidden2Show ? `${cell.hidden2Stem}${cell.hidden2God}` : '',
      cell.hidden3Show ? `${cell.hidden3Stem}${cell.hidden3God}` : ''
    ].filter(Boolean).join('、');
  }
  return '';
}

function splitSpiritNames(text) {
  return String(text || '')
    .split(/[、，,\s　]+/)
    .map((item) => item.trim())
    .filter((item) => item && item !== '—' && item !== '未见常用神煞入柱');
}

function toSpiritItem(name) {
  const info = SPIRIT_INFO[name] || {};
  return {
    name,
    figure: info.figure || name.slice(0, 1),
    category: info.category || '神煞'
  };
}

function findRow(rows, label) {
  return rows.find((row) => row.label === label) || { cells: [] };
}

function splitCellLines(text) {
  const value = String(text || '').trim();
  if (!value) return ['—'];
  return value
    .split(/[、,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hiddenItemsFromCell(cell) {
  if (!cell) return [];
  if (cell.richLines && cell.richLines.length) {
    return cell.richLines.map((item) => ({
      stem: item.stem || '—',
      tenGod: item.tenGod || '',
      className: item.className || 'plain'
    }));
  }
  return [
    cell.hidden1Show ? { stem: cell.hidden1Stem, tenGod: cell.hidden1God, className: cell.hidden1Class || 'plain' } : null,
    cell.hidden2Show ? { stem: cell.hidden2Stem, tenGod: cell.hidden2God, className: cell.hidden2Class || 'plain' } : null,
    cell.hidden3Show ? { stem: cell.hidden3Stem, tenGod: cell.hidden3God, className: cell.hidden3Class || 'plain' } : null
  ].filter(Boolean);
}

function hiddenItemsFromResult(result, index) {
  const pillar = result && result.pillars && result.pillars[index];
  if (!pillar || !pillar.hiddenStems) return [];
  return pillar.hiddenStems.map((item) => ({
    stem: item.stem || '—',
    tenGod: item.tenGod || '',
    className: BASIC_ELEMENT_CLASS[item.element] || 'plain'
  }));
}

function buildSongPlate(baziPlate, result) {
  if (!baziPlate) return null;
  const rows = baziPlate.rows || [];
  const columns = baziPlate.columns || [];
  const rowMap = {
    star: findRow(rows, '主星'),
    stem: findRow(rows, '天干'),
    branch: findRow(rows, '地支'),
    hidden: findRow(rows, '藏干'),
    subStar: findRow(rows, '副星'),
    stage: findRow(rows, '星运'),
    seat: findRow(rows, '自坐'),
    void: findRow(rows, '空亡'),
    nayin: findRow(rows, '纳音'),
    spirits: findRow(rows, '神煞')
  };

  const pillars = columns.map((column, index) => {
    const stemCell = rowMap.stem.cells[index] || {};
    const branchCell = rowMap.branch.cells[index] || {};
    const hiddenCell = rowMap.hidden.cells[index] || {};
    const hiddenItems = hiddenItemsFromCell(hiddenCell);
    const fallbackHiddenItems = hiddenItemsFromResult(result, index);
    const subStar = cellToText(rowMap.subStar.cells[index]) || '无';
    const spirits = cellToText(rowMap.spirits.cells[index]);
    return {
      label: column.label,
      star: cellToText(rowMap.star.cells[index]),
      stem: cellToText(stemCell),
      stemClass: stemCell.className || 'plain',
      branch: cellToText(branchCell),
      branchClass: branchCell.className || 'plain',
      hidden: cellToText(hiddenCell) || '无',
      hiddenItems: hiddenItems.length ? hiddenItems : fallbackHiddenItems,
      subStar,
      subStarLines: splitCellLines(subStar),
      stage: cellToText(rowMap.stage.cells[index]),
      seat: cellToText(rowMap.seat.cells[index]),
      void: cellToText(rowMap.void.cells[index]),
      nayin: cellToText(rowMap.nayin.cells[index]),
      spirits
    };
  });
  pillars.forEach((pillar) => {
    pillar.spiritItems = splitSpiritNames(pillar.spirits).map(toSpiritItem);
    pillar.spirits = pillar.spirits || '—';
  });

  return {
    pillars,
    tableRows: [
      { label: '主星', rowClass: 'plate-star-row', isText: true, cells: pillars.map((item) => ({ lines: splitCellLines(item.star) })) },
      { label: '天干', rowClass: 'plate-stem-row', isMain: true, cells: pillars.map((item) => ({ text: item.stem, className: item.stemClass })) },
      { label: '地支', rowClass: 'plate-branch-row', isMain: true, cells: pillars.map((item) => ({ text: item.branch, className: item.branchClass })) },
      { label: '藏干', rowClass: 'plate-hidden-row', isHidden: true, cells: pillars.map((item) => ({ hiddenItems: item.hiddenItems })) },
      { label: '副星', rowClass: 'plate-substar-row', isText: true, cells: pillars.map((item) => ({ lines: item.subStarLines })) },
      { label: '星运', rowClass: 'plate-small-row', isText: true, cells: pillars.map((item) => ({ lines: splitCellLines(item.stage) })) },
      { label: '自坐', rowClass: 'plate-small-row', isText: true, cells: pillars.map((item) => ({ lines: splitCellLines(item.seat) })) },
      { label: '空亡', rowClass: 'plate-small-row', isText: true, cells: pillars.map((item) => ({ lines: splitCellLines(item.void) })) },
      { label: '纳音', rowClass: 'plate-small-row', isText: true, cells: pillars.map((item) => ({ lines: splitCellLines(item.nayin) })) },
      { label: '神煞', rowClass: 'plate-spirit-row', isSpirit: true, cells: pillars.map((item) => ({ spiritItems: item.spiritItems })) }
    ],
    metaRows: [
      { label: '藏干', values: pillars.map((item) => item.hidden) },
      { label: '星运', values: pillars.map((item) => item.stage) },
      { label: '自坐', values: pillars.map((item) => item.seat) },
      { label: '空亡', values: pillars.map((item) => item.void) },
      { label: '纳音', values: pillars.map((item) => item.nayin) }
    ]
  };
}

function decorateProfessionalDetail(detail) {
  if (!detail) return detail;
  const rows = (detail.rows || []).map((row) => ({
    ...row,
    className: [
      row.className || '',
      row.strong ? 'strong-row' : '',
      row.highlight ? 'spirit-row' : '',
      row.label === '藏干' ? 'hidden-row' : '',
      row.label === '天干' ? 'stem-row' : '',
      row.label === '地支' ? 'branch-row' : ''
    ].filter(Boolean).join(' '),
    cells: (row.cells || []).map((cell) => ({
      ...cell,
      lines: cell.hasRichLines ? [] : (cell.lines || []),
      displayClassName: [
        cell.className || 'plain',
        cell.large ? 'large-cell' : '',
        cell.hasRichLines ? 'hidden-rich-cell' : ''
      ].filter(Boolean).join(' ')
    }))
  }));

  return {
    ...detail,
    tableWidth: (detail.columns || []).length * 124 + 104,
    rows
  };
}

function getAgeFromSolarTime(solarTime) {
  const year = Number(String(solarTime || '').slice(0, 4));
  if (!Number.isFinite(year) || year < 1900) return '';
  return `${new Date().getFullYear() - year}岁`;
}

function getHintText(result, title) {
  const hit = (result.validationHints || []).find((item) => item.title === title);
  return hit ? hit.text : '';
}

function buildBasicInfo(result) {
  if (!result) return null;
  const yearPillar = (result.pillars || [])[0] || {};
  const fetal = result.detailProfile && result.detailProfile.fetalOrigin || {};
  const palace = result.detailProfile && result.detailProfile.palaceProfile || {};
  const life = palace.life || {};
  const body = palace.body || {};
  const age = getAgeFromSolarTime(result.solarTime);
  const zodiac = ZODIAC_BY_BRANCH[yearPillar.branch] || yearPillar.branch || '未定';
  const gender = result.gender || '未填';
  const sectionHint = getHintText(result, '节气边界校验');

  return {
    name: result.displayName || '未命名',
    seal: result.dayMaster && result.dayMaster.stem || yearPillar.branch || '命',
    chips: [`生肖：${zodiac}`, age ? `${age} ${gender}` : gender],
    highlights: [
      { label: '日主属性', value: result.dayMaster ? result.dayMaster.text : '待校验' },
      { label: '格局旺衰', value: result.professional ? `${result.professional.pattern.name} · ${result.professional.strength.status}` : '待校验' },
      { label: '喜用参考', value: result.professional ? result.professional.usefulGod.usefulText : '待校验' }
    ],
    rows: [
      { label: '阳历', value: result.solarTime || '未记录' },
      { label: '真太阳时', value: result.adjustedSolarTime || result.solarTime || '未校准' },
      { label: '出生地区', value: `${result.birthPlace || '未填写'} · 东经 ${result.longitude || '--'}°` },
      { label: '节气校验', value: sectionHint || '按节气换月与真太阳时口径校验。' },
      { label: '胎元', value: fetal.value ? `${fetal.value}（${fetal.nayin}）` : '未生成' },
      { label: '空亡', value: result.detailProfile && result.detailProfile.voidText ? result.detailProfile.voidText : '未见' }
    ],
    palaceRows: [
      { label: '命宫', value: life.value || '未生成' },
      { label: '身宫', value: body.value || '未生成' },
      { label: '排盘口径', value: '节气换月 · 真太阳时校正' }
    ]
  };
}

Page({
  data: {
    result: null,
    baziPlate: null,
    songPlate: null,
    basicInfo: null,
    professionalDetail: null,
    resultTabs: ['基本信息', '基本命盘', '专业细盘', '分析解读'],
    activeResultTab: '基本信息',
    isInfoTab: true,
    isBasicTab: false,
    isProTab: false,
    isAnalysisTab: false,
    selectedLuckIndex: 0,
    selectedYearIndex: 0,
    selectedYearOffset: 0,
    selectedMonthIndex: 0,
    spiritModal: {
      visible: false
    }
  },

  onLoad() {
    const reading = app.globalData.currentBaziReading || wx.getStorageSync('currentBaziReading');
    if (reading && reading.result && reading.baziPlate) {
      const result = normalizeResult(reading.result);
      const professionalDetail = decorateProfessionalDetail(createProfessionalDetail(result));
      this.setData({
        result,
        baziPlate: reading.baziPlate,
        songPlate: buildSongPlate(reading.baziPlate, result),
        basicInfo: buildBasicInfo(result),
        professionalDetail,
        selectedLuckIndex: professionalDetail.selectedLuckIndex,
        selectedYearIndex: professionalDetail.selectedYearIndex,
        selectedYearOffset: professionalDetail.selectedYearOffset || 0,
        selectedMonthIndex: professionalDetail.selectedMonthIndex
      });
    }
  },

  onResultTabChange(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({
      activeResultTab: tab,
      isInfoTab: tab === '基本信息',
      isBasicTab: tab === '基本命盘',
      isProTab: tab === '专业细盘',
      isAnalysisTab: tab === '分析解读'
    });
  },

  refreshProfessionalDetail(patch) {
    if (!this.data.result) return;
    const next = {
      luckIndex: this.data.selectedLuckIndex,
      yearIndex: this.data.selectedYearIndex,
      yearOffset: this.data.selectedYearOffset,
      monthIndex: this.data.selectedMonthIndex,
      ...patch
    };
    const professionalDetail = decorateProfessionalDetail(createProfessionalDetail(this.data.result, next));
    this.setData({
      professionalDetail,
      selectedLuckIndex: professionalDetail.selectedLuckIndex,
      selectedYearIndex: professionalDetail.selectedYearIndex,
      selectedYearOffset: professionalDetail.selectedYearOffset || 0,
      selectedMonthIndex: professionalDetail.selectedMonthIndex
    });
  },

  onLuckTap(event) {
    this.refreshProfessionalDetail({ luckIndex: Number(event.currentTarget.dataset.index) });
  },

  onFlowYearTap(event) {
    this.refreshProfessionalDetail({
      yearIndex: Number(event.currentTarget.dataset.index),
      yearOffset: 0,
      monthIndex: 0
    });
  },

  onFlowYearItemTap(event) {
    this.refreshProfessionalDetail({
      yearIndex: Number(event.currentTarget.dataset.index),
      yearOffset: Number(event.currentTarget.dataset.offset),
      monthIndex: 0
    });
  },

  onFlowMonthTap(event) {
    this.refreshProfessionalDetail({ monthIndex: Number(event.currentTarget.dataset.index) });
  },

  openGanzhiDiagram() {
    const detail = this.data.professionalDetail;
    if (!detail) return;
    wx.showModal({
      title: '干支关系',
      content: [
        `当前大运：${detail.activeLuck ? `${detail.activeLuck.yearRange} ${detail.activeLuck.value}` : '未选'}`,
        `当前流年：${detail.selectedFlowYear ? `${detail.selectedFlowYear.year} ${detail.selectedFlowYear.value}` : '未选'}`,
        `当前流月：${detail.selectedMonth ? `${detail.selectedMonth.monthTitle} ${detail.selectedMonth.value}` : '未选'}`,
        '',
        `岁运天干：${detail.relationLines[0] ? detail.relationLines[0].text : '待分析'}`,
        `岁运地支：${detail.relationLines[1] ? detail.relationLines[1].text : '待分析'}`,
        '此处先给关系摘要，后续可扩展为可视化干支图。'
      ].join('\n'),
      showCancel: false,
      confirmText: '知道了'
    });
  },

  openAiCommand() {
    const result = this.data.result;
    const detail = this.data.professionalDetail;
    if (!result || !detail) return;
    wx.showModal({
      title: '白话解析',
      content: [
        '当前命盘可先从这几处入手：',
        `日主：${result.dayMaster.text}`,
        `格局：${result.professional.pattern.name}`,
        `旺衰：${result.professional.strength.status}`,
        `喜用：${result.professional.usefulGod.usefulText}`,
        `当前流年：${detail.selectedFlowYear ? `${detail.selectedFlowYear.year} ${detail.selectedFlowYear.value}` : '未选'}`,
        `当前流月：${detail.selectedMonth ? `${detail.selectedMonth.monthTitle} ${detail.selectedMonth.value}` : '未选'}`,
        '',
        '解读口径：先看日主承载，再看岁运触发，最后落到现实取舍。'
      ].join('\n'),
      showCancel: false,
      confirmText: '知道了'
    });
  },

  openSpiritInfo(event) {
    const name = event.currentTarget.dataset.name;
    if (!name) return;
    const hit = (this.data.result && this.data.result.professional && this.data.result.professional.spirits || [])
      .find((item) => item.name === name);
    const preset = SPIRIT_INFO[name] || {};
    const modal = {
      visible: true,
      name,
      title: preset.title || name,
      figure: preset.figure || name.slice(0, 1),
      category: preset.category || (hit && hit.category) || '神煞',
      meaning: preset.meaning || '此神煞为传统子平术数中的辅助观察项，需结合四柱格局、旺衰、喜忌与岁运综合判断。',
      advice: preset.advice || '建议只作辅助参考，不宜脱离原局强弱和现实条件单独断事。',
      basis: hit && hit.basis ? hit.basis : '当前命盘命中此神煞，测试版展示其通用含义。'
    };
    this.setData({ spiritModal: modal });
  },

  closeSpiritInfo() {
    this.setData({ 'spiritModal.visible': false });
  },

  noop() {},

  archiveCurrentCase() {
    if (!this.data.result) return;
    const reading = app.globalData.currentBaziReading || wx.getStorageSync('currentBaziReading');
    app.addCase({
      sourceId: Date.now(),
      type: '八字',
      title: this.data.result.title,
      createdAt: app.formatDateTime(new Date()),
      summary: [
        this.data.result.professional.chartSummary.oneLine,
        this.data.professionalDetail && this.data.professionalDetail.selectedFlowYear
          ? `当前查看${this.data.professionalDetail.selectedFlowYear.year} ${this.data.professionalDetail.selectedFlowYear.value}流年`
          : ''
      ].filter(Boolean).join(' '),
      tag: '命盘',
      status: '待验证',
      verifiedAt: '',
      accurate: '',
      inaccurate: '',
      userFeedback: '',
      note: '由八字结果页存档，可用于后续复盘。',
      payload: reading || null
    });
    wx.showToast({ title: '已存入命例', icon: 'success' });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/bazi/bazi' });
  }
});
