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

function createRuleOnlyWenZhenSample(spiritName, rule) {
  return {
    spiritName,
    status: 'collecting',
    rule,
    cases: []
  };
}

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
          confirmedBy: '问真八字',
          classicQuote: '甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢虎马，此是贵人方。',
          classicSource: '渊海子平',
          interpretationKeywords: ['贵人', '人缘', '社交缘', '异性缘', '长辈缘', '化险为夷'],
          interpretationSummary: '天乙贵人主遇事有人帮、临难有人解。作为解释材料收录，后续用于展示文案参考，不参与算法验收。'
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
    if (name === '太极贵人') {
      return createRuleOnlyWenZhenSample(name, {
        basis: '以日干、年干查四地支',
        calculation: '问真规则页口诀：甲乙生人子午中，丙丁鸡兔定亨通，戊己两干临四季，庚辛寅亥禄丰隆，壬癸巳申偏喜美。当前仅录入规则页，待实际命例验证后才可实现算法。',
        confirmedBy: '问真八字',
        classicQuote: '甲乙生人子午中，丙丁鸡兔定亨通，戊己两干临四季，庚辛寅亥禄丰隆，壬癸巳申偏喜美，值此应当福气钟，更须贵格来相扶，候封万户到三公。',
        interpretationKeywords: ['聪明好学', '福禄兼得', '化险为夷', '贵人相助', '晚年安逸', '福寿双全'],
        interpretationSummary: '太极贵人主聪明好学、福禄兼得、贵人相助。作为解释材料收录，后续用于展示文案参考，不参与算法验收。',
        screenshotRefs: [
          'wenzhen-taiji-rule-001.jpg',
          'wenzhen-taiji-rule-002.jpg'
        ]
      });
    }
    if (name === '羊刃') {
      return createRuleOnlyWenZhenSample(name, {
        basis: '以日干查四地支',
        calculation: '问真规则页口诀：甲日卯、乙日寅、丙日午、丁日巳、戊日午、己日巳、庚日酉、辛日申、壬日子、癸日亥。当前仅录入规则页，待实际命例验证后才可实现算法。',
        confirmedBy: '问真八字',
        screenshotRefs: [
          'wenzhen-yangren-rule-001.jpg',
          'wenzhen-yangren-rule-002.jpg',
          'wenzhen-yangren-rule-003.jpg',
          'wenzhen-yangren-rule-004.jpg',
          'wenzhen-yangren-rule-005.jpg'
        ]
      });
    }
    if (name === '将星') {
      return createRuleOnlyWenZhenSample(name, {
        basis: '以年支、日支查余支',
        calculation: '问真规则页口诀：子日子、丑日酉、寅日午、卯日卯、辰日子、巳日酉、午日午、未日卯、申日子、酉日酉、戌日午、亥日卯。当前仅录入规则页，待实际命例验证后才可实现算法。',
        confirmedBy: '问真八字',
        classicQuote: '子日子，丑日酉，寅日午，卯日卯，辰日子，巳日酉，午日午，未日卯，申日子，酉日酉，戌日午，亥日卯。',
        interpretationKeywords: ['权柄威信', '组织领导', '掌权之机', '将权', '财官亨通', '事职变动'],
        interpretationSummary: '将星主权柄威信、组织领导和掌权之机。作为解释材料收录，后续用于展示文案参考，不参与算法验收。',
        screenshotRefs: [
          'wenzhen-jiangxing-rule-001.jpg',
          'wenzhen-jiangxing-rule-002.jpg'
        ]
      });
    }
    if (name === '天德') {
      return createRuleOnlyWenZhenSample(name, {
        basis: '以月支查四柱干支',
        calculation: '问真规则页口诀：寅月丁、卯月申、辰月壬、巳月辛、午月亥、未月甲、申月癸、酉月寅、戌月丙、亥月乙、子月巳、丑月庚。当前仅录入规则页，待实际命例验证后才可实现算法。',
        confirmedBy: '问真八字',
        classicQuote: '寅月丁，卯月申，辰月壬，巳月辛，午月亥，未月甲，申月癸，酉月寅，戌月丙，亥月乙，子月巳，丑月庚。',
        interpretationKeywords: ['天月德', '福德', '心地善良', '化解危难', '化险为夷', '处世无殃'],
        interpretationSummary: '天德贵人主化解危难、处世无殃。作为解释材料收录，后续用于展示文案参考，不参与算法验收。',
        screenshotRefs: [
          'wenzhen-tiande-rule-001.jpg',
          'wenzhen-tiande-rule-002.jpg',
          'wenzhen-tiande-rule-003.jpg'
        ]
      });
    }
    if (name === '月德') {
      return createRuleOnlyWenZhenSample(name, {
        basis: '以月支查四柱干支',
        calculation: '问真规则页口诀：寅午戌月生者见丙，申子辰月生者见壬，亥卯未月生者见甲，巳酉丑月生者见庚。当前仅录入规则页，待实际命例验证后才可实现算法。',
        confirmedBy: '问真八字',
        classicQuote: '寅午戌月生者见丙，申子辰月生者见壬，亥卯未月生者见甲，巳酉丑月生者见庚。',
        interpretationKeywords: ['月德贵人', '处世无忧', '化险为夷', '勤勉敏慧', '坦白无私', '慈悲心'],
        interpretationSummary: '月德贵人主处世无忧、化险为夷，也强调勤勉自助。作为解释材料收录，后续用于展示文案参考，不参与算法验收。',
        screenshotRefs: [
          'wenzhen-yuede-rule-001.jpg',
          'wenzhen-yuede-rule-002.jpg',
          'wenzhen-yuede-rule-003.jpg'
        ]
      });
    }
    // 驿马已录入问真规则页与不命中反例，待补命中样本后才能标记 collected
    if (name === '驿马') {
      return {
        spiritName: name,
        status: 'collecting',
        rule: {
          basis: '以年支、日支分别查余三支，口诀：申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳',
          calculation: '年支或日支所属三合局对应的驿马地支，若出现在余三支，则该柱显示驿马；当前仅以问真规则页和不命中反例记录，待补命中样本验证',
          confirmedBy: '问真八字',
          classicQuote: '申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳。',
          interpretationKeywords: ['走动', '远行', '出远门', '奔波', '迁移', '乔迁', '升迁'],
          interpretationSummary: '驿马主走动、远行、迁移与奔波。作为解释材料收录，后续用于展示文案参考，不参与算法验收。',
          screenshotRefs: [
            'wenzhen-yima-rule-001.jpg',
            'wenzhen-yima-rule-002.jpg',
            'wenzhen-yima-rule-003.jpg'
          ]
        },
        cases: [
          {
            caseId: 'wz-yima-neg-001',
            source: '问真八字',
            screenshotRef: 'wenzhen-yima-neg-001-plate.jpg',
            supportingScreenshotRefs: [
              'wenzhen-yima-neg-001-basic.jpg',
              'wenzhen-yima-neg-001-detail.jpg'
            ],
            input: {
              solarTime: '2025-06-01 23:01:00',
              gender: '男',
              longitude: 120,
              latitude: 39,
              useTrueSolarTime: false,
              useDst: false
            },
            expect: {
              pillars: {
                year: '乙巳',
                month: '辛巳',
                day: '壬寅',
                hour: '庚子'
              },
              spirits: [],
              noHitReason: '年支巳查亥，日支寅查申；余三支未见亥或申，问真基本排盘与专业细盘均未显示驿马'
            }
          }
        ]
      }
    }
    if (name === '华盖') {
      return {
        spiritName: name,
        status: 'pending_wenzhen_sample',
        rule: {
          basis: '以年支、日支查余支',
          calculation: '用户补充口诀：寅午戌见戌，亥卯未见未，申子辰见辰，巳酉丑见丑。当前仅录入文字材料，待问真规则页和实际命例验证后才可实现算法。',
          confirmedBy: '问真八字',
          classicQuote: '寅午戌见戌，亥卯未见未，申子辰见辰，巳酉丑见丑。',
          interpretationKeywords: ['艺术', '权力', '职事变化', '才华横溢', '孤独', '修身养性'],
          interpretationSummary: '华盖主艺术、才华、权力象征和孤独修习之象。作为解释材料收录，后续用于展示文案参考，不参与算法验收。'
        },
        cases: []
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
  if (!Array.isArray(spirits)) {
    errors.push('expect.spirits must be an array');
  } else if (spirits.length === 0) {
    if (!item.expect || !hasText(item.expect.noHitReason)) {
      errors.push('expect.noHitReason is required when expect.spirits is empty');
    }
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
  const hasRuleScreenshots = Boolean(
    sample.rule &&
    Array.isArray(sample.rule.screenshotRefs) &&
    sample.rule.screenshotRefs.length > 0
  );
  const isRuleOnlyCollecting = sample.status === 'collecting' && hasRuleScreenshots;
  if (!REQUIRED_WENZHEN_SHENSHA.includes(sample.spiritName)) {
    errors.push('spiritName must be one of the required WenZhen shensha names');
  }
  if (!sample.rule || !hasText(sample.rule.basis)) errors.push('rule.basis is required');
  if (!sample.rule || !hasText(sample.rule.calculation)) errors.push('rule.calculation is required');
  if (!Array.isArray(sample.cases) || sample.cases.length === 0) {
    if (!isRuleOnlyCollecting) {
      errors.push('cases must contain at least one WenZhen-verified case');
    }
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

function collectSampleScreenshotRefs(sample) {
  const refs = [];
  if (!sample || typeof sample !== 'object') return refs;
  if (sample.rule && Array.isArray(sample.rule.screenshotRefs)) {
    sample.rule.screenshotRefs.forEach((ref) => {
      if (hasText(ref)) refs.push(ref);
    });
  }
  if (Array.isArray(sample.cases)) {
    sample.cases.forEach((item) => {
      if (hasText(item.screenshotRef)) refs.push(item.screenshotRef);
      if (Array.isArray(item.supportingScreenshotRefs)) {
        item.supportingScreenshotRefs.forEach((ref) => {
          if (hasText(ref)) refs.push(ref);
        });
      }
    });
  }
  return refs;
}

function buildPath(...parts) {
  try {
    // Node-only validation path; never needed by the Mini Program runtime.
    return require('path').join(...parts);
  } catch (error) {
    return parts.join('/');
  }
}

function fileExists(filePath) {
  try {
    // Node-only validation path; never needed by the Mini Program runtime.
    return require('fs').existsSync(filePath);
  } catch (error) {
    return true;
  }
}

function validateWenZhenShenShaDataset(samples = [], options = {}) {
  const errors = [];
  const caseIds = new Set();
  const allowedStatuses = ['pending_wenzhen_sample', 'collecting', 'collected'];

  const items = REQUIRED_WENZHEN_SHENSHA.map((name) => {
    const sample = Array.isArray(samples)
      ? samples.find((item) => item && item.spiritName === name)
      : null;
    const itemErrors = [];

    if (!sample) {
      itemErrors.push('sample is missing');
    } else {
      if (!allowedStatuses.includes(sample.status)) {
        itemErrors.push('status must be pending_wenzhen_sample, collecting, or collected');
      }

      if (sample.status === 'pending_wenzhen_sample') {
        if (Array.isArray(sample.cases) && sample.cases.length > 0) {
          itemErrors.push('pending sample must not contain cases');
        }
      } else {
        validateWenZhenShenShaSample(sample).errors.forEach((message) => itemErrors.push(message));
      }

      if (sample.status === 'collected') {
        const hitCases = Array.isArray(sample.cases)
          ? sample.cases.filter((item) => item.expect && Array.isArray(item.expect.spirits) && item.expect.spirits.length > 0)
          : [];
        if (hitCases.length < 3) {
          itemErrors.push('collected sample must contain at least three hit cases');
        }
      }

      if (Array.isArray(sample.cases)) {
        sample.cases.forEach((item) => {
          if (hasText(item.caseId)) {
            if (caseIds.has(item.caseId)) itemErrors.push(`duplicate caseId ${item.caseId}`);
            caseIds.add(item.caseId);
          }
        });
      }

      if (hasText(options.screenshotDir)) {
        collectSampleScreenshotRefs(sample).forEach((ref) => {
          const fullPath = buildPath(options.screenshotDir, ref);
          if (!fileExists(fullPath)) itemErrors.push(`missing screenshot ${ref}`);
        });
      }
    }

    itemErrors.forEach((message) => errors.push(`${name}: ${message}`));
    return {
      spiritName: name,
      status: sample ? sample.status : 'missing',
      ready: Boolean(sample && sample.status === 'collected' && itemErrors.length === 0),
      errors: itemErrors
    };
  });

  const readyCount = items.filter((item) => item.ready).length;
  return {
    ok: errors.length === 0,
    readyCount,
    pendingCount: REQUIRED_WENZHEN_SHENSHA.length - readyCount,
    items,
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
    const ready = Boolean(sample && sample.status === 'collected' && validation.ok);
    return {
      spiritName: name,
      ready,
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
  validateWenZhenShenShaDataset,
  summarizeWenZhenShenShaReadiness
};
