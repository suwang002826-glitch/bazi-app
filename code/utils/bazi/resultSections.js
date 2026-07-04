const RESULT_SECTION_KEYS = [
  'pillarDetails',
  'professionalDetails',
  'luckList',
  'flowYears',
  'flowMonths',
  'spirits'
];

function getDefaultResultSectionState() {
  return RESULT_SECTION_KEYS.reduce((state, key) => {
    state[key] = false;
    return state;
  }, {});
}

function toggleResultSection(currentState = {}, key) {
  if (!RESULT_SECTION_KEYS.includes(key)) return { ...currentState };
  return {
    ...currentState,
    [key]: !Boolean(currentState[key])
  };
}

function formatShortDate(dateText) {
  if (!dateText) return '';
  const raw = String(dateText).replace('T', ' ');
  return raw.length > 10 ? raw.slice(0, 10) : raw;
}

function findCurrentFlowYear(flowYears = [], targetYear = new Date().getFullYear()) {
  if (!Array.isArray(flowYears) || !flowYears.length) return null;
  const yearNumber = Number(targetYear);
  const matched = flowYears.find((item) => Number(item && item.year) === yearNumber)
    || flowYears.find((item) => Number(item && item.year) > yearNumber)
    || flowYears[flowYears.length - 1];
  if (!matched) return null;

  const year = Number(matched.year);
  return {
    ...matched,
    year,
    yearText: Number.isFinite(year) ? `${year}年` : '—',
    ageText: Number.isFinite(Number(matched.age)) ? `${Number(matched.age)}岁` : '',
    tenGodText: matched.tenGod || '',
    naYinText: matched.naYin || '',
    lichunDateText: formatShortDate(matched.lichunDate || ''),
    dateRangeText: [formatShortDate(matched.startDate), formatShortDate(matched.endDate)].filter(Boolean).join(' ~ ')
  };
}

module.exports = {
  RESULT_SECTION_KEYS,
  getDefaultResultSectionState,
  toggleResultSection,
  findCurrentFlowYear
};
