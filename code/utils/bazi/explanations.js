const EXPLANATIONS = {
  tenGod: {
    title: '十神',
    content: '十神以日干为基准，按天干五行生克关系和阴阳同异定名，用于标识年、月、日、时各处与日主的关系。本页只展示排盘字段，不据此单独作吉凶断语。',
    basis: '日干为主；五行生克；阴阳同异。'
  },
  hiddenStem: {
    title: '地支藏干',
    content: '藏干按已锁定的问真对齐藏干表展示，顺序为本气、中气、余气；每个藏干的十神仍以日干为基准计算。',
    basis: '固定藏干表；本气在前；十神以日干推导。'
  },
  void: {
    title: '空亡',
    content: '空亡按六甲旬空计算，每个柱分别以本柱干支查所在旬，再取该旬所空的两个地支。本页展示字段结果，不额外延伸断语。',
    basis: '六甲旬空；年、月、日、时四柱分别查。'
  },
  naYin: {
    title: '纳音',
    content: '纳音按六十甲子纳音表映射，由每个柱的完整干支得到对应纳音名称，用于展示传统排盘信息。',
    basis: '六十甲子纳音表。'
  },
  spirit: {
    title: '神煞',
    content: '神煞只展示已经接入并通过问真口径验证的结果；未验证的神煞不做自定义解释，也不参与当前断语。',
    basis: '以问真八字对齐样本为准，未验收项保持为空。'
  },
  strength: {
    title: '十神旺衰',
    content: '旺衰展示以月令对应五行、五行数量和引擎返回的强弱字段为依据。当前只做结构化展示，未接入问真人元司令等细分口径前不作扩展断语。',
    basis: '月令五行；五行统计；引擎强弱字段。'
  }
};

function normalizeTopic(topic) {
  const key = String(topic || '').trim();
  const aliases = {
    ten_god: 'tenGod',
    十神: 'tenGod',
    hidden: 'hiddenStem',
    hidden_stem: 'hiddenStem',
    藏干: 'hiddenStem',
    地支藏干: 'hiddenStem',
    voidText: 'void',
    空亡: 'void',
    nayin: 'naYin',
    na_yin: 'naYin',
    纳音: 'naYin',
    shensha: 'spirit',
    spirits: 'spirit',
    神煞: 'spirit',
    strongWeak: 'strength',
    旺衰: 'strength',
    十神旺衰: 'strength'
  };
  return aliases[key] || key;
}

function getBaziExplanation(topic, value = '') {
  const normalizedTopic = normalizeTopic(topic);
  const fallback = {
    title: '字段说明',
    content: '该字段来自当前排盘结果，仅作结构化展示。未锁定问真口径的内容不做自定义解释。',
    basis: '以当前引擎返回字段为准。'
  };
  const item = EXPLANATIONS[normalizedTopic] || fallback;
  const displayValue = String(value || '').trim();
  return {
    topic: normalizedTopic,
    title: item.title,
    value: displayValue,
    content: displayValue ? `${displayValue}：${item.content}` : item.content,
    basis: item.basis
  };
}

function listBaziExplanationTopics() {
  return Object.keys(EXPLANATIONS);
}

module.exports = {
  getBaziExplanation,
  listBaziExplanationTopics
};
