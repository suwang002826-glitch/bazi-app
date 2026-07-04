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
  return REQUIRED_WENZHEN_SHENSHA.map((name) => {
    // 天乙贵人已收集样本
    if (name === '天乙贵人') {
      return {
        spiritName: name,
        status: 'collected',
        rule: {
          basis: '以日干、年干分别查四地支，口诀：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢虎马',
          calculation: '日干或年干对应贵人地支，出现在某柱地支即为该柱天乙贵人，年干、日干查得的结果均计入',
          confirmedBy: '问真八字'
        },
        cases: [
          {
            caseId: 'wz-tygr-001',
            source: '问真八字',
            screenshotRef: 'wenzhen-tygr-002.jpg',
            input: {
              solarTime: '1991-01-30 12:00:00',
              gender: '男',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '庚午',
                month: '己丑',
                day: '庚子',
                hour: '壬午'
              },
              spirits: [
                {
                  name: '天乙贵人',
                  location: '月柱',
                  branch: '丑'
                }
              ]
            }
          },
          {
            caseId: 'wz-tygr-002',
            source: '问真八字',
            screenshotRef: 'wenzhen-tygr-005.jpg',
            input: {
              solarTime: '2005-07-24 23:04:00',
              gender: '女',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '乙酉',
                month: '癸未',
                day: '庚戌',
                hour: '丙子'
              },
              spirits: [
                {
                  name: '天乙贵人',
                  location: '月柱',
                  branch: '未'
                },
                {
                  name: '天乙贵人',
                  location: '时柱',
                  branch: '子'
                }
              ]
            }
          },
          {
            caseId: 'wz-tygr-003',
            source: '问真八字',
            screenshotRef: 'wenzhen-tygr-011.jpg',
            input: {
              solarTime: '2002-08-25 22:02:00',
              gender: '女',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '壬午',
                month: '戊申',
                day: '乙丑',
                hour: '丁亥'
              },
              spirits: [
                {
                  name: '天乙贵人',
                  location: '月柱',
                  branch: '申'
                }
              ]
            }
          },
          {
            caseId: 'wz-tygr-005',
            source: '问真八字',
            screenshotRef: 'wenzhen-wenchang-003.jpg',
            input: {
              solarTime: '2003-05-24 12:02:00',
              gender: '男',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '癸未',
                month: '丁巳',
                day: '丁酉',
                hour: '丙午'
              },
              spirits: [
                {
                  name: '天乙贵人',
                  location: '月柱',
                  branch: '巳'
                },
                {
                  name: '天乙贵人',
                  location: '日柱',
                  branch: '酉'
                }
              ]
            }
          }
        ]
      }
    }
    // 文昌已收集样本
    if (name === '文昌') {
      return {
        spiritName: name,
        status: 'collected',
        rule: {
          basis: '以日干、年干分别查四地支，口诀：甲乙巳午报君知，丙戊申宫丁己鸡。庚猪辛鼠壬逢虎，癸人见卯入云梯',
          calculation: '日干或年干对应文昌地支，出现在某柱地支即为该柱文昌贵人，年干、日干查得的结果均计入',
          confirmedBy: '问真八字'
        },
        cases: [
          {
            caseId: 'wz-wenchang-001',
            source: '问真八字',
            screenshotRef: 'wenzhen-tygr-005.jpg',
            input: {
              solarTime: '2000-12-17 10:00:00',
              gender: '女',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '庚辰',
                month: '戊子',
                day: '己酉',
                hour: '己巳'
              },
              spirits: [
                {
                  name: '文昌贵人',
                  location: '日柱',
                  branch: '酉'
                }
              ]
            }
          },
          {
            caseId: 'wz-wenchang-002',
            source: '问真八字',
            screenshotRef: 'wenzhen-wenchang-003.jpg',
            input: {
              solarTime: '2003-05-24 12:02:00',
              gender: '男',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '癸未',
                month: '丁巳',
                day: '丁酉',
                hour: '丙午'
              },
              spirits: [
                {
                  name: '文昌贵人',
                  location: '日柱',
                  branch: '酉'
                }
              ]
            }
          },
          {
            caseId: 'wz-wenchang-003',
            source: '问真八字',
            screenshotRef: 'wenzhen-wenchang-006.jpg',
            input: {
              solarTime: '2002-06-26 15:00:00',
              gender: '男',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '壬午',
                month: '丙午',
                day: '乙丑',
                hour: '甲申'
              },
              spirits: [
                {
                  name: '文昌贵人',
                  location: '年柱',
                  branch: '午'
                },
                {
                  name: '文昌贵人',
                  location: '月柱',
                  branch: '午'
                }
              ]
            }
          },
          {
            caseId: 'wz-wenchang-004',
            source: '问真八字',
            screenshotRef: 'wenzhen-wenchang-009.jpg',
            input: {
              solarTime: '1998-06-12 16:30:00',
              gender: '女',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '戊寅',
                month: '戊午',
                day: '庚寅',
                hour: '甲申'
              },
              spirits: [
                {
                  name: '文昌贵人',
                  location: '时柱',
                  branch: '申'
                }
              ]
            }
          }
        ]
      }
    }
    // 其他神煞待收集
    return {
      spiritName: name,
      status: 'pending_wenzhen_sample',
      rule: {
        basis: '',
        calculation: '',
        confirmedBy: '问真八字'
      },
      cases: []
    }
  });
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
