const {
  createWenZhenShenShaSampleTemplate,
  summarizeWenZhenShenShaReadiness
} = require('../code/utils/bazi/shenshaSamples');

const template = createWenZhenShenShaSampleTemplate();
const readiness = summarizeWenZhenShenShaReadiness(template);

console.log(JSON.stringify({
  note: '仅用于问真八字神煞样本采集；未补齐样本前禁止实现神煞算法。',
  readiness,
  samples: template
}, null, 2));
