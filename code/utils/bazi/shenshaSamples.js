const REQUIRED_WENZHEN_SHENSHA = [
  '天乙贵人',
  '太极贵人',
  '文昌',
  '驿马',
  '桃花',
  '羊刃',
  '华盖',
  '将星',
  '天德',
  '月德'
];

function createWenZhenShenShaSampleTemplate() {
  return REQUIRED_WENZHEN_SHENSHA.map((name) => ({
    spiritName: name,
    status: 'pending_wenzhen_sample',
    rule: {
      basis: '',
      calculation: '',
      confirmedBy: '问真八字'
    },
    cases: []
  }));
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateCaseShape(item) {
  const errors = [];
  if (!item || typeof item !== 'object') return ['case must be an object'];
  if (!hasText(item.caseId)) errors.push('caseId is required');
  if (item.source !== '问真八字') errors.push('source must be 问真八字');
  if (!hasText(item.screenshotRef)) errors.push('screenshotRef is required');

  const input = item.input || {};
  if (!hasText(input.solarTime)) errors.push('input.solarTime is required');
  if (!hasText(input.gender)) errors.push('input.gender is required');
  if (!isFiniteNumber(input.longitude)) errors.push('input.longitude must be a number');
  if (!isFiniteNumber(input.latitude)) errors.push('input.latitude must be a number');
  if (typeof input.useTrueSolarTime !== 'boolean') errors.push('input.useTrueSolarTime must be boolean');
  if (typeof input.useDst !== 'boolean') errors.push('input.useDst must be boolean');

  const pillars = item.expect && item.expect.pillars;
  ['year', 'month', 'day', 'hour'].forEach((key) => {
    if (!pillars || !hasText(pillars[key])) errors.push(`expect.pillars.${key} is required`);
  });

  const spirits = item.expect && item.expect.spirits;
  if (!Array.isArray(spirits) || spirits.length === 0) {
    errors.push('expect.spirits must contain at least one hit');
  } else {
    spirits.forEach((spirit, index) => {
      if (!hasText(spirit.name)) errors.push(`expect.spirits[${index}].name is required`);
      if (!hasText(spirit.location)) errors.push(`expect.spirits[${index}].location is required`);
      if (!hasText(spirit.branch)) errors.push(`expect.spirits[${index}].branch is required`);
    });
  }
  return errors;
}

function validateWenZhenShenShaSample(sample) {
  const errors = [];
  if (!sample || typeof sample !== 'object') {
    return { ok: false, errors: ['sample must be an object'] };
  }
  if (!REQUIRED_WENZHEN_SHENSHA.includes(sample.spiritName)) {
    errors.push('spiritName must be one of the required WenZhen shensha names');
  }
  if (!sample.rule || !hasText(sample.rule.basis)) errors.push('rule.basis is required');
  if (!sample.rule || !hasText(sample.rule.calculation)) errors.push('rule.calculation is required');
  if (!Array.isArray(sample.cases) || sample.cases.length === 0) {
    errors.push('cases must contain at least one WenZhen-verified case');
  } else {
    sample.cases.forEach((item, index) => {
      validateCaseShape(item).forEach((message) => errors.push(`cases[${index}].${message}`));
    });
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function summarizeWenZhenShenShaReadiness(samples = []) {
  const sampleMap = {};
  if (Array.isArray(samples)) {
    samples.forEach((sample) => {
      if (sample && sample.spiritName) sampleMap[sample.spiritName] = sample;
    });
  }

  const items = REQUIRED_WENZHEN_SHENSHA.map((name) => {
    const sample = sampleMap[name];
    const validation = validateWenZhenShenShaSample(sample);
    return {
      spiritName: name,
      ready: validation.ok,
      errors: validation.errors
    };
  });
  const readyCount = items.filter((item) => item.ready).length;
  return {
    ready: readyCount === REQUIRED_WENZHEN_SHENSHA.length,
    readyCount,
    pendingCount: REQUIRED_WENZHEN_SHENSHA.length - readyCount,
    items
  };
}

module.exports = {
  REQUIRED_WENZHEN_SHENSHA,
  createWenZhenShenShaSampleTemplate,
  validateWenZhenShenShaSample,
  summarizeWenZhenShenShaReadiness
};
