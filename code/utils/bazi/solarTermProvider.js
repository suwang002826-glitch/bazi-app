const {
  findSolarTermRecord,
  getSolarTermDataPackCoverage
} = require('./solarTermDataPack');

const jieTerms = [
  { key: '立春', angle: 315, month: 2, day: 4, branch: '寅', index: 0 },
  { key: '惊蛰', angle: 345, month: 3, day: 6, branch: '卯', index: 1 },
  { key: '清明', angle: 15, month: 4, day: 5, branch: '辰', index: 2 },
  { key: '立夏', angle: 45, month: 5, day: 6, branch: '巳', index: 3 },
  { key: '芒种', angle: 75, month: 6, day: 6, branch: '午', index: 4 },
  { key: '小暑', angle: 105, month: 7, day: 7, branch: '未', index: 5 },
  { key: '立秋', angle: 135, month: 8, day: 8, branch: '申', index: 6 },
  { key: '白露', angle: 165, month: 9, day: 8, branch: '酉', index: 7 },
  { key: '寒露', angle: 195, month: 10, day: 8, branch: '戌', index: 8 },
  { key: '立冬', angle: 225, month: 11, day: 7, branch: '亥', index: 9 },
  { key: '大雪', angle: 255, month: 12, day: 7, branch: '子', index: 10 },
  { key: '小寒', angle: 285, month: 1, day: 6, branch: '丑', index: 11 }
];

const jieTermKeysByIndex = [
  'lichun',
  'jingzhe',
  'qingming',
  'lixia',
  'mangzhong',
  'xiaoshu',
  'liqiu',
  'bailu',
  'hanlu',
  'lidong',
  'daxue',
  'xiaohan'
];

const solarTermProviderInfo = {
  providerId: 'local-solar-longitude-provider',
  provider: 'local-solar-longitude-search',
  version: 'solar-term-provider@0.1.0',
  status: 'local-astronomical-search',
  authority: 'local-astronomical-search',
  boundaryPolicy: 'jie-only-month-boundary',
  precisionNote: '当前使用太阳黄经本地二分搜索推算十二节令时刻；后续可替换为权威节气数据包。'
};

function normalizeAngle(value) {
  return ((value % 360) + 360) % 360;
}

function angleDiff(current, target) {
  return ((normalizeAngle(current - target) + 540) % 360) - 180;
}

function sunLongitude(date) {
  const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const meanLongitude = normalizeAngle(280.46646 + 0.98564736 * days);
  const anomaly = normalizeAngle(357.52911 + 0.98560028 * days) * Math.PI / 180;
  const center = 1.914602 * Math.sin(anomaly) + 0.019993 * Math.sin(2 * anomaly) + 0.000289 * Math.sin(3 * anomaly);
  return normalizeAngle(meanLongitude + center);
}

const solarTermCache = {};

function findSolarTermTime(year, term) {
  const cacheKey = `${year}-${term.key}`;
  if (solarTermCache[cacheKey]) {
    return new Date(solarTermCache[cacheKey]);
  }

  const termYear = term.month === 1 ? year + 1 : year;
  const approvedRecord = findSolarTermRecord({
    year: termYear,
    termKey: term.termKey || jieTermKeysByIndex[term.index]
  });
  if (approvedRecord) {
    solarTermCache[cacheKey] = approvedRecord.date.getTime();
    return new Date(solarTermCache[cacheKey]);
  }

  let start = new Date(termYear, term.month - 1, term.day - 3, 0, 0, 0, 0);
  let end = new Date(termYear, term.month - 1, term.day + 3, 0, 0, 0, 0);
  let startDiff = angleDiff(sunLongitude(start), term.angle);
  let endDiff = angleDiff(sunLongitude(end), term.angle);

  for (let expand = 0; startDiff > 0 || endDiff < 0; expand += 1) {
    if (expand > 6) break;
    start = new Date(start.getTime() - 86400000);
    end = new Date(end.getTime() + 86400000);
    startDiff = angleDiff(sunLongitude(start), term.angle);
    endDiff = angleDiff(sunLongitude(end), term.angle);
  }

  for (let i = 0; i < 42; i += 1) {
    const mid = new Date((start.getTime() + end.getTime()) / 2);
    const diff = angleDiff(sunLongitude(mid), term.angle);
    if (diff >= 0) {
      end = mid;
    } else {
      start = mid;
    }
  }

  solarTermCache[cacheKey] = end.getTime();
  return end;
}

function buildJieTimeline(year) {
  const list = [];
  [year - 1, year, year + 1].forEach((targetYear) => {
    jieTerms.forEach((term) => {
      list.push({ ...term, date: findSolarTermTime(targetYear, term) });
    });
  });
  return list.sort((a, b) => a.date - b.date);
}

function getActiveJie(date) {
  const timeline = buildJieTimeline(date.getFullYear());
  let active = timeline[0];
  timeline.forEach((term) => {
    if (term.date <= date) active = term;
  });
  return active;
}

function getAdjacentJie(date, direction) {
  const timeline = buildJieTimeline(date.getFullYear());
  if (direction > 0) {
    return timeline.find((term) => term.date > date) || timeline[timeline.length - 1];
  }
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    if (timeline[i].date < date) return timeline[i];
  }
  return timeline[0];
}

function getSolarTermProviderInfo() {
  const runtimeCoverage = getSolarTermDataPackCoverage();
  if (runtimeCoverage.runtimeEnabled) {
    return {
      ...solarTermProviderInfo,
      providerId: 'hko-solar-term-data-pack-with-local-fallback',
      provider: 'hko-solar-term-data-pack-with-local-fallback',
      version: 'solar-term-provider@0.2.0',
      status: 'hko-runtime-preview-with-local-fallback',
      authority: runtimeCoverage.primaryAuthority,
      precisionNote: '2024-2026 年优先使用香港天文台 HKO 官方节气 XML 分钟级时刻；范围外继续使用本地太阳黄经搜索兜底。',
      runtimeCoverage,
      fallbackProvider: 'local-solar-longitude-search'
    };
  }

  return { ...solarTermProviderInfo };
}

module.exports = {
  jieTerms,
  findSolarTermTime,
  buildJieTimeline,
  getActiveJie,
  getAdjacentJie,
  getSolarTermProviderInfo
};
