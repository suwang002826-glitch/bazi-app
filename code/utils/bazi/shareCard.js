const PILLAR_KEYS = ['year', 'month', 'day', 'hour'];
const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];

function safeText(value, fallback = '') {
  const text = String(value == null ? '' : value).trim();
  return text || fallback;
}

function getPillarValue(pillar) {
  if (!pillar) return '';
  return safeText(
    pillar.fullStemBranch
    || pillar.value
    || `${pillar.stem || ''}${pillar.branch || ''}`
  );
}

function getPillars(result = {}) {
  const source = result.pillarsP0 || result.pillars || {};
  return PILLAR_KEYS.map((key, index) => ({
    key,
    label: PILLAR_LABELS[index],
    value: getPillarValue(source[key]) || '待定'
  }));
}

function getActiveLuck(result = {}, options = {}) {
  if (options.activeLuck) return options.activeLuck;
  const cycles = result.luck && Array.isArray(result.luck.cycles) ? result.luck.cycles : [];
  return cycles.find((item) => item && (item.isCurrent || item.active)) || cycles[0] || null;
}

function getCurrentFlowYear(result = {}, options = {}) {
  if (options.currentFlowYear) return options.currentFlowYear;
  const flowYears = Array.isArray(result.flowYears) ? result.flowYears : [];
  const currentYear = options.currentYear || new Date().getFullYear();
  return flowYears.find((item) => Number(item.year) === Number(currentYear)) || flowYears[0] || null;
}

function getLuckText(luck) {
  if (!luck) return '';
  const value = safeText(luck.value || luck.fullStemBranch);
  const range = safeText(luck.yearRange || luck.rangeText || luck.ageRange);
  return [value, range].filter(Boolean).join(' ');
}

function getFlowYearText(flowYear) {
  if (!flowYear) return '';
  const year = flowYear.year ? `${flowYear.year}年` : '';
  const value = safeText(flowYear.value || flowYear.fullStemBranch);
  const tenGod = safeText(flowYear.tenGod || flowYear.tenGodText);
  return [year, value, tenGod].filter(Boolean).join(' ');
}

function buildBaziShareCardModel(result = {}, options = {}) {
  const pillars = getPillars(result);
  const pillarsText = pillars.map((item) => item.value).join(' / ');
  const name = safeText(result.displayName || result.name, '命例');
  const destinyLabel = safeText(result.destinyLabel);
  const activeLuck = getActiveLuck(result, options);
  const currentFlowYear = getCurrentFlowYear(result, options);
  const luckText = getLuckText(activeLuck);
  const flowYearText = getFlowYearText(currentFlowYear);
  const tags = [
    luckText ? `大运 ${safeText(activeLuck.value || activeLuck.fullStemBranch)}` : '',
    currentFlowYear ? `流年 ${safeText(currentFlowYear.value || currentFlowYear.fullStemBranch)}` : '',
    result.birthPlace ? safeText(result.birthPlace) : ''
  ].filter(Boolean);
  const subtitle = [
    safeText(result.solarTime || result.birthDate),
    safeText(result.birthPlace)
  ].filter(Boolean).join(' · ');

  return {
    title: [name, destinyLabel].filter(Boolean).join(' · '),
    subtitle,
    pillars,
    pillarsText,
    luckText,
    flowYearText,
    tags,
    footer: '四柱、大运、流年仅作传统文化排盘参考',
    shareTitle: `${name}八字排盘：${pillars.map((item) => item.value).join(' ')}`
  };
}

module.exports = {
  buildBaziShareCardModel
};
