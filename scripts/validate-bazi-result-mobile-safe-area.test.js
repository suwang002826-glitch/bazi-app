const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pageDir = path.join(root, 'code', 'pages', 'bazi-result');
const wxssPath = path.join(pageDir, 'bazi-result.wxss');
const wxmlPath = path.join(pageDir, 'bazi-result.wxml');
const jsonPath = path.join(pageDir, 'bazi-result.json');

const wxss = fs.readFileSync(wxssPath, 'utf8');
const wxml = fs.readFileSync(wxmlPath, 'utf8');
const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function blocksFor(selector) {
  const pattern = new RegExp(`${escapeRegExp(selector)}\\s*\\{([\\s\\S]*?)\\}`, 'g');
  return Array.from(wxss.matchAll(pattern)).map((match) => match[1]);
}

function hasDeclaration(selector, declarationPattern) {
  return blocksFor(selector).some((block) => declarationPattern.test(block));
}

assert.strictEqual(
  json.navigationStyle,
  'custom',
  'bazi result page uses custom navigation and must own safe-area spacing'
);

assert.ok(
  wxss.includes('--result-topbar-height') && wxss.includes('--result-tabs-height'),
  'result page must define stable topbar and tab heights for sticky safe-area layout'
);

assert.ok(
  hasDeclaration('.bazi-result-page .result-topbar', /position\s*:\s*sticky/),
  'result topbar must stay sticky so content cannot scroll under the phone status bar'
);

assert.ok(
  hasDeclaration('.bazi-result-page .result-topbar', /top\s*:\s*0/),
  'result topbar must pin to the top of the custom navigation page'
);

assert.ok(
  hasDeclaration('.bazi-result-page .result-topbar', /z-index\s*:\s*(?:[6-9]\d|[1-9]\d{2,})/),
  'result topbar must sit above dense plate tables'
);

assert.ok(
  hasDeclaration('.bazi-result-page .result-tabs', /position\s*:\s*sticky/),
  'result tabs must stay sticky below the topbar on long result pages'
);

assert.ok(
  hasDeclaration('.bazi-result-page .result-tabs', /top\s*:\s*var\(--result-topbar-height\)/),
  'result tabs must use the shared topbar height instead of an untracked magic offset'
);

assert.ok(
  hasDeclaration('.bazi-result-page .result-tabs', /z-index\s*:\s*(?:[5-9]\d|[1-9]\d{2,})/),
  'result tabs must layer above scrolling plate tables'
);

assert.ok(
  /<scroll-view[^>]*class="pro-table-scroll"[^>]*scroll-x="true"[^>]*enhanced="true"[^>]*show-scrollbar="false"/.test(wxml),
  'professional plate scroll-view must use enhanced horizontal scrolling on real phones'
);

assert.ok(
  hasDeclaration('.bazi-result-page .pro-table-scroll', /max-width\s*:\s*calc\(100vw - 24rpx\)/),
  'professional plate scroll container must fit the phone viewport with side breathing room'
);

console.log('PASS bazi result mobile safe-area contract');
